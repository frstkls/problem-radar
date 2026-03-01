import { callClaudeLight } from "../../../lib/anthropic";
import { prompts } from "../../../lib/prompts";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { problem, topic } = await req.json();

    if (!problem || !topic) {
      return NextResponse.json({ error: "Problem and topic required" }, { status: 400 });
    }

    const data = await callClaude(prompts.deepDive(problem, topic));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Deep dive error:", error);
    return NextResponse.json(
      { error: "Deep dive failed. Please try again." },
      { status: 500 }
    );
  }
}
