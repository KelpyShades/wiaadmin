import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v, ConvexError } from "convex/values";

export const initFirstAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Must be logged in to become an admin");

    // Check if any admins already exist
    const existingAdmins = await ctx.db.query("userRoles").collect();
    if (existingAdmins.length > 0) {
      throw new ConvexError("An admin already exists.");
    }

    // Promote the current user
    await ctx.db.insert("userRoles", {
      userId,
      role: "admin",
    });

    return true;
  },
});

export const hasAdmins = query({
  args: {},
  handler: async (ctx) => {
    const adminRoles = await ctx.db
      .query("userRoles")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();
      
    const users = await ctx.db.query("users").take(1);
    return users.length > 0;
  },
});

export const backfillAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const user = users.find(u => u.email === args.email);
    
    if (!user) {
      throw new ConvexError(`User with email ${args.email} not found.`);
    }

      const existingRole = await ctx.db
        .query("userRoles")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .unique();

    if (!existingRole) {
      await ctx.db.insert("userRoles", {
        userId: user._id,
        role: "admin",
      });
      return `Added admin role for ${args.email}`;
    }

    return `User ${args.email} is already an admin`;
  },
});
