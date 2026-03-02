import { NextResponse } from "next/server";
import { getSession, saveSession } from "../../../../lib/session";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }
  const session = getSession();
  saveSession({ ...session, scansUsed: 0 });
  return NextResponse.json({ ok: true, scansUsed: 0 });
}
