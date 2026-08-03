import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const subscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // Check if already subscribed
    const existing = await ctx.db
      .query("newsletterSubscribers")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!existing) {
      await ctx.db.insert("newsletterSubscribers", {
        email: args.email,
        subscribedAt: Date.now(),
      });

      // Call action to send to Resend
      await ctx.scheduler.runAfter(0, api.emails.addSubscriberToResend, {
        email: args.email,
      });
    }
  },
});
