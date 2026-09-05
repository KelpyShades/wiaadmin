import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

export const getApplications = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("applications").order("desc").collect();
  },
});

export const getPartnerships = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("partnerships").order("desc").collect();
  },
});

export const updateApplicationStatus = mutation({
  args: {
    id: v.id("applications"),
    paymentStatus: v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { paymentStatus: args.paymentStatus });
  },
});

export const updatePartnershipStatus = mutation({
  args: {
    id: v.id("partnerships"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const submitApplication = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    country: v.string(),
    packageName: v.union(v.literal("The Foundation"), v.literal("The Full Experience")),
    pillars: v.array(v.string()),
    whyJoin: v.string(),
    vision: v.string(),
    referral: v.optional(v.string()),
    amount: v.number(),
    currency: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appId = await ctx.db.insert("applications", {
      ...args,
      paymentStatus: "pending",
    });
    
    // Add to newsletter
    const existingSub = await ctx.db
      .query("newsletterSubscribers")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!existingSub) {
      await ctx.db.insert("newsletterSubscribers", {
        email: args.email,
        subscribedAt: Date.now(),
      });
      // Note: We do not trigger the newsletter webhook action here because the application submission
      // will send an application confirmation webhook to the same shared newsletter webhook URL,
      // avoiding duplicate triggers/interference.
    }

    // Send confirmation email
    await ctx.scheduler.runAfter(0, api.emails.sendApplicationConfirmation, {
      fullName: args.fullName,
      email: args.email,
      phone: args.phone,
      country: args.country,
      packageName: args.packageName,
      pillars: args.pillars,
      whyJoin: args.whyJoin,
      vision: args.vision,
      referral: args.referral,
      amount: args.amount,
      currency: args.currency,
    });
    
    return appId;
  },
});

export const submitSponsorship = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    organization: v.optional(v.string()),
    amount: v.number(),
    currency: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
    sendBankDetailsEmail: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const sponsorshipId = await ctx.db.insert("sponsorships", {
      name: args.name,
      email: args.email,
      organization: args.organization,
      amount: args.amount,
      currency: args.currency,
      paymentReference: args.paymentReference,
      status: "pending",
    });

    // Only send the bank details email if not explicitly skipped (e.g. for non-African sponsorships)
    if (args.sendBankDetailsEmail !== false) {
      const settings = await ctx.db.query("globalSettings").first();
      const bankAccountName = settings?.bankAccountName || "Women of Influence";
      const bankAccountNumber = settings?.bankAccountNumber || "N/A";
      const bankName = settings?.bankName || "N/A";

      const currencySymbols: Record<string, string> = {
        GHS: "GH₵",
        USD: "$",
        NGN: "₦",
        GBP: "£",
        EUR: "€",
        CAD: "CA$",
        KES: "KSh"
      };
      const symbol = currencySymbols[args.currency || "GHS"] || (args.currency || "GH₵");
      const amountDisplay = symbol + " " + args.amount.toLocaleString(undefined, {
        minimumFractionDigits: ["USD", "GBP", "EUR", "CAD"].includes(args.currency || "GHS") ? 2 : 0,
        maximumFractionDigits: ["USD", "GBP", "EUR", "CAD"].includes(args.currency || "GHS") ? 2 : 0,
      });

      await ctx.scheduler.runAfter(0, api.emails.sendSponsorshipConfirmation, {
        email: args.email,
        name: args.name,
        amountDisplay,
        bankAccountName,
        bankAccountNumber,
        bankName,
        usdBankAccountName: settings?.usdBankAccountName,
        usdBankAccountNumber: settings?.usdBankAccountNumber,
        usdBankName: settings?.usdBankName,
        usdRoutingNumber: settings?.usdRoutingNumber,
        usdSwiftCode: settings?.usdSwiftCode,
        eurBankAccountName: settings?.eurBankAccountName,
        eurIban: settings?.eurIban,
        eurBankName: settings?.eurBankName,
        eurSwiftCode: settings?.eurSwiftCode,
        isBackup: false,
      });
    }

    return sponsorshipId;
  },
});

