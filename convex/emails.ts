"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";

export const addSubscriberToResend = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const webhookUrl = process.env.MAKE_NEWSLETTER_WEBHOOK;
    if (!webhookUrl) {
      console.warn("⚠️ MAKE_NEWSLETTER_WEBHOOK environment variable is not set. Skipping webhook.");
      return;
    }

    console.log(`📤 Sending newsletter subscription webhook to Make for: ${args.email}...`);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: args.email,
          event: "newsletter_subscribed",
          timestamp: Date.now(),
        }),
      });
      console.log(`📥 Make responded with status: ${response.status} (${response.statusText})`);
      if (!response.ok) {
        throw new Error(`Make returned status ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Failed to send newsletter subscriber to Make:", error);
    }
  }
});

export const sendApplicationConfirmation = action({
  args: {
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    country: v.string(),
    packageName: v.string(),
    pillars: v.array(v.string()),
    whyJoin: v.string(),
    vision: v.string(),
    referral: v.optional(v.string()),
    amount: v.number(),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const webhookUrl = process.env.MAKE_NEWSLETTER_WEBHOOK;
    if (!webhookUrl) {
      console.warn("⚠️ MAKE_NEWSLETTER_WEBHOOK environment variable is not set. Skipping webhook.");
      return;
    }

    console.log(`📤 Sending application webhook to Make for: ${args.fullName} (${args.email})...`);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...args,
          event: "application_submitted",
          timestamp: Date.now(),
        }),
      });
      console.log(`📥 Make responded with status: ${response.status} (${response.statusText})`);
      if (!response.ok) {
        throw new Error(`Make returned status ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Failed to send application confirmation to Make:", error);
    }
  }
});

export const sendSponsorshipConfirmation = action({
  args: {
    email: v.string(),
    name: v.string(),
    amountDisplay: v.string(),
    bankAccountName: v.string(),
    bankAccountNumber: v.string(),
    bankName: v.string(),
    usdBankAccountName: v.optional(v.string()),
    usdBankAccountNumber: v.optional(v.string()),
    usdBankName: v.optional(v.string()),
    usdRoutingNumber: v.optional(v.string()),
    usdSwiftCode: v.optional(v.string()),
    eurBankAccountName: v.optional(v.string()),
    eurIban: v.optional(v.string()),
    eurBankName: v.optional(v.string()),
    eurSwiftCode: v.optional(v.string()),
    isBackup: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const webhookUrl = process.env.MAKE_SPONSORSHIP_WEBHOOK;
    if (!webhookUrl) {
      console.warn("⚠️ MAKE_SPONSORSHIP_WEBHOOK environment variable is not set. Skipping webhook.");
      return;
    }

    const eventName = args.isBackup ? "sponsorship_backup_bank_details" : "sponsorship_intent_submitted";
    console.log(`📤 Sending sponsorship bank details webhook (${eventName}) to Make for: ${args.name} (${args.email})...`);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: args.email,
          name: args.name,
          amountDisplay: args.amountDisplay,
          bankAccountName: args.bankAccountName,
          bankAccountNumber: args.bankAccountNumber,
          bankName: args.bankName,
          usdBankAccountName: args.usdBankAccountName,
          usdBankAccountNumber: args.usdBankAccountNumber,
          usdBankName: args.usdBankName,
          usdRoutingNumber: args.usdRoutingNumber,
          usdSwiftCode: args.usdSwiftCode,
          eurBankAccountName: args.eurBankAccountName,
          eurIban: args.eurIban,
          eurBankName: args.eurBankName,
          eurSwiftCode: args.eurSwiftCode,
          event: eventName,
          type: "bank_details",
          isBackup: args.isBackup ?? false,
          timestamp: Date.now(),
        }),
      });
      console.log(`📥 Make responded with status: ${response.status} (${response.statusText})`);
      if (!response.ok) {
        throw new Error(`Make returned status ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Failed to send sponsorship confirmation to Make:", error);
    }
  }
});

export const sendSponsorshipPaymentSuccess = action({
  args: {
    email: v.string(),
    name: v.string(),
    amountDisplay: v.string(),
    currency: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
    organization: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const webhookUrl = process.env.MAKE_PAYMENT_SUCCESS_WEBHOOK || process.env.MAKE_SPONSORSHIP_WEBHOOK;
    if (!webhookUrl) {
      console.warn("⚠️ MAKE_SPONSORSHIP_WEBHOOK / MAKE_PAYMENT_SUCCESS_WEBHOOK is not set. Skipping webhook.");
      return;
    }

    console.log(`📤 Sending sponsorship payment success (Thank You) webhook to Make for: ${args.name} (${args.email})...`);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: args.email,
          name: args.name,
          organization: args.organization,
          amountDisplay: args.amountDisplay,
          currency: args.currency,
          paymentReference: args.paymentReference,
          status: "success",
          event: "sponsorship_payment_success",
          type: "payment_thank_you",
          timestamp: Date.now(),
        }),
      });
      console.log(`📥 Make responded with status: ${response.status} (${response.statusText})`);
      if (!response.ok) {
        throw new Error(`Make returned status ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Failed to send sponsorship payment success to Make:", error);
    }
  }
});
