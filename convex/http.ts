import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// Webhook endpoint to accept payments and update status asynchronously from Accrue (Cashramp)
http.route({
  path: "/accrue-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookToken = process.env.ACCRUE_WEBHOOK_TOKEN;
    const requestToken = request.headers.get("x-cashramp-token") || request.headers.get("X-CASHRAMP-TOKEN") || request.headers.get("Authorization");

    if (webhookToken) {
      const cleanToken = requestToken?.startsWith("Bearer ") ? requestToken.substring(7) : requestToken;
      if (cleanToken !== webhookToken) {
        console.warn("Unauthorized webhook attempt: token mismatch");
        return new Response("Unauthorized signature", { status: 401 });
      }
    } else {
      console.log("ACCRUE_WEBHOOK_TOKEN environment variable is not configured. Skipping verification (dev/testing mode).");
    }

    try {
      const body = await request.json();
      console.log("Accrue Webhook payload received:", body);

      const reference = body.reference || body.data?.reference;
      const status = body.status || body.data?.status || "";

      if (!reference) {
        console.warn("Invalid webhook payload: missing reference identifier");
        return new Response("Invalid payload", { status: 400 });
      }

      // Update payment status for application/sponsorship in the database
      const result = await ctx.runMutation(api.inbox.updatePaymentStatusByReference, {
        reference,
        status,
      });

      console.log("Successfully processed webhook for reference:", reference, result);
      return new Response(JSON.stringify({ success: true, result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error processing Accrue webhook:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }),
});

export default http;
