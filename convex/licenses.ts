import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { resolveMediaUrl, deleteMediaFile } from "./files";

export const getLicenses = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("licenses").collect();
    return Promise.all(
      records.map(async (record) => {
        const imageUrl = await resolveMediaUrl(ctx, record.imageId);
        return { ...record, imageUrl };
      })
    );
  },
});

export const addLicense = mutation({
  args: {
    country: v.string(),
    body: v.string(),
    licenseName: v.string(),
    licenseNumber: v.string(),
    flagCode: v.optional(v.string()),
    imageId: v.optional(v.union(v.string(), v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("licenses", args);
  },
});

export const updateLicense = mutation({
  args: {
    id: v.id("licenses"),
    country: v.string(),
    body: v.string(),
    licenseName: v.string(),
    licenseNumber: v.string(),
    flagCode: v.optional(v.string()),
    imageId: v.optional(v.union(v.string(), v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteLicense = mutation({
  args: { id: v.id("licenses") },
  handler: async (ctx, args) => {
    const lic = await ctx.db.get(args.id);
    if (lic?.imageId) {
      await deleteMediaFile(ctx, lic.imageId);
    }
    await ctx.db.delete(args.id);
  },
});
