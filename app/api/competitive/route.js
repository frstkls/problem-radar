export const maxDuration = 120;

import { callClaude } from "../../../lib/anthropic";
import { prompts } from "../../../lib/prompts";
import { NextResponse } from "next/server";
import { getSession, isPro } from "../../../lib/session";

export async function POST(req) {
  try {
    const session = getSession();
    if (!isPro(session)) {
      return NextResponse.json(
        { error: "Competitive Landscape vereist een Pro abonnement." },
        { status: 403 }
      );
    }

    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic required" }, { status: 400 });
    }

    const data = await callClaude(prompts.competitive(topic));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Competitive error:", error);
    return NextResponse.json(
      { error: "Competitive analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
