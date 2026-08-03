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
  },
  handler: async (ctx, args) => {
    const sponsorshipId = await ctx.db.insert("sponsorships", {
      ...args,
      status: "pending",
    });

    // Get bank details from settings
    const settings = await ctx.db.query("globalSettings").first();
    const bankAccountName = settings?.bankAccountName || "Women of Influence";
    const bankAccountNumber = settings?.bankAccountNumber || "N/A";
    const bankName = settings?.bankName || "N/A";

    // Send sponsorship confirmation with bank details
    await ctx.scheduler.runAfter(0, api.emails.sendSponsorshipConfirmation, {
      email: args.email,
      name: args.name,
      amountDisplay: "GH₵ " + args.amount,
      bankAccountName,
      bankAccountNumber,
      bankName,
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
