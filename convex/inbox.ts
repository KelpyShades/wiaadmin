import { v } from "convex/values";
import { query, mutation, MutationCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

const CURRENCY_SYMBOLS: Record<string, string> = {
  GHS: "GH₵",
  USD: "$",
  NGN: "₦",
  GBP: "£",
  EUR: "€",
  CAD: "CA$",
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

const ZERO_DECIMAL_CURRENCIES = new Set([
  "GHS", "NGN", "KES", "UGX", "RWF", "TZS", "XOF", "XAF", "BIF", "CLP",
  "DJF", "GNF", "IDR", "JPY", "KMF", "KRW", "MGA", "PYG", "VND", "VUV",
  "XPF", "SLE", "LRD", "MWK", "CDF", "SOS",
]);

function getCurrencySymbol(code: string): string {
  if (CURRENCY_SYMBOLS[code]) return CURRENCY_SYMBOLS[code];
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    const sym = parts.find((p) => p.type === "currency")?.value;
    if (sym) return sym;
  } catch {
    // Fallback to currency code
  }
  return code;
}

function formatSponsorshipAmount(amount: number, currency?: string): string {
  const code = (currency || "GHS").toUpperCase();
  const symbol = getCurrencySymbol(code);
  const hasDecimals = !ZERO_DECIMAL_CURRENCIES.has(code);
  return (
    symbol +
    " " +
    amount.toLocaleString("en-US", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: hasDecimals ? 2 : 0,
    })
  );
}

async function scheduleSponsorshipBankDetailsEmail(
  ctx: MutationCtx,
  sponsorship: {
    email: string;
    name: string;
    amount: number;
    currency?: string;
  },
  isBackup: boolean
) {
  const settings = await ctx.db.query("globalSettings").first();
  const bankAccountName = settings?.bankAccountName || "Women of Influence";
  const bankAccountNumber = settings?.bankAccountNumber || "N/A";
  const bankName = settings?.bankName || "N/A";
  const amountDisplay = formatSponsorshipAmount(
    sponsorship.amount,
    sponsorship.currency
  );

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
    isBackup,
  });
}

async function scheduleSponsorshipPaymentSuccessEmail(
  ctx: MutationCtx,
  sponsorship: Doc<"sponsorships">,
  paymentReference?: string
) {
  const amountDisplay = formatSponsorshipAmount(
    sponsorship.amount,
    sponsorship.currency
  );

  await ctx.scheduler.runAfter(0, api.emails.sendSponsorshipPaymentSuccess, {
    email: sponsorship.email,
    name: sponsorship.name,
    amountDisplay,
    currency: sponsorship.currency,
    paymentReference:
      paymentReference || sponsorship.paymentReference || sponsorship._id,
    organization: sponsorship.organization,
  });
}

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

    // Only send the bank details email if not explicitly skipped (e.g. for online African payments)
    if (args.sendBankDetailsEmail !== false) {
      await scheduleSponsorshipBankDetailsEmail(
        ctx,
        {
          email: args.email,
          name: args.name,
          amount: args.amount,
          currency: args.currency,
        },
        false
      );
    }

    return sponsorshipId;
  },
});

export const attachSponsorshipPaymentReference = mutation({
  args: {
    id: v.id("sponsorships"),
    paymentReference: v.string(),
  },
  handler: async (ctx, args) => {
    const sponsorship = await ctx.db.get(args.id);
    if (!sponsorship) return { success: false, error: "Sponsorship not found" };
    await ctx.db.patch(args.id, { paymentReference: args.paymentReference });
    return { success: true };
  },
});

