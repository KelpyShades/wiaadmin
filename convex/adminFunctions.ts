import {
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { mutation, query, ActionCtx, QueryCtx, MutationCtx } from "./_generated/server";
import { DataModel } from "./_generated/dataModel";

import { ConvexError } from "convex/values";

import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Not authenticated");

  const user = await ctx.db.get(userId);
  if (!user) throw new ConvexError("User not found");

  const adminRole = await ctx.db
    .query("userRoles")
    .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
    .filter((q: any) => q.eq(q.field("role"), "admin"))
    .unique();

  if (!adminRole) {
    throw new ConvexError("Unauthorized: Admin access required");
  }

  return user;
}

export const adminQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const adminUser = await requireAdmin(ctx);
    return { adminUser };
  })
);

export const adminMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const adminUser = await requireAdmin(ctx);
    return { adminUser };
  })
);