export const triggerSponsorshipBackupBankDetails = mutation({
  args: {
    id: v.id("sponsorships"),
  },
  handler: async (ctx, args) => {
    const sponsorship = await ctx.db.get(args.id);
    if (!sponsorship) return { success: false, error: "Sponsorship not found" };

    const settings = await ctx.db.query("globalSettings").first();
    const bankAccountName = settings?.bankAccountName || "Women of Influence";
    const bankAccountNumber = settings?.bankAccountNumber || "N/A";
    const bankName = settings?.bankName || "N/A";

    const currencySymbols: Record<string, string> = {
      GHS: "GH₵",
      USD: "$",
      NGN: "₦",
      GBP: "£",
      EUR: "€",
      CAD: "CA$",
      KES: "KSh"
    };
    const symbol = currencySymbols[sponsorship.currency || "GHS"] || (sponsorship.currency || "GH₵");
    const amountDisplay = symbol + " " + sponsorship.amount.toLocaleString(undefined, {
      minimumFractionDigits: ["USD", "GBP", "EUR", "CAD"].includes(sponsorship.currency || "GHS") ? 2 : 0,
      maximumFractionDigits: ["USD", "GBP", "EUR", "CAD"].includes(sponsorship.currency || "GHS") ? 2 : 0,
    });

    await ctx.scheduler.runAfter(0, api.emails.sendSponsorshipConfirmation, {
      email: sponsorship.email,
      name: sponsorship.name,
      amountDisplay,
      bankAccountName,
      bankAccountNumber,
      bankName,
      usdBankAccountName: settings?.usdBankAccountName,
      usdBankAccountNumber: settings?.usdBankAccountNumber,
      usdBankName: settings?.usdBankName,
      usdRoutingNumber: settings?.usdRoutingNumber,
      usdSwiftCode: settings?.usdSwiftCode,
      eurBankAccountName: settings?.eurBankAccountName,
      eurIban: settings?.eurIban,
      eurBankName: settings?.eurBankName,
      eurSwiftCode: settings?.eurSwiftCode,
      isBackup: true,
    });

    return { success: true };
  },
});

export const submitPartnership = mutation({
  args: {
    name: v.string(),
    organization: v.optional(v.string()),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("partnerships", {
      ...args,
      status: "pending",
    });
  },
});

export const getSponsorships = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sponsorships").order("desc").collect();
  },
});

