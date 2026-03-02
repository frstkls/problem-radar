export const maxDuration = 120;

import { callClaude, sanitizeInput } from "../../../lib/anthropic";
import { prompts } from "../../../lib/prompts";
import { NextResponse } from "next/server";
import { getSession, saveSession, isPro } from "../../../lib/session";

export async function POST(req) {
  try {
    const session = getSession();
    const pro = isPro(session);

    if (!pro && session.scansUsed >= 3) {
      return NextResponse.json(
        { error: "Je hebt je 3 gratis scans voor deze maand gebruikt. Upgrade naar Pro voor onbeperkte scans." },
        { status: 403 }
      );
    }

    const { query, sources } = await req.json();
    const cleanQuery = sanitizeInput(query, 300);

    if (!cleanQuery) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const maxProblems = pro ? 10 : 6;
    const data = await callClaude(
      prompts.scan(cleanQuery, sources || ["reddit", "forums", "reviews"], maxProblems)
    );

    if (!pro) {
      saveSession({ ...session, scansUsed: session.scansUsed + 1 });
    }

    const scansLeft = pro ? -1 : Math.max(0, 3 - (session.scansUsed + 1));
    return NextResponse.json({ ...data, scansLeft });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Research failed. Please try again." },
      { status: 500 }
    );
  }
}
