import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { resolveMediaUrl, deleteMediaFile } from "./files";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const checkAdmin = async (ctx: any) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthenticated");
  }

  const role = await ctx.db
    .query("userRoles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();

  if (!role || role.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return userId;
};

export const getExecutives = query({
  args: {},
  handler: async (ctx) => {
    const executives = await ctx.db
      .query("executives")
      .collect();
      
    const sorted = executives.sort((a, b) => a.order - b.order);
      
    return Promise.all(
      sorted.map(async (executive) => {
        return {
          ...executive,
          imageUrl: await resolveMediaUrl(ctx, executive.imageId),
        };
      })
    );
  },
});

export const addExecutive = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    bio: v.optional(v.string()),
    imageId: v.optional(v.union(v.string(), v.id("_storage"))),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    return await ctx.db.insert("executives", args);
  },
});

export const updateExecutive = mutation({
  args: {
    id: v.id("executives"),
    name: v.string(),
    role: v.string(),
    bio: v.optional(v.string()),
    imageId: v.optional(v.union(v.string(), v.id("_storage"))),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const removeExecutive = mutation({
  args: { id: v.id("executives") },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);
    const executive = await ctx.db.get(args.id);
    if (!executive) throw new Error("Executive not found");

    if (executive.imageId) {
      await deleteMediaFile(ctx, executive.imageId);
    }

    await ctx.db.delete(args.id);
  },
});