export const updateSponsorshipStatus = mutation({
  args: {
    id: v.id("sponsorships"),
    status: v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const deleteSponsorship = mutation({
  args: { id: v.id("sponsorships") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const deleteApplication = mutation({
  args: { id: v.id("applications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const deletePartnership = mutation({
  args: { id: v.id("partnerships") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updatePaymentStatusByReference = mutation({
  args: {
    reference: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const isSuccess = args.status === "completed" || args.status === "success";
    const isFailed = args.status === "failed";

    // 1. Check if reference matches an application's paymentReference
    const application = await ctx.db
      .query("applications")
      .filter((q) => q.eq(q.field("paymentReference"), args.reference))
      .first();

    if (application) {
      const paymentStatus = isSuccess ? "success" : isFailed ? "failed" : "pending";
      await ctx.db.patch(application._id, { paymentStatus });
      return { type: "application", id: application._id, status: paymentStatus };
    }

    const currencySymbols: Record<string, string> = {
      GHS: "GH₵",
      USD: "$",
      NGN: "₦",
      GBP: "£",
      EUR: "€",
      CAD: "CA$",
      KES: "KSh"
    };

    // 2. Check if reference matches a sponsorship's paymentReference
    const sponsorship = await ctx.db
      .query("sponsorships")
      .filter((q) => q.eq(q.field("paymentReference"), args.reference))
      .first();

    if (sponsorship) {
      const status = isSuccess ? "success" : isFailed ? "failed" : "pending";
      await ctx.db.patch(sponsorship._id, { status });

      const symbol = currencySymbols[sponsorship.currency || "GHS"] || (sponsorship.currency || "GH₵");
      const amountDisplay = symbol + " " + sponsorship.amount.toLocaleString(undefined, {
        minimumFractionDigits: ["USD", "GBP", "EUR", "CAD"].includes(sponsorship.currency || "GHS") ? 2 : 0,
        maximumFractionDigits: ["USD", "GBP", "EUR", "CAD"].includes(sponsorship.currency || "GHS") ? 2 : 0,
      });

      if (isSuccess) {
        await ctx.scheduler.runAfter(0, api.emails.sendSponsorshipPaymentSuccess, {
          email: sponsorship.email,
          name: sponsorship.name,
          amountDisplay,
          currency: sponsorship.currency,
          paymentReference: args.reference,
          organization: sponsorship.organization,
        });
      } else if (isFailed) {
        const settings = await ctx.db.query("globalSettings").first();
        await ctx.scheduler.runAfter(0, api.emails.sendSponsorshipConfirmation, {
          email: sponsorship.email,
          name: sponsorship.name,
          amountDisplay,
          bankAccountName: settings?.bankAccountName || "Women of Influence",
          bankAccountNumber: settings?.bankAccountNumber || "N/A",
          bankName: settings?.bankName || "N/A",
          usdBankAccountName: settings?.usdBankAccountName,
          usdBankAccountNumber: settings?.usdBankAccountNumber,
          usdBankName: settings?.usdBankName,
          usdRoutingNumber: settings?.usdRoutingNumber,
          usdSwiftCode: settings?.usdSwiftCode,
          eurBankAccountName: settings?.eurBankAccountName,
          eurIban: settings?.eurIban,
          eurBankName: settings?.eurBankName,
          eurSwiftCode: settings?.eurSwiftCode,
          isBackup: true,
        });
      }

      return { type: "sponsorship", id: sponsorship._id, status };
    }

    // 3. Check if reference is a direct document ID
    try {
      // Check if reference is a valid ID for applications
      const appId = ctx.db.normalizeId("applications", args.reference);
      if (appId) {
        const appById = await ctx.db.get(appId);
        if (appById) {
          const paymentStatus = isSuccess ? "success" : isFailed ? "failed" : "pending";
          await ctx.db.patch(appById._id, { paymentStatus });
          return { type: "application", id: appById._id, status: paymentStatus };
        }
      }

      // Check if reference is a valid ID for sponsorships
      const sponId = ctx.db.normalizeId("sponsorships", args.reference);
      if (sponId) {
        const sponById = await ctx.db.get(sponId);
        if (sponById) {
          const status = isSuccess ? "success" : isFailed ? "failed" : "pending";
          await ctx.db.patch(sponById._id, { status });

          const symbol = currencySymbols[sponById.currency || "GHS"] || (sponById.currency || "GH₵");
          const amountDisplay = symbol + " " + sponById.amount.toLocaleString(undefined, {
            minimumFractionDigits: ["USD", "GBP", "EUR", "CAD"].includes(sponById.currency || "GHS") ? 2 : 0,
            maximumFractionDigits: ["USD", "GBP", "EUR", "CAD"].includes(sponById.currency || "GHS") ? 2 : 0,
          });

          if (isSuccess) {
            await ctx.scheduler.runAfter(0, api.emails.sendSponsorshipPaymentSuccess, {
              email: sponById.email,
              name: sponById.name,
              amountDisplay,
              currency: sponById.currency,
              paymentReference: args.reference,
              organization: sponById.organization,
            });
          } else if (isFailed) {
            const settings = await ctx.db.query("globalSettings").first();
            await ctx.scheduler.runAfter(0, api.emails.sendSponsorshipConfirmation, {
              email: sponById.email,
              name: sponById.name,
              amountDisplay,
              bankAccountName: settings?.bankAccountName || "Women of Influence",
              bankAccountNumber: settings?.bankAccountNumber || "N/A",
              bankName: settings?.bankName || "N/A",
              usdBankAccountName: settings?.usdBankAccountName,
              usdBankAccountNumber: settings?.usdBankAccountNumber,
              usdBankName: settings?.usdBankName,
              usdRoutingNumber: settings?.usdRoutingNumber,
              usdSwiftCode: settings?.usdSwiftCode,
              eurBankAccountName: settings?.eurBankAccountName,
              eurIban: settings?.eurIban,
              eurBankName: settings?.eurBankName,
              eurSwiftCode: settings?.eurSwiftCode,
              isBackup: true,
            });
          }

          return { type: "sponsorship", id: sponById._id, status };
        }
      }
    } catch (e) {
      // Reference was not a valid document ID format
    }

    return { type: "not_found" };
  },
});
