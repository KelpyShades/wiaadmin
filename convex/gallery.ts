import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { resolveMediaUrl, deleteMediaFile } from "./files";

export const getGallery = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("gallery").order("desc").collect();
    return Promise.all(
      records.map(async (record) => {
        const url = await resolveMediaUrl(ctx, record.fileId);
        return { ...record, url };
      })
    );
  },
});

export const addGalleryItem = mutation({
  args: {
    caption: v.string(),
    category: v.string(),
    fileId: v.union(v.string(), v.id("_storage")),
    type: v.union(v.literal("image"), v.literal("video"), v.literal("award")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("gallery", args);
  },
});

export const deleteGalleryItem = mutation({
  args: { id: v.id("gallery") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (item?.fileId) {
      await deleteMediaFile(ctx, item.fileId);
    }
    await ctx.db.delete(args.id);
  },
});
