export const prompts = {
  scan: (query, sources, maxProblems, context) => context
    ? `You are ProblemRadar, an expert market research analyst. Below is REAL, CURRENT content retrieved from the web about "${query}". Analyze ONLY this real data — do not add information not present in the sources.

REAL SOURCE DATA:
${context}

From the above real sources, extract the most significant problems, frustrations, and unmet needs people have with "${query}". Be specific — quote or paraphrase real evidence directly from the sources above.
CRITICAL: Your entire response must be ONLY a JSON object. Start with { and end with }. No text before or after. No markdown. Pure JSON:
{"topic":"${query}","summary":"2-3 sentence executive summary based on the real data","problems":[{"id":1,"title":"Short title","description":"2-3 sentences","evidence":"Direct quote or paraphrase from the sources above","sources":["source name or URL"],"frequency":"high|medium|low","severity":"critical|high|medium|low","existingSolutions":"Current solutions and gaps","opportunityScore":85,"category":"UX|Pricing|Trust|Access|Speed|Communication|Quality|Missing Feature|Legal|Sustainability|Other","targetAudience":"Who suffers","potentialApproach":"Entrepreneurial angle"}],"trendingTopics":["t1","t2","t3"],"marketInsight":"2-3 sentence strategic insight based on the real data"}
ENUM CONSTRAINTS: frequency must be exactly one of: "high", "medium", "low" (lowercase). severity must be exactly one of: "critical", "high", "medium", "low" (lowercase).
Return up to ${maxProblems} problems ordered by opportunityScore. Only include problems clearly supported by the provided sources.`
    : `You are ProblemRadar, an expert market research analyst. Based on your training knowledge of real discussions on Reddit, Facebook Groups, forums, app store reviews, Twitter/X, blogs, news, and social media, find REAL problems, frustrations, and unmet needs about: "${query}"
Focus on: ${sources.join(", ")}
Draw from genuine pain points shared on Reddit, Facebook Groups and Marketplace, Twitter/X, Quora, app store reviews, forums, and news/blogs. Find authentic pain points with specific examples.
CRITICAL: Your entire response must be ONLY a JSON object. Start with { and end with }. No text before or after. No markdown. Pure JSON:
{"topic":"${query}","summary":"2-3 sentence executive summary","problems":[{"id":1,"title":"Short title","description":"2-3 sentences","evidence":"Paraphrased real examples from actual discussions","sources":["source1","source2"],"frequency":"high|medium|low","severity":"critical|high|medium|low","existingSolutions":"Current solutions and gaps","opportunityScore":85,"category":"UX|Pricing|Trust|Access|Speed|Communication|Quality|Missing Feature|Legal|Sustainability|Other","targetAudience":"Who suffers","potentialApproach":"Entrepreneurial angle"}],"trendingTopics":["t1","t2","t3"],"marketInsight":"2-3 sentence strategic insight"}
ENUM CONSTRAINTS: frequency must be exactly one of: "high", "medium", "low" (lowercase). severity must be exactly one of: "critical", "high", "medium", "low" (lowercase).
Return ${maxProblems} problems ordered by opportunityScore. Be specific and evidence-based.`,

  deepDive: (problem, topic) =>
    `Deep research on one specific problem using your training knowledge.
TOPIC: "${topic}" | PROBLEM: "${problem.title}" — ${problem.description}
Analyze market size, competitors, spending patterns, expert opinions, and trends. Only name real, verifiable companies — omit any company you are uncertain about. Do not speculate on funding amounts if not well-documented.
CRITICAL: Your entire response must be ONLY a JSON object. Start with { and end with }. No text before or after. No markdown. Pure JSON:
{"problemTitle":"${problem.title}","marketSize":"People affected + estimated market value","painIntensity":"How much people suffer with real examples","competitors":[{"name":"Real company name only","what":"What they do","weakness":"Why they fail this segment","pricing":"Known price","url":"Official URL if known"}],"spending":"Current spending on workarounds or bad solutions","trends":"Recent changes affecting this problem","expertView":"Expert or analyst opinions on this space","bestAngle":"Best opportunity for a new entrant","risks":["r1","r2","r3"],"steps":["Step 1","Step 2","Step 3","Step 4","Step 5"]}`,

  ideas: (problems, topic) =>
    `Generate startup ideas from real problems found about "${topic}".
PROBLEMS: ${problems.map((p, i) => `${i + 1}. ${p.title}: ${p.description}`).join("\n")}
Focus on ideas that are technically feasible for a solo founder with limited budget. Draw on similar successful startups and proven business models.
CRITICAL: Your entire response must be ONLY a JSON object. Start with { and end with }. No text before or after. No markdown. Pure JSON:
{"ideas":[{"id":1,"name":"Product name","tagline":"One-line pitch","description":"3-4 sentences","problemIds":[1,2],"model":"Revenue model","customer":"Target customer","mvp":["f1","f2","f3"],"cost":"Realistic MVP cost for solo founder","timeline":"Time to MVP","edge":"Competitive advantage","similar":"Similar successes","week1":["action1","action2","action3"]}]}
Generate 3-4 ideas ranging from simple to ambitious, all within solo-founder reach.`,

  competitive: (topic) =>
    `Map the competitive landscape for: "${topic}"
Identify existing companies, startups, and tools. Only include real, verifiable companies — omit speculative or unverified entries. Only include funding amounts that are publicly documented.
CRITICAL: Your entire response must be ONLY a JSON object. Start with { and end with }. No text before or after. No markdown. Pure JSON:
{"landscape":"2-3 sentence overview","totalFunding":"Total documented funding if known, omit if uncertain","players":[{"name":"Real company name","description":"What they do","founded":"Year if known","funding":"Documented amount only, omit if uncertain","strengths":["s1","s2"],"weaknesses":["w1","w2"],"pricing":"Known pricing model","url":"Official URL","threat":"high|medium|low"}],"gaps":["Gap 1","Gap 2","Gap 3"],"opportunity":"Biggest opening for a new entrant"}`,

  autocomplete: (input) =>
    `You are an autocomplete engine for a market research tool. User is typing: "${input}"
CRITICAL: Return ONLY JSON. Start with { end with }. No other text.
{"suggestions":["query 1","query 2","query 3","query 4","query 5","query 6"]}
Generate 6 diverse, specific problem-discovery research queries related to what the user is typing. Under 60 chars each.`,
};
