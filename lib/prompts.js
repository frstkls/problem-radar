export const prompts = {
  scan: (query, sources, maxProblems) =>
    `You are ProblemRadar, an expert market research analyst. Search the web extensively for REAL problems, frustrations, and unmet needs about: "${query}"
Focus on: ${sources.join(", ")}
Search Reddit, forums, review sites, Twitter/X, blogs, and news. Find genuine pain points.
CRITICAL: Your entire response must be ONLY a JSON object. Start with { and end with }. No text before or after. No markdown. Pure JSON:
{"topic":"${query}","summary":"2-3 sentence executive summary","problems":[{"id":1,"title":"Short title","description":"2-3 sentences","evidence":"Paraphrased real examples","sources":["source1","source2"],"frequency":"high|medium|low","severity":"critical|high|medium|low","existingSolutions":"Current solutions and gaps","opportunityScore":85,"category":"UX|Pricing|Trust|Access|Speed|Communication|Quality|Missing Feature|Legal|Sustainability|Other","targetAudience":"Who suffers","potentialApproach":"Entrepreneurial angle"}],"trendingTopics":["t1","t2","t3"],"marketInsight":"2-3 sentence strategic insight"}
Return ${maxProblems} problems ordered by opportunityScore. Be specific and evidence-based.`,

  deepDive: (problem, topic) =>
    `Deep research on one specific problem.
TOPIC: "${topic}" | PROBLEM: "${problem.title}" — ${problem.description}
Search extensively for market size, competitors, spending, expert opinions, trends.
CRITICAL: Your entire response must be ONLY a JSON object. Start with { and end with }. No text before or after. No markdown. Pure JSON:
{"problemTitle":"${problem.title}","marketSize":"People affected + market value","painIntensity":"How much people suffer with real examples","competitors":[{"name":"Name","what":"What they do","weakness":"Why they fail","pricing":"Price","url":"URL"}],"spending":"Current spending on bad solutions","trends":"Recent changes","expertView":"Expert opinions","bestAngle":"Best opportunity for new entrant","risks":["r1","r2","r3"],"steps":["Step 1","Step 2","Step 3","Step 4","Step 5"]}`,

  ideas: (problems, topic) =>
    `Generate startup ideas from real problems found about "${topic}".
PROBLEMS: ${problems.map((p, i) => `${i + 1}. ${p.title}: ${p.description}`).join("\n")}
Search for similar successful startups and business models.
CRITICAL: Your entire response must be ONLY a JSON object. Start with { and end with }. No text before or after. No markdown. Pure JSON:
{"ideas":[{"id":1,"name":"Product name","tagline":"One-line pitch","description":"3-4 sentences","problemIds":[1,2],"model":"Revenue model","customer":"Target customer","mvp":["f1","f2","f3"],"cost":"MVP cost","timeline":"Time to MVP","edge":"Competitive advantage","similar":"Similar successes","week1":["action1","action2","action3"]}]}
Generate 3-4 ideas, simple to ambitious.`,

  competitive: (topic) =>
    `Map the competitive landscape for: "${topic}"
Search for existing companies, startups, and tools.
CRITICAL: Your entire response must be ONLY a JSON object. Start with { and end with }. No text before or after. No markdown. Pure JSON:
{"landscape":"2-3 sentence overview","totalFunding":"Total funding if known","players":[{"name":"Company","description":"What they do","founded":"Year","funding":"Amount","strengths":["s1","s2"],"weaknesses":["w1","w2"],"pricing":"Model","url":"URL","threat":"high|medium|low"}],"gaps":["Gap 1","Gap 2","Gap 3"],"opportunity":"Biggest opening"}`,

  autocomplete: (input) =>
    `You are an autocomplete engine for a market research tool. User is typing: "${input}"
CRITICAL: Return ONLY JSON. Start with { end with }. No other text.
{"suggestions":["query 1","query 2","query 3","query 4","query 5","query 6"]}
Generate 6 diverse, specific problem-discovery research queries related to what the user is typing. Under 60 chars each.`,
};
