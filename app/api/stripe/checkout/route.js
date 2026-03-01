import { NextResponse } from "next/server";
import { stripe, PRICES, getBaseUrl } from "../../../../lib/stripe";
import { getSession } from "../../../../lib/session";

export async function POST(req) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Payments not configured. Add STRIPE_SECRET_KEY to your environment variables." },
      { status: 503 }
    );
  }

  const { planId } = await req.json();
  const price = PRICES[planId];

  if (!price) {
    return NextResponse.json(
      { error: `No price configured for plan "${planId}". Add STRIPE_${planId.toUpperCase()}_PRICE_ID to your environment.` },
      { status: 400 }
    );
  }

  const session = getSession();
  const base = getBaseUrl();

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: `${base}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/`,
    customer: session.stripeCustomerId || undefined,
    metadata: { planId },
  });

  return NextResponse.json({ url: checkout.url });
}
