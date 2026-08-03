import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    inviteToken: v.optional(v.union(v.string(), v.null())),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  // Admin Roles (Mapping a Convex Auth userId to an Admin role)
  userRoles: defineTable({
    userId: v.id("users"),
    role: v.literal("admin"),
  }).index("by_userId", ["userId"]),

  // Invites for new admins
  invites: defineTable({
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
    role: v.literal("admin"),
  }).index("by_token", ["token"]),

  // Global Settings
  globalSettings: defineTable({
    // Hero Section
    heroImageId: v.optional(v.id("_storage")),
    heroQuote: v.string(),
    heroQuoteAuthor: v.string(),
    
    // Cohort details
    seatsAvailable: v.number(),
    deadlineDate: v.string(),
    startDate: v.string(),
    
    // Stats Section
    stat1Value: v.string(),
    stat1Label: v.string(),
    stat2Value: v.string(),
    stat2Label: v.string(),
    stat3Value: v.string(),
    stat3Label: v.string(),

    // Foundation pricing & schedule
    foundationTotal: v.number(),
    foundationSecure: v.number(),
    foundationInstallment1Amount: v.number(),
    foundationInstallment1Month: v.string(),
    foundationInstallment2Amount: v.number(),
    foundationInstallment2Month: v.string(),

    // Full Experience pricing & schedule
    fullExpTotal: v.number(),
    fullExpSecure: v.number(),
    fullExpInstallment1Amount: v.number(),
    fullExpInstallment1Month: v.string(),
    fullExpInstallment2Amount: v.number(),
    fullExpInstallment2Month: v.string(),

    // Bank Details for Sponsorships
    bankAccountName: v.optional(v.string()),
    bankAccountNumber: v.optional(v.string()),
    bankName: v.optional(v.string()),
  }),

  // Testimonials & Success Stories
  testimonials: defineTable({
    name: v.string(),
    role: v.string(),
    quote: v.optional(v.string()), // For written
    imageId: v.optional(v.id("_storage")), // Uploaded via Convex Storage
    videoId: v.optional(v.id("_storage")), // Uploaded via Convex Storage
    type: v.union(v.literal("written"), v.literal("video"), v.literal("success_story")),
    achievement: v.optional(v.string()), // For success stories
  }),

  // Alumni Businesses
  businesses: defineTable({
    name: v.string(),
    founder: v.string(),
    description: v.string(),
    website: v.string(),
    imageId: v.optional(v.id("_storage")), // Uploaded via Convex Storage
  }),

  // Gallery (Images, Videos, Awards)
  gallery: defineTable({
    caption: v.string(),
    category: v.string(),
    fileId: v.id("_storage"), // Uploaded via Convex Storage
    type: v.union(v.literal("image"), v.literal("video"), v.literal("award")),
  }),

  // Community Resources
  resourceCategories: defineTable({
    title: v.string(),
    iconType: v.string(), // Maps to lucide-react icons
  }),
  resources: defineTable({
    categoryId: v.id("resourceCategories"),
    title: v.string(),
    description: v.optional(v.string()),
    url: v.optional(v.string()),
  }),

  // Form Submissions (Leads & Payments)
  applications: defineTable({
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    country: v.string(),
    packageName: v.union(v.literal("The Foundation"), v.literal("The Full Experience")),
    pillars: v.array(v.string()),
    whyJoin: v.string(),
    vision: v.string(),
    referral: v.optional(v.string()),
    amount: v.number(), // Amount paid
    paymentReference: v.optional(v.string()), // Paystack reference
    paymentStatus: v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
  }),
  
  sponsorships: defineTable({
    name: v.string(),
    email: v.string(),
    organization: v.optional(v.string()),
    amount: v.number(),
    status: v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
  }),
  
  partnerships: defineTable({
    name: v.string(),
    organization: v.optional(v.string()),
    email: v.string(),
    message: v.string(),
    status: v.string(),
  }),

  // Executives
  executives: defineTable({
    name: v.string(),
    role: v.string(),
    bio: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")), // Uploaded via Convex Storage
    order: v.number(),
  }),

  // Newsletter Subscribers
  newsletterSubscribers: defineTable({
    email: v.string(),
    subscribedAt: v.number(),
  })
});
