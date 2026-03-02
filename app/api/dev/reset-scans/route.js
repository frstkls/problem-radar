import { NextResponse } from "next/server";
import { getSession, saveSession } from "../../../../lib/session";

export async function GET() {
  const session = getSession();
  saveSession({ ...session, scansUsed: 0 });
  return NextResponse.json({ ok: true, scansUsed: 0 });
}
