export const maxDuration = 120;

import { callClaude, sanitizeInput } from "../../../lib/anthropic";
import { prompts } from "../../../lib/prompts";
import { NextResponse } from "next/server";
import { getSession, isPro } from "../../../lib/session";

export async function POST(req) {
  try {
    const session = getSession();
    if (!isPro(session)) {
      return NextResponse.json(
        { error: "Deep Dive vereist een Pro abonnement." },
        { status: 403 }
      );
    }

    const { problem, topic } = await req.json();

    if (!problem || !topic) {
      return NextResponse.json({ error: "Problem and topic required" }, { status: 400 });
    }

    const cleanTopic = sanitizeInput(topic, 150);
    const cleanProblem = {
      ...problem,
      title: sanitizeInput(problem.title, 200),
      description: sanitizeInput(problem.description, 300),
    };

    const data = await callClaude(prompts.deepDive(cleanProblem, cleanTopic));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Deep dive error:", error);
    return NextResponse.json(
      { error: "Deep dive failed. Please try again." },
      { status: 500 }
    );
  }
}