export const triggerSponsorshipBackupBankDetails = mutation({
  args: {
    id: v.id("sponsorships"),
  },
  handler: async (ctx, args) => {
    const sponsorship = await ctx.db.get(args.id);
    if (!sponsorship) return { success: false, error: "Sponsorship not found" };

    await scheduleSponsorshipBankDetailsEmail(ctx, sponsorship, true);

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
    const sponsorship = await ctx.db.get(args.id);
    if (!sponsorship) return;

    const previousStatus = sponsorship.status;
    await ctx.db.patch(args.id, { status: args.status });

    if (args.status === "success" && previousStatus !== "success") {
      await scheduleSponsorshipPaymentSuccessEmail(ctx, sponsorship);
    }
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
    externalId: v.optional(v.string()),
    status: v.string(),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedStatus = args.status.trim().toLowerCase();
    const normalizedEvent = (args.eventType || "").trim().toLowerCase();

    const successStatuses = new Set([
      "completed",
      "complete",
      "success",
      "successful",
      "succeeded",
      "confirmed",
      "paid",
      "settled",
    ]);
    const failedStatuses = new Set([
      "failed",
      "fail",
      "canceled",
      "cancelled",
      "expired",
      "declined",
      "rejected",
    ]);

    const isSuccess =
      successStatuses.has(normalizedStatus) ||
      (!normalizedStatus &&
        (normalizedEvent.endsWith(".completed") ||
          normalizedEvent.endsWith(".confirmed") ||
          normalizedEvent.endsWith(".succeeded")));
    const isFailed =
      failedStatuses.has(normalizedStatus) ||
      (!normalizedStatus &&
        (normalizedEvent.endsWith(".failed") ||
          normalizedEvent.endsWith(".canceled") ||
          normalizedEvent.endsWith(".cancelled")));

    const candidateRefs = Array.from(
      new Set(
        [args.reference, args.externalId]
          .filter((r): r is string => typeof r === "string" && r.trim().length > 0)
          .map((r) => r.trim())
      )
    );

    // 1. Check if any candidate reference matches an application
    for (const ref of candidateRefs) {
      let application = await ctx.db
        .query("applications")
        .filter((q) => q.eq(q.field("paymentReference"), ref))
        .first();

      if (!application) {
        try {
          const appId = ctx.db.normalizeId("applications", ref);
          if (appId) {
            application = await ctx.db.get(appId);
          }
        } catch {
          // Not a valid applications document ID
        }
      }

      if (application) {
        const paymentStatus =
          application.paymentStatus === "success" && !isFailed
            ? "success"
            : isSuccess
              ? "success"
              : isFailed
                ? "failed"
                : "pending";
        await ctx.db.patch(application._id, { paymentStatus });
        return { type: "application", id: application._id, status: paymentStatus };
      }
    }

    // 2. Check if any candidate reference matches a sponsorship
    for (const ref of candidateRefs) {
      let sponsorship = await ctx.db
        .query("sponsorships")
        .filter((q) => q.eq(q.field("paymentReference"), ref))
        .first();

      if (!sponsorship) {
        try {
          const sponId = ctx.db.normalizeId("sponsorships", ref);
          if (sponId) {
            sponsorship = await ctx.db.get(sponId);
          }
        } catch {
          // Not a valid sponsorships document ID
        }
      }

      if (sponsorship) {
        const previousStatus = sponsorship.status;
        const status =
          previousStatus === "success" && !isFailed
            ? "success"
            : isSuccess
              ? "success"
              : isFailed
                ? "failed"
                : "pending";
        await ctx.db.patch(sponsorship._id, {
          status,
          ...(args.externalId && !sponsorship.paymentReference
            ? { paymentReference: args.externalId }
            : {}),
        });

        if (isSuccess && previousStatus !== "success") {
          await scheduleSponsorshipPaymentSuccessEmail(
            ctx,
            sponsorship,
            args.externalId || args.reference
          );
        } else if (isFailed && previousStatus !== "failed") {
          await scheduleSponsorshipBankDetailsEmail(ctx, sponsorship, true);
        }

        return { type: "sponsorship", id: sponsorship._id, status };
      }
    }

    return { type: "not_found" };
  },
});
