import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getResources = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("resourceCategories").collect();
    const resources = await ctx.db.query("resources").collect();
    
    return categories.map((cat) => {
      const items = resources.filter((res) => res.categoryId === cat._id);
      return {
        ...cat,
        items,
      };
    });
  },
});

export const addCategory = mutation({
  args: {
    title: v.string(),
    iconType: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("resourceCategories", args);
  },
});

export const deleteCategory = mutation({
  args: { id: v.id("resourceCategories") },
  handler: async (ctx, args) => {
    // Delete all resources under this category first
    const resources = await ctx.db
      .query("resources")
      .filter((q) => q.eq(q.field("categoryId"), args.id))
      .collect();
      
    for (const res of resources) {
      await ctx.db.delete(res._id);
    }
    
    await ctx.db.delete(args.id);
  },
});

export const addResource = mutation({
  args: {
    categoryId: v.id("resourceCategories"),
    title: v.string(),
    description: v.optional(v.string()),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("resources", args);
  },
});

export const deleteResource = mutation({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
