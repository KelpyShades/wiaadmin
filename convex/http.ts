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
    const requestToken = request.headers.get("x-cashramp-token") || request.headers.get("X-CASHRAMP-TOKEN");

    if (!webhookToken) {
      console.error("ACCRUE_WEBHOOK_TOKEN environment variable is not configured");
      return new Response("Webhook token not configured", { status: 500 });
    }

    if (requestToken !== webhookToken) {
      console.warn("Unauthorized webhook attempt: token mismatch");
      return new Response("Unauthorized signature", { status: 401 });
    }

    try {
      const body = await request.json();
      console.log("Accrue Webhook payload received:", body);

      const eventType = body.event_type;
      const data = body.data;

      if (!data || !data.reference) {
        console.warn("Invalid webhook payload: missing data or reference");
        return new Response("Invalid payload", { status: 400 });
      }

      // Update payment status for application/sponsorship in the database
      const result = await ctx.runMutation(api.inbox.updatePaymentStatusByReference, {
        reference: data.reference,
        status: data.status || "",
      });

      console.log("Successfully processed webhook for reference:", data.reference, result);
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
