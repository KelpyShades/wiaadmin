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
    const webhookToken = process.env.ACCRUE_WEBHOOK_TOKEN?.trim();
    const requestToken =
      request.headers.get("x-cashramp-token") ||
      request.headers.get("x-accrue-token") ||
      request.headers.get("x-webhook-token") ||
      request.headers.get("authorization");

    if (webhookToken) {
      const cleanToken = (
        requestToken?.startsWith("Bearer ")
          ? requestToken.substring(7)
          : requestToken
      )?.trim();
      if (cleanToken !== webhookToken) {
        console.warn("Unauthorized webhook attempt: token mismatch");
        return new Response("Unauthorized signature", { status: 401 });
      }
    } else {
      console.log("ACCRUE_WEBHOOK_TOKEN environment variable is not configured. Skipping verification (dev/testing mode).");
    }

    try {
      const rawBody: unknown = await request.json();
      console.log("Accrue Webhook payload received:", JSON.stringify(rawBody));

      if (!rawBody || typeof rawBody !== "object") {
        console.warn("Invalid webhook payload: expected JSON object");
        return new Response("Invalid payload", { status: 400 });
      }

      const body = rawBody as Record<string, unknown>;
      const data =
        body.data && typeof body.data === "object"
          ? (body.data as Record<string, unknown>)
          : undefined;
      const nestedPaymentRequest =
        (data?.paymentRequest && typeof data.paymentRequest === "object"
          ? (data.paymentRequest as Record<string, unknown>)
          : undefined) ||
        (data?.payment_request && typeof data.payment_request === "object"
          ? (data.payment_request as Record<string, unknown>)
          : undefined) ||
        (body.paymentRequest && typeof body.paymentRequest === "object"
          ? (body.paymentRequest as Record<string, unknown>)
          : undefined) ||
        (body.payment_request && typeof body.payment_request === "object"
          ? (body.payment_request as Record<string, unknown>)
          : undefined);
      const p2pPayment =
        data?.p2p_payment && typeof data.p2p_payment === "object"
          ? (data.p2p_payment as Record<string, unknown>)
          : undefined;

      const pickString = (...values: unknown[]): string | undefined => {
        for (const val of values) {
          if (typeof val === "string" && val.trim().length > 0) {
            return val.trim();
          }
        }
        return undefined;
      };

      const eventType = pickString(body.event_type, body.event, body.type);
      const externalId = pickString(
        data?.id,
        nestedPaymentRequest?.id,
        body.id
      );
      const reference = pickString(
        body.reference,
        data?.reference,
        nestedPaymentRequest?.reference,
        p2pPayment?.reference,
        externalId
      );
      const status =
        pickString(
          body.status,
          data?.status,
          nestedPaymentRequest?.status,
          p2pPayment?.status
        ) || "";

      if (!reference) {
        console.warn("Invalid webhook payload: missing reference identifier");
        return new Response("Invalid payload", { status: 400 });
      }

      // Update payment status for application/sponsorship in the database
      const result = await ctx.runMutation(api.inbox.updatePaymentStatusByReference, {
        reference,
        externalId,
        status,
        eventType,
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
