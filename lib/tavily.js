const TAVILY_API = "https://api.tavily.com/search";
const MAX_SNIPPET_LEN = 450;

export async function tavilySearch(query) {
  if (!process.env.TAVILY_API_KEY) return [];
  try {
    const res = await fetch(TAVILY_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: "basic",
        max_results: 5,
        include_answer: false,
        include_raw_content: false,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

// Build source-aware search queries (max 4)
export function buildSearchQueries(query, sources) {
  const q = [];

  if (sources.includes("reddit")) {
    q.push(`${query} problems frustrations complaints site:reddit.com`);
  }
  if (sources.includes("reviews")) {
    q.push(`${query} negative reviews user complaints`);
  }
  if (sources.includes("forums")) {
    q.push(`${query} problems frustrations forum`);
  }
  if (sources.includes("facebook")) {
    q.push(`${query} complaints problems frustrations facebook groups`);
  }
  if (sources.includes("twitter")) {
    q.push(`${query} complaints frustrations -filter:retweets`);
  }

  // Always add a broad catch-all
  q.push(`"${query}" pain points problems unmet needs entrepreneurs`);

  // Deduplicate and cap at 4
  return [...new Set(q)].slice(0, 4);
}

// Run all queries in parallel and return formatted context string
export async function fetchContext(query, sources) {
  const queries = buildSearchQueries(query, sources);
  const results = await Promise.all(queries.map(tavilySearch));
  const flat = results.flat();

  if (!flat.length) return null;

  return flat
    .filter((r) => r.content?.trim())
    .map((r) => {
      const snippet = r.content.slice(0, MAX_SNIPPET_LEN).trim();
      return `SOURCE: ${r.title}\nURL: ${r.url}\n${snippet}`;
    })
    .join("\n\n---\n\n");
}
