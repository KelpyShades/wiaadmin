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
      await ctx.scheduler.runAfter(0, api.emails.addSubscriberToResend, {
        email: args.email,
      });
    }

    // Send confirmation email
    await ctx.scheduler.runAfter(0, api.emails.sendApplicationConfirmation, {
      email: args.email,
      name: args.fullName,
      packageName: args.packageName,
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

    // Get bank details from settings
    const settings = await ctx.db.query("globalSettings").first();
    const bankAccountName = settings?.bankAccountName || "Women of Influence";
    const bankAccountNumber = settings?.bankAccountNumber || "N/A";
    const bankName = settings?.bankName || "N/A";

    const currencySymbols: Record<string, string> = {
      GHS: "GH₵",
      USD: "$",
      GBP: "£",
      EUR: "€",
      CAD: "CA$",
      NGN: "₦",
      KES: "KSh",
      ZAR: "R",
      EGP: "E£",
      MAD: "DH",
      DZD: "DA",
      TND: "DT",
      BWP: "P",
      RWF: "FRw",
      UGX: "USh",
      ZMW: "ZK",
      MZN: "MT",
      ETB: "Br",
      MUR: "₨",
      TZS: "TSh",
      XOF: "CFA",
      XAF: "FCFA",
      ZWG: "ZiG",
    };
    const symbol = currencySymbols[args.currency || "GHS"] || (args.currency || "GH₵");
    const isDecimal = ["USD", "GBP", "EUR", "CAD"].includes(args.currency || "GHS");
    const amountDisplay = symbol + " " + args.amount.toLocaleString(undefined, {
      minimumFractionDigits: isDecimal ? (args.amount % 1 !== 0 ? 2 : 0) : 0,
      maximumFractionDigits: 2,
    });

    // Send sponsorship confirmation with bank details
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
    });

    return sponsorshipId;
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
    // 1. Check if reference matches an application's paymentReference
    const application = await ctx.db
      .query("applications")
      .filter((q) => q.eq(q.field("paymentReference"), args.reference))
      .first();

    if (application) {
      const paymentStatus = args.status === "completed" || args.status === "success" 
        ? "success" 
        : args.status === "failed" 
          ? "failed" 
          : "pending";
      await ctx.db.patch(application._id, { paymentStatus });
      return { type: "application", id: application._id, status: paymentStatus };
    }

    // 2. Check if reference matches a sponsorship's paymentReference
    const sponsorship = await ctx.db
      .query("sponsorships")
      .filter((q) => q.eq(q.field("paymentReference"), args.reference))
      .first();

    if (sponsorship) {
      const status = args.status === "completed" || args.status === "success"
        ? "success"
        : args.status === "failed"
          ? "failed"
          : "pending";
      await ctx.db.patch(sponsorship._id, { status });
      return { type: "sponsorship", id: sponsorship._id, status };
    }

    // 3. Check if reference is a direct document ID
    try {
      // Check if reference is a valid ID for applications
      const appId = ctx.db.normalizeId("applications", args.reference);
      if (appId) {
        const appById = await ctx.db.get(appId);
        if (appById) {
          const paymentStatus = args.status === "completed" || args.status === "success"
            ? "success"
            : args.status === "failed"
              ? "failed"
              : "pending";
          await ctx.db.patch(appById._id, { paymentStatus });
          return { type: "application", id: appById._id, status: paymentStatus };
        }
      }

      // Check if reference is a valid ID for sponsorships
      const sponId = ctx.db.normalizeId("sponsorships", args.reference);
      if (sponId) {
        const sponById = await ctx.db.get(sponId);
        if (sponById) {
          const status = args.status === "completed" || args.status === "success"
            ? "success"
            : args.status === "failed"
              ? "failed"
              : "pending";
          await ctx.db.patch(sponById._id, { status });
          return { type: "sponsorship", id: sponById._id, status };
        }
      }
    } catch {
      // Reference was not a valid document ID format
    }

    return { type: "not_found" };
  },
});
