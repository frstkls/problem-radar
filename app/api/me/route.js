import { NextResponse } from "next/server";
import { getSession, saveSession, isPro } from "../../../lib/session";
import { stripe } from "../../../lib/stripe";
import { isSubscriptionCancelled } from "../stripe/webhook/route";

export async function GET() {
  const session = getSession();
  const pro = isPro(session);

  // Fast-path: if the in-memory set already knows this sub is cancelled, skip Stripe API call
  if (pro && session.stripeSubscriptionId && isSubscriptionCancelled(session.stripeSubscriptionId)) {
    const downgraded = { ...session, plan: "free" };
    saveSession(downgraded);
    return NextResponse.json({ plan: "free", scansLeft: Math.max(0, 3 - session.scansUsed) });
  }

  // Verify subscription is still active with Stripe (detects cancellations not yet in memory)
  if (stripe && session.stripeSubscriptionId && pro) {
    try {
      const sub = await stripe.subscriptions.retrieve(session.stripeSubscriptionId);
      if (sub.status !== "active" && sub.status !== "trialing") {
        const downgraded = { ...session, plan: "free" };
        saveSession(downgraded);
        return NextResponse.json({ plan: "free", scansLeft: Math.max(0, 3 - session.scansUsed) });
      }
    } catch {
      // Ignore Stripe errors — trust the cookie
    }
  }

  return NextResponse.json({
    plan: session.plan,
    scansLeft: pro ? -1 : Math.max(0, 3 - session.scansUsed),
  });
}
