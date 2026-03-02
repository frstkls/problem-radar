import { NextResponse } from "next/server";
import { resend, AUDIENCE_ID } from "../../../../lib/resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST { email } — subscribe
export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Ongeldig e-mailadres." }, { status: 400 });
    }
    if (!resend || !AUDIENCE_ID) {
      return NextResponse.json({ error: "Newsletter not configured." }, { status: 503 });
    }
    await resend.contacts.create({ email, audienceId: AUDIENCE_ID, unsubscribed: false });
    return NextResponse.json({ success: true });
  } catch (e) {
    // Resend throws when contact already exists — treat as success
    if (e?.message?.includes("already exists") || e?.statusCode === 409) {
      return NextResponse.json({ success: true });
    }
    console.error("subscribe error", e);
    return NextResponse.json({ error: "Aanmelden mislukt. Probeer opnieuw." }, { status: 500 });
  }
}

// GET (admin) — return subscriber count
export async function GET(req) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!resend || !AUDIENCE_ID) {
    return NextResponse.json({ error: "Newsletter not configured." }, { status: 503 });
  }
  try {
    const { data } = await resend.contacts.list({ audienceId: AUDIENCE_ID });
    const active = (data || []).filter((c) => !c.unsubscribed);
    return NextResponse.json({ count: active.length, total: (data || []).length });
  } catch (e) {
    console.error("subscriber count error", e);
    return NextResponse.json({ error: "Ophalen mislukt." }, { status: 500 });
  }
}
