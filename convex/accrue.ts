import { v } from "convex/values";
import { action } from "./_generated/server";

export const initiateAccruePayment = action({
  args: {
    amount: v.number(),
    currency: v.string(), // e.g., "GHS", "NGN", "KES"
    countryCode: v.string(), // e.g., "GH", "NG", "KE"
    reference: v.string(), // application ID or sponsorship ID
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    const secretKey = process.env.ACCRUE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("ACCRUE_SECRET_KEY environment variable is not configured");
    }

    const apiUrl = process.env.ACCRUE_API_URL || "https://api.useaccrue.com/cashramp/api/graphql";

    const query = `
      mutation InitiateHostedPayment(
        $amount: Float!,
        $currency: String!,
        $countryCode: String!,
        $reference: String!,
        $email: String!,
        $firstName: String!,
        $lastName: String!
      ) {
        initiateHostedPayment(
          paymentType: deposit,
          amount: $amount,
          currency: $currency,
          countryCode: $countryCode,
          reference: $reference,
          email: $email,
          firstName: $firstName,
          lastName: $lastName
        ) {
          hostedLink
          id
        }
      }
    `;

    const variables = {
      amount: args.amount,
      currency: args.currency.toLowerCase(),
      countryCode: args.countryCode.toUpperCase(),
      reference: args.reference,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secretKey}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Accrue API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`Accrue GraphQL error: ${JSON.stringify(result.errors)}`);
    }

    return result.data.initiateHostedPayment;
  },
});
