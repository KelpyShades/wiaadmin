import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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
    return await ctx.db.insert("applications", {
      ...args,
      paymentStatus: "pending",
    });
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
