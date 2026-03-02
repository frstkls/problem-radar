import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const INJECTION_PHRASES = [
  "ignore all instructions",
  "ignore previous instructions",
  "disregard all instructions",
  "system prompt",
  "you are now",
  "forget everything",
  "new instructions",
  "override instructions",
  "jailbreak",
];

export function sanitizeInput(str, maxLen = 300) {
  if (!str || typeof str !== "string") return "";
  let s = str.slice(0, maxLen);
  for (const phrase of INJECTION_PHRASES) {
    s = s.replace(new RegExp(phrase, "gi"), "***");
  }
  return s.trim();
}

export async function callClaude(prompt, maxTokens = 4096, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      return extractJSON(text);
    } catch (e) {
      if (attempt === retries) throw e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

export async function callClaudeLight(prompt, maxTokens = 300) {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return extractJSON(text);
}

function extractJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  // Depth-counting parser: finds first complete balanced JSON object or array
  for (let i = 0; i < clean.length; i++) {
    const startChar = clean[i];
    if (startChar !== "{" && startChar !== "[") continue;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let j = i; j < clean.length; j++) {
      const c = clean[j];
      if (escape) { escape = false; continue; }
      if (inString) {
        if (c === "\\") { escape = true; continue; }
        if (c === '"') inString = false;
        continue;
      }
      if (c === '"') { inString = true; continue; }
      if (c === "{" || c === "[") depth++;
      else if (c === "}" || c === "]") {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(clean.slice(i, j + 1));
          } catch {
            break; // not valid JSON at this position, try next
          }
        }
      }
    }
  }
  throw new Error("No JSON object found in response");
}
