import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe";
import { getSession, setSessionOnResponse } from "../../../../lib/session";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId || !stripe) {
    return NextResponse.redirect(new URL("/?error=invalid", req.url));
  }

  try {
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkout.payment_status !== "paid" && checkout.status !== "complete") {
      return NextResponse.redirect(new URL("/?error=payment", req.url));
    }

    const planId = checkout.metadata?.planId || "pro";
    const session = getSession();

    const response = NextResponse.redirect(new URL("/?upgraded=true", req.url));
    setSessionOnResponse(response, {
      ...session,
      plan: planId,
      stripeCustomerId: checkout.customer,
      stripeSubscriptionId: checkout.subscription,
    });
    return response;
  } catch (e) {
    console.error("Stripe success error:", e);
    return NextResponse.redirect(new URL("/?error=stripe", req.url));
  }
}
