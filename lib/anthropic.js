import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Call Claude with web search enabled
 */
export async function callClaude(prompt, maxTokens = 4096, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
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

/**
 * Call Claude without web search (for autocomplete, faster)
 */
export async function callClaudeLight(prompt, maxTokens = 300) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return extractJSON(text);
}

/**
 * Robustly extract JSON from Claude's response
 */
function extractJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in response");
  }
  return JSON.parse(clean.slice(start, end + 1));
}
