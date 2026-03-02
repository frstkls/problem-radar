import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe";

// In-memory set of cancelled/unpaid subscription IDs
// Survives for the lifetime of the server process
const cancelledSubscriptions = new Set();

export function isSubscriptionCancelled(subId) {
  return cancelledSubscriptions.has(subId);
}

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

  console.log("Stripe webhook received:", event.type);

  switch (event.type) {
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      cancelledSubscriptions.add(sub.id);
      console.log(`Subscription cancelled: ${sub.id} (customer: ${sub.customer})`);
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object;
      if (sub.status === "canceled" || sub.status === "unpaid") {
        cancelledSubscriptions.add(sub.id);
        console.log(`Subscription downgraded: ${sub.id} status=${sub.status}`);
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      console.warn(`Payment failed for customer: ${invoice.customer}, invoice: ${invoice.id}`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
