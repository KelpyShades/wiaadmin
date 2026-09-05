import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { resolveMediaUrl, deleteMediaFile } from "./files";

export const getBusinesses = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("businesses").collect();
    return Promise.all(
      records.map(async (record) => {
        const imageUrl = await resolveMediaUrl(ctx, record.imageId);
        return { ...record, imageUrl };
      })
    );
  },
});

export const addBusiness = mutation({
  args: {
    name: v.string(),
    founder: v.string(),
    description: v.string(),
    website: v.string(),
    imageId: v.optional(v.union(v.string(), v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("businesses", args);
  },
});

export const updateBusiness = mutation({
  args: {
    id: v.id("businesses"),
    name: v.string(),
    founder: v.string(),
    description: v.string(),
    website: v.string(),
    imageId: v.optional(v.union(v.string(), v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteBusiness = mutation({
  args: { id: v.id("businesses") },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.id);
    if (business?.imageId) {
      await deleteMediaFile(ctx, business.imageId);
    }
    await ctx.db.delete(args.id);
  },
});
