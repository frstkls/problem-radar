import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe";

export async function POST(req) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ received: true });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("Webhook signature error:", e.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Subscription cancellation is handled by verifying subscription status
  // on each /api/me call — no database needed for this MVP.
  console.log("Stripe webhook received:", event.type);

  return NextResponse.json({ received: true });
}
