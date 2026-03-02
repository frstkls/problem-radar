import { NextResponse } from "next/server";
import { resend, AUDIENCE_ID, FROM } from "../../../../lib/resend";

// POST { secret, subject, html } — create & send broadcast
export async function POST(req) {
  try {
    const { secret, subject, html } = await req.json();

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!subject?.trim() || !html?.trim()) {
      return NextResponse.json({ error: "Subject en inhoud zijn verplicht." }, { status: 400 });
    }
    if (!resend || !AUDIENCE_ID) {
      return NextResponse.json({ error: "Newsletter not configured." }, { status: 503 });
    }

    const { data: broadcast, error: createErr } = await resend.broadcasts.create({
      audienceId: AUDIENCE_ID,
      from: FROM,
      subject: subject.trim(),
      html: html.trim(),
      name: subject.trim(),
    });
    if (createErr) throw createErr;

    const { error: sendErr } = await resend.broadcasts.send(broadcast.id);
    if (sendErr) throw sendErr;

    return NextResponse.json({ sent: true, broadcastId: broadcast.id });
  } catch (e) {
    console.error("broadcast error", e);
    return NextResponse.json({ error: e?.message || "Versturen mislukt." }, { status: 500 });
  }
}
