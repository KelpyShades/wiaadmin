import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getTestimonials = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("testimonials").order("desc").collect();
    
    // Resolve URLs for images/videos
    return Promise.all(
      records.map(async (record) => {
        const imageUrl = record.imageId ? await ctx.storage.getUrl(record.imageId) : null;
        const videoUrl = record.videoId ? await ctx.storage.getUrl(record.videoId) : null;
        return { ...record, imageUrl, videoUrl };
      })
    );
  },
});

export const addTestimonial = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    quote: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    videoId: v.optional(v.id("_storage")),
    type: v.union(v.literal("written"), v.literal("video"), v.literal("success_story")),
    achievement: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("testimonials", args);
  },
});

export const updateTestimonial = mutation({
  args: {
    id: v.id("testimonials"),
    name: v.string(),
    role: v.string(),
    quote: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    videoId: v.optional(v.id("_storage")),
    type: v.union(v.literal("written"), v.literal("video"), v.literal("success_story")),
    achievement: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteTestimonial = mutation({
  args: { id: v.id("testimonials") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
