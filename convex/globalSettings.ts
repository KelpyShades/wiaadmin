import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getGlobalSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("globalSettings").first();
    
    // Provide default fallback values representing the original hardcoded layout
    const defaults = {
      heroQuote: "We are women of excellence, wisdom and wealth.",
      heroQuoteAuthor: "Emanuella Ulamba, Founder",
      seatsAvailable: 5,
      deadlineDate: "July 18, 2026",
      startDate: "July 27, 2026",
      stat1Value: "2",
      stat1Label: "Cohorts",
      stat2Value: "6",
      stat2Label: "Months",
      stat3Value: "7",
      stat3Label: "Pillars",
      foundationTotal: 600,
      foundationSecure: 300,
      foundationInstallment1Amount: 150,
      foundationInstallment1Month: "August",
      foundationInstallment2Amount: 150,
      foundationInstallment2Month: "September",
      fullExpTotal: 2500,
      fullExpSecure: 1500,
      fullExpInstallment1Amount: 500,
      fullExpInstallment1Month: "August",
      fullExpInstallment2Amount: 500,
      fullExpInstallment2Month: "September",
      heroImageId: undefined,
      imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    };

    if (!settings) {
      return defaults;
    }

    // Resolve the storage URL for the hero image if uploaded
    const imageUrl = settings.heroImageId 
      ? await ctx.storage.getUrl(settings.heroImageId) 
      : defaults.imageUrl;

    return { 
      ...defaults, 
      ...settings, 
      imageUrl: imageUrl || defaults.imageUrl 
    };
  },
});

export const updateGlobalSettings = mutation({
  args: {
    heroImageId: v.optional(v.id("_storage")),
    heroQuote: v.string(),
    heroQuoteAuthor: v.string(),
    seatsAvailable: v.number(),
    deadlineDate: v.string(),
    startDate: v.string(),
    stat1Value: v.string(),
    stat1Label: v.string(),
    stat2Value: v.string(),
    stat2Label: v.string(),
    stat3Value: v.string(),
    stat3Label: v.string(),
    foundationTotal: v.number(),
    foundationSecure: v.number(),
    foundationInstallment1Amount: v.number(),
    foundationInstallment1Month: v.string(),
    foundationInstallment2Amount: v.number(),
    foundationInstallment2Month: v.string(),
    fullExpTotal: v.number(),
    fullExpSecure: v.number(),
    fullExpInstallment1Amount: v.number(),
    fullExpInstallment1Month: v.string(),
    fullExpInstallment2Amount: v.number(),
    fullExpInstallment2Month: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("globalSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("globalSettings", args);
    }
  },
});
