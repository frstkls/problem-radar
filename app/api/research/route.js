import { callClaude } from "@/lib/anthropic";
import { prompts } from "@/lib/prompts";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { query, sources, maxProblems } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const data = await callClaude(
      prompts.scan(query, sources || ["reddit", "forums", "reviews"], maxProblems || 6)
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Research failed. Please try again." },
      { status: 500 }
    );
  }
}
