"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "@convex-dev/resend";
import { Resend as ResendSDK } from "resend";
import { components } from "./_generated/api";

const resend = new Resend(components.resend, { testMode: false });

export const addSubscriberToResend = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // You do not need process.env checks anymore because the component handles missing envs or we can just let it attempt to send.
    // If the component requires RESEND_API_KEY, it'll use the environment variable automatically.
    
    const resendSdk = new ResendSDK(process.env.RESEND_API_KEY);
    
    if (process.env.RESEND_AUDIENCE_ID) {
      try {
        await resendSdk.contacts.create({
          email: args.email,
          unsubscribed: false,
          audienceId: process.env.RESEND_AUDIENCE_ID,
        });
      } catch (error) {
        console.error("Failed to add contact to Resend Audience:", error);
      }
    } else {
      console.warn("RESEND_AUDIENCE_ID is missing. Sending welcome email but skipping audience addition.");
    }
    
    try {
      await resend.sendEmail(ctx, {
        from: "Women of Influence <onboarding@resend.dev>",
        to: args.email,
        subject: "Welcome to Women of Influence Academy",
        html: "<p>Thank you for subscribing to our newsletter! We will be sharing updates and opportunities with you soon.</p>"
      });
    } catch (error) {
      console.error("Failed to add subscriber to resend", error);
    }
  }
});

export const sendApplicationConfirmation = action({
  args: { 
    email: v.string(), 
    name: v.string(), 
    packageName: v.string() 
  },
  handler: async (ctx, args) => {
    const resendSdk = new ResendSDK(process.env.RESEND_API_KEY);
    
    if (process.env.RESEND_AUDIENCE_ID) {
      try {
        await resendSdk.contacts.create({
          email: args.email,
          firstName: args.name.split(" ")[0],
          lastName: args.name.split(" ").slice(1).join(" "),
          unsubscribed: false,
          audienceId: process.env.RESEND_AUDIENCE_ID,
        });
      } catch (error) {
        console.error("Failed to add contact to Resend Audience:", error);
      }
    } else {
      console.warn("RESEND_AUDIENCE_ID is missing. Skipping audience addition.");
    }
    
    try {
      await resend.sendEmail(ctx, {
        from: "Women of Influence <onboarding@resend.dev>",
        to: args.email,
        subject: "Your Application to WIA is Received",
        html: `
          <h3>Hello ${args.name},</h3>
          <p>Your application for <strong>${args.packageName}</strong> has been received successfully.</p>
          <p>Our enrollment dashboard has saved your details. We will be in touch shortly with the next steps to arrange your interview.</p>
          <br/>
          <p>Warm regards,<br/>Women of Influence Academy</p>
        `
      });
    } catch (error) {
      console.error("Failed to send application confirmation", error);
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
  },
  handler: async (ctx, args) => {
    
    try {
      // Build dynamic HTML for bank details based on what is configured
      const hasUsd = args.usdBankAccountNumber && args.usdBankAccountNumber !== "N/A" && args.usdBankAccountNumber !== "";
      const hasEur = args.eurIban && args.eurIban !== "N/A" && args.eurIban !== "";

      const usdHtml = hasUsd ? `
        <div style="margin-top: 15px; padding: 10px; border: 1px solid #e4e4e7; border-radius: 6px; background-color: #fafafa;">
          <h4 style="margin: 0 0 10px 0; color: #18181b;">USD Bank Account (International Transfer via Accrue)</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Account Name:</strong> ${args.usdBankAccountName}</li>
            <li><strong>Account Number:</strong> ${args.usdBankAccountNumber}</li>
            <li><strong>Bank Name:</strong> ${args.usdBankName}</li>
            ${args.usdRoutingNumber ? `<li><strong>Routing Number:</strong> ${args.usdRoutingNumber}</li>` : ""}
            ${args.usdSwiftCode ? `<li><strong>Swift Code / BIC:</strong> ${args.usdSwiftCode}</li>` : ""}
          </ul>
        </div>
      ` : "";

      const eurHtml = hasEur ? `
        <div style="margin-top: 15px; padding: 10px; border: 1px solid #e4e4e7; border-radius: 6px; background-color: #fafafa;">
          <h4 style="margin: 0 0 10px 0; color: #18181b;">EUR Bank Account (International Transfer via Accrue)</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Account Name:</strong> ${args.eurBankAccountName}</li>
            <li><strong>IBAN:</strong> ${args.eurIban}</li>
            <li><strong>Bank Name:</strong> ${args.eurBankName}</li>
            ${args.eurSwiftCode ? `<li><strong>Swift Code / BIC:</strong> ${args.eurSwiftCode}</li>` : ""}
          </ul>
        </div>
      ` : "";

      await resend.sendEmail(ctx, {
        from: "Women of Influence <onboarding@resend.dev>",
        to: args.email,
        subject: "Thank You For Your Sponsorship Intent",
        html: `
          <h3>Hello ${args.name},</h3>
          <p>Thank you for initiating a sponsorship of <strong>${args.amountDisplay}</strong>.</p>
          <p>Your support directly enables qualified women to receive high-level leadership training.</p>
          <p>Please complete your contribution by transferring to any of the following bank accounts:</p>
          
          <div style="padding: 10px; border: 1px solid #e4e4e7; border-radius: 6px; background-color: #fafafa;">
            <h4 style="margin: 0 0 10px 0; color: #18181b;">Local Bank Account (GHS/African Payments)</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Account Name:</strong> ${args.bankAccountName}</li>
              <li><strong>Account Number:</strong> ${args.bankAccountNumber}</li>
              <li><strong>Bank Name:</strong> ${args.bankName}</li>
            </ul>
          </div>
          
          ${usdHtml}
          ${eurHtml}
          
          <p style="margin-top: 20px;">Once you have made the transfer, please reply to this email with your receipt so we can finalize the transaction.</p>
          <br/>
          <p>Warm regards,<br/>Women of Influence Academy</p>
        `
      });
    } catch (error) {
      console.error("Failed to send sponsorship confirmation", error);
    }
  }
});
