import { callClaude } from "../../../lib/anthropic";
import { prompts } from "../../../lib/prompts";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { problems, topic } = await req.json();

    if (!problems?.length || !topic) {
      return NextResponse.json({ error: "Problems and topic required" }, { status: 400 });
    }

    const data = await callClaude(prompts.ideas(problems, topic));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Ideas error:", error);
    return NextResponse.json(
      { error: "Idea generation failed. Please try again." },
      { status: 500 }
    );
  }
}
