import { callClaudeLight, sanitizeInput } from "../../../lib/anthropic";
import { prompts } from "../../../lib/prompts";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { input } = await req.json();
    const cleanInput = sanitizeInput(input, 300);

    if (!cleanInput || cleanInput.length < 3) {
      return NextResponse.json({ suggestions: [] });
    }

    const data = await callClaudeLight(prompts.autocomplete(cleanInput));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Autocomplete error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
