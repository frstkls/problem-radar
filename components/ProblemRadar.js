"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════
   PROBLEMRADAR — Client Component
   Calls local Next.js API routes (which call Anthropic)
   ═══════════════════════════════════════════════════════════ */

// ── API helpers ─────────────────────────────────────────────
async function api(endpoint, body) {
  const res = await fetch(`/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) {
    const err = new Error(data.error);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ── Plans ───────────────────────────────────────────────────
const PLANS = [
  {
    id: "free", name: "Starter", price: 0, period: "",
    scans: 3, scansLabel: "3 scans / month",
    features: ["Basic problem discovery", "Up to 6 results per scan", "Reddit, forums & review search", "Sort & filter results"],
    excluded: ["Deep Dive analysis", "Idea Generator", "Competitive landscape", "Export reports", "Research history"],
    cta: "Current Plan", color: "#8C95AA",
  },
  {
    id: "pro", name: "Pro", price: 29, period: "/mo",
    scans: -1, scansLabel: "Unlimited scans", popular: true,
    features: ["Everything in Starter", "Unlimited scans", "Up to 10 results per scan", "Deep Dive per problem", "AI Idea Generator", "Competitive landscape", "PDF & CSV export", "Research history"],
    excluded: ["Team workspace", "Shared library"],
    cta: "Upgrade to Pro", color: "#E85D24",
  },
  {
    id: "team", name: "Team", price: 79, period: "/mo",
    scans: -1, scansLabel: "Unlimited scans",
    features: ["Everything in Pro", "Up to 5 team members", "Shared research library", "Team workspace", "Priority support"],
    excluded: [],
    cta: "Start Team Plan", color: "#7C3AED",
  },
];

// ── Colors ──────────────────────────────────────────────────
const C = {
  bg: "#F8F9FB", s1: "#FFFFFF", s2: "#F1F3F7", s3: "#E8ECF2",
  brd: "#E2E6EE", brdL: "#D0D6E0",
  acc: "#E85D24", accG: "linear-gradient(135deg,#E85D24,#F59E0B)",
  accS: "rgba(232,93,36,0.07)",
  g: "#059669", gS: "rgba(5,150,105,0.06)",
  r: "#DC2626", rS: "rgba(220,38,38,0.06)",
  y: "#D97706", yS: "rgba(217,119,6,0.06)",
  b: "#2563EB", bS: "rgba(37,99,235,0.06)",
  p: "#7C3AED", pS: "rgba(124,58,237,0.06)",
  cy: "#0891B2",
  t: "#1A1D26", tM: "#5A6175", tD: "#8C95AA", tDD: "#B4BAC9",
};

// ── Micro components ────────────────────────────────────────
const Tag = ({ children, color = C.acc, style = {} }) => (
  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${color}10`, color, border: `1px solid ${color}20`, whiteSpace: "nowrap", ...style }}>{children}</span>
);

const Score = ({ n }) => {
  const color = n >= 80 ? C.r : n >= 60 ? C.y : n >= 40 ? C.b : C.tD;
  const label = n >= 80 ? "Hot" : n >= 60 ? "Strong" : n >= 40 ? "Moderate" : "Low";
  return <Tag color={color}>{n}/100 · {label}</Tag>;
};

const Btn = ({ children, onClick, primary, small, disabled, ghost, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    borderRadius: small ? 10 : 12, cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700, transition: "all 0.2s", opacity: disabled ? 0.5 : 1,
    fontSize: small ? 12 : 14, padding: small ? "7px 16px" : "12px 24px",
    background: primary ? C.accG : ghost ? "transparent" : C.s1,
    color: primary ? "#fff" : ghost ? C.tM : C.t,
    border: primary ? "none" : `1px solid ${ghost ? "transparent" : C.brd}`,
    boxShadow: primary ? "0 2px 8px rgba(232,93,36,0.25)" : "none",
    ...style,
  }}>{children}</button>
);

const Sec = ({ icon, title, color = C.acc, children }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
    </div>
    {children}
  </div>
);

// ── Loader ──────────────────────────────────────────────────
function Loader({ text = "Scanning" }) {
  const [d, setD] = useState(0);
  const [p, setP] = useState(0);
  const phases = ["🔍 Searching the web...", "💬 Analyzing Reddit & forums...", "🧠 Identifying patterns...", "📊 Clustering problems...", "⚡ Scoring opportunities...", "✨ Building report..."];
  useState(() => {
    const a = setInterval(() => setD(v => (v + 1) % 4), 400);
    const b = setInterval(() => setP(v => (v + 1) % phases.length), 2800);
    return () => { clearInterval(a); clearInterval(b); };
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "50px 20px" }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", border: `3px solid ${C.s3}`, borderTopColor: C.acc, animation: "spin 0.8s linear infinite" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.t, marginBottom: 5 }}>{text}</div>
        <div style={{ fontSize: 13, color: C.acc, minHeight: 18 }}>{phases[p]}{".".repeat(d)}</div>
      </div>
    </div>
  );
}

// ── Paywall ─────────────────────────────────────────────────
function Paywall({ feature, onClose, onSelect }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(10px)" }} onClick={onClose}>
      <div style={{ background: C.s1, borderRadius: 24, border: `1px solid ${C.brd}`, padding: 36, maxWidth: 700, width: "95%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.12)" }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accS, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 14 }}>🔒</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.t, marginBottom: 6 }}>Unlock {feature}</h2>
          <p style={{ fontSize: 14, color: C.tM, maxWidth: 380, margin: "0 auto" }}>Upgrade your plan to access advanced research tools.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
          {PLANS.filter(p => p.price > 0).map(plan => (
            <div key={plan.id} style={{ background: C.bg, borderRadius: 18, padding: 24, border: `1px solid ${plan.popular ? C.acc + "44" : C.brd}`, position: "relative" }}>
              {plan.popular && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: C.accG, color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 14px", borderRadius: 20 }}>MOST POPULAR</div>}
              <div style={{ fontSize: 13, fontWeight: 800, color: plan.color, marginBottom: 4 }}>{plan.name}</div>
              <div style={{ marginBottom: 16 }}><span style={{ fontSize: 34, fontWeight: 800, color: C.t }}>${plan.price}</span><span style={{ fontSize: 13, color: C.tM }}>{plan.period}</span></div>
              {plan.features.map((f, i) => <div key={i} style={{ fontSize: 12, color: C.tM, padding: "3px 0", display: "flex", gap: 6 }}><span style={{ color: C.g }}>✓</span>{f}</div>)}
              <div style={{ marginTop: 16 }}><Btn primary={plan.popular} small onClick={() => onSelect(plan.id)} style={{ width: "100%", textAlign: "center" }}>{plan.cta}</Btn></div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 18 }}><button onClick={onClose} style={{ background: "none", border: "none", color: C.tD, fontSize: 13, cursor: "pointer" }}>Maybe later</button></div>
      </div>
    </div>
  );
}

// ── Deep Dive Panel ─────────────────────────────────────────
function DeepDivePanel({ data }) {
  return (
    <div className="animate-fadeUp" style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: C.pS, borderRadius: 14, padding: 18, border: `1px solid ${C.p}18` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.p, marginBottom: 12 }}>🔬 Deep Dive Results</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[["📏 Market Size", data.marketSize], ["💸 Spending", data.spending], ["📈 Trends", data.trends], ["🎯 Best Angle", data.bestAngle]].map(([l, v]) => (
            <div key={l} style={{ background: C.s1, borderRadius: 10, padding: 14, border: `1px solid ${C.brd}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.p, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 12.5, color: C.tM, lineHeight: 1.5 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      {data.competitors?.length > 0 && (
        <div style={{ background: C.rS, borderRadius: 14, padding: 18, border: `1px solid ${C.r}15` }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.r, textTransform: "uppercase", marginBottom: 10 }}>⚔️ Competitors</div>
          {data.competitors.map((c, i) => (
            <div key={i} style={{ background: C.s1, borderRadius: 10, padding: 14, border: `1px solid ${C.brd}`, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.t }}>{c.name}</span>
                {c.pricing && <Tag color={C.tD}>{c.pricing}</Tag>}
              </div>
              <p style={{ fontSize: 12, color: C.tM, margin: "0 0 3px" }}>{c.what}</p>
              <p style={{ fontSize: 11.5, color: C.r, margin: 0 }}>⚠ {c.weakness}</p>
            </div>
          ))}
        </div>
      )}
      {data.risks?.length > 0 && (
        <div style={{ background: C.yS, borderRadius: 14, padding: 18, border: `1px solid ${C.y}15` }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.y, textTransform: "uppercase", marginBottom: 8 }}>⚠️ Risks</div>
          {data.risks.map((r, i) => <div key={i} style={{ fontSize: 12.5, color: C.tM, padding: "3px 0" }}>• {r}</div>)}
        </div>
      )}
      {data.steps?.length > 0 && (
        <div style={{ background: C.gS, borderRadius: 14, padding: 18, border: `1px solid ${C.g}15` }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.g, textTransform: "uppercase", marginBottom: 8 }}>🚀 Validation Steps</div>
          {data.steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "5px 0" }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: `${C.g}12`, color: C.g, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 12.5, color: C.tM, lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      )}
      {data.expertView && (
        <div style={{ background: C.bS, borderRadius: 14, padding: 18, border: `1px solid ${C.b}15` }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.b, textTransform: "uppercase", marginBottom: 6 }}>🧑‍🔬 Expert Insights</div>
          <p style={{ fontSize: 12.5, color: C.tM, lineHeight: 1.6, margin: 0 }}>{data.expertView}</p>
        </div>
      )}
    </div>
  );
}

// ── Problem Card ────────────────────────────────────────────
function ProblemCard({ p, idx, expanded, onToggle, onDeepDive, deepDive, loadingDD }) {
  const catC = { UX: C.p, Pricing: C.g, Trust: C.r, Access: C.b, Speed: C.y, Communication: C.acc, Quality: "#DB2777", "Missing Feature": C.cy, Legal: "#4F46E5", Sustainability: "#16A34A", Other: C.tD };
  const cc = catC[p.category] || C.tD;
  const fl = { high: "Frequent", medium: "Regular", low: "Occasional" };
  const sl = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
  const fc = { high: C.r, medium: C.y, low: C.tD };
  const sc = { critical: C.r, high: "#EA580C", medium: C.y, low: C.tD };

  return (
    <div style={{ background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 16, overflow: "hidden", transition: "all 0.25s", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }} onClick={onToggle}>
      <div style={{ padding: "18px 22px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.acc, opacity: 0.25 }}>{String(idx + 1).padStart(2, "0")}</span>
            <Tag color={cc}>{p.category}</Tag>
          </div>
          <Score n={p.opportunityScore} />
        </div>
        <h3 style={{ fontSize: 15.5, fontWeight: 700, color: C.t, margin: "0 0 6px", lineHeight: 1.4 }}>{p.title}</h3>
        <p style={{ fontSize: 13, color: C.tM, lineHeight: 1.6, margin: "0 0 10px" }}>{p.description}</p>
        <div style={{ display: "flex", gap: 6 }}>
          <Tag color={fc[p.frequency]}>↻ {fl[p.frequency] || p.frequency}</Tag>
          <Tag color={sc[p.severity]}>⚠ {sl[p.severity] || p.severity}</Tag>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.brd}`, padding: "16px 22px 20px", background: C.bg }} onClick={e => e.stopPropagation()}>
          <Sec icon="📋" title="Evidence"><p style={{ fontSize: 13, color: C.tM, lineHeight: 1.6, fontStyle: "italic", paddingLeft: 12, borderLeft: `2px solid ${C.acc}33` }}>{p.evidence}</p></Sec>
          <Sec icon="🔗" title="Sources"><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{p.sources?.map((s, i) => <Tag key={i} color={C.tD}>{s}</Tag>)}</div></Sec>
          <Sec icon="⚙️" title="Existing Solutions" color={C.y}><p style={{ fontSize: 13, color: C.tM, lineHeight: 1.6 }}>{p.existingSolutions}</p></Sec>
          <Sec icon="🎯" title="Target Audience" color={C.b}><p style={{ fontSize: 13, color: C.tM }}>{p.targetAudience}</p></Sec>
          <div style={{ background: C.accS, borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.acc}15`, marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.acc, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>💡 Potential Approach</div>
            <p style={{ fontSize: 13, color: C.t, lineHeight: 1.6 }}>{p.potentialApproach}</p>
          </div>
          {!deepDive && <Btn primary small onClick={e => { e.stopPropagation(); onDeepDive(p); }} disabled={loadingDD}>{loadingDD ? "⏳ Researching..." : "🔬 Deep Dive — Full Analysis"}</Btn>}
          {loadingDD && <Loader text="Deep Dive in progress" />}
          {deepDive && <DeepDivePanel data={deepDive} />}
        </div>
      )}
    </div>
  );
}

// ── Idea Card ───────────────────────────────────────────────
function IdeaCard({ idea, idx }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: C.s1, borderRadius: 16, border: `1px solid ${C.brd}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginBottom: 12 }}>
      <div style={{ padding: "20px 22px", cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
          <div>
            <span style={{ fontSize: 17, fontWeight: 800, color: C.acc }}>{idea.name}</span>
            <p style={{ fontSize: 13, color: C.b, margin: "2px 0 0", fontWeight: 600, fontStyle: "italic" }}>{idea.tagline}</p>
          </div>
          <span style={{ fontSize: 16, color: C.tDD, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
        </div>
        <p style={{ fontSize: 13, color: C.tM, lineHeight: 1.6, margin: 0 }}>{idea.description}</p>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${C.brd}`, padding: "16px 22px 20px", background: C.bg }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[["💰 Revenue", idea.model], ["👤 Customer", idea.customer], ["💵 MVP Cost", idea.cost], ["⏱ Timeline", idea.timeline]].map(([l, v]) => (
              <div key={l} style={{ background: C.s1, borderRadius: 10, padding: 12, border: `1px solid ${C.brd}` }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.acc, textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 12, color: C.tM }}>{v}</div>
              </div>
            ))}
          </div>
          <Sec icon="🛠" title="MVP Features" color={C.cy}><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{idea.mvp?.map((f, i) => <Tag key={i} color={C.cy}>{f}</Tag>)}</div></Sec>
          <Sec icon="⚡" title="Competitive Edge" color={C.g}><p style={{ fontSize: 12.5, color: C.tM, lineHeight: 1.5 }}>{idea.edge}</p></Sec>
          {idea.similar && <Sec icon="📎" title="Similar Successes" color={C.p}><p style={{ fontSize: 12.5, color: C.tM }}>{idea.similar}</p></Sec>}
          <Sec icon="📅" title="Week 1 Actions" color={C.acc}>
            {idea.week1?.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0" }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: C.accS, color: C.acc, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 12, color: C.tM }}>{a}</span>
              </div>
            ))}
          </Sec>
        </div>
      )}
    </div>
  );
}

// ── Competitive Panel ───────────────────────────────────────
function CompPanel({ data }) {
  const tc = { high: C.r, medium: C.y, low: C.g };
  return (
    <div className="animate-fadeUp" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: C.s1, borderRadius: 16, padding: 22, border: `1px solid ${C.brd}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: C.t, marginBottom: 8 }}>⚔️ Competitive Landscape</h3>
        <p style={{ fontSize: 13, color: C.tM, lineHeight: 1.6, marginBottom: 6 }}>{data.landscape}</p>
        {data.totalFunding && <Tag color={C.g}>💰 {data.totalFunding}</Tag>}
      </div>
      {data.players?.map((p, i) => (
        <div key={i} style={{ background: C.s1, borderRadius: 14, padding: 18, border: `1px solid ${C.brd}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
            <div><span style={{ fontSize: 15, fontWeight: 700, color: C.t }}>{p.name}</span>{p.founded && <span style={{ fontSize: 11, color: C.tDD, marginLeft: 8 }}>Est. {p.founded}</span>}</div>
            <div style={{ display: "flex", gap: 6 }}>{p.funding && <Tag color={C.g}>{p.funding}</Tag>}<Tag color={tc[p.threat] || C.tD}>Threat: {p.threat}</Tag></div>
          </div>
          <p style={{ fontSize: 12.5, color: C.tM, margin: "0 0 8px" }}>{p.description}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><div style={{ fontSize: 10, fontWeight: 800, color: C.g, marginBottom: 3 }}>STRENGTHS</div>{p.strengths?.map((s, j) => <div key={j} style={{ fontSize: 11.5, color: C.tM, padding: "2px 0" }}>+ {s}</div>)}</div>
            <div><div style={{ fontSize: 10, fontWeight: 800, color: C.r, marginBottom: 3 }}>WEAKNESSES</div>{p.weaknesses?.map((w, j) => <div key={j} style={{ fontSize: 11.5, color: C.tM, padding: "2px 0" }}>− {w}</div>)}</div>
          </div>
        </div>
      ))}
      {data.gaps?.length > 0 && (
        <div style={{ background: C.gS, borderRadius: 14, padding: 18, border: `1px solid ${C.g}15` }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.g, textTransform: "uppercase", marginBottom: 8 }}>🎯 Market Gaps</div>
          {data.gaps.map((g, i) => <div key={i} style={{ fontSize: 12.5, color: C.tM, padding: "3px 0" }}>→ {g}</div>)}
          {data.opportunity && <p style={{ fontSize: 13, color: C.g, margin: "10px 0 0", fontWeight: 700 }}>💎 {data.opportunity}</p>}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
export default function ProblemRadar() {
  const [plan, setPlan] = useState("free");
  const [scansUsed, setScansUsed] = useState(0);
  const [query, setQuery] = useState("");
  const [sources, setSrc] = useState({ reddit: true, twitter: true, forums: true, reviews: true, news: false, blogs: false });
  const [tab, setTab] = useState("scan");
  const [loading, setLoading] = useState(false);
  const [loadingDD, setLoadingDD] = useState(null);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [loadingComp, setLoadingComp] = useState(false);
  const [results, setResults] = useState(null);
  const [deepDives, setDD] = useState({});
  const [ideas, setIdeas] = useState(null);
  const [competitive, setComp] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [sortBy, setSort] = useState("score");
  const [filterCat, setFilter] = useState("all");
  const [selectedProblems, setSelected] = useState(new Set());
  const [history, setHistory] = useState([]);
  const [paywall, setPaywall] = useState(null);
  const [suggestions, setSugg] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const [suggLoading, setSuggLoading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const suggTimer = useRef(null);
  const inputRef = useRef();

  // Load plan from server on mount
  useEffect(() => {
    fetch("/api/me")
      .then(r => r.json())
      .then(d => {
        setPlan(d.plan || "free");
        if (d.scansLeft !== undefined && d.scansLeft !== -1) {
          setScansUsed(Math.max(0, 3 - d.scansLeft));
        }
      })
      .catch(() => {});
    if (typeof window !== "undefined" && window.location.search.includes("upgraded=true")) {
      setUpgraded(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const isPro = plan === "pro" || plan === "team";
  const maxP = isPro ? 10 : 6;
  const canScan = isPro || scansUsed < 3;
  const activeSrc = Object.entries(sources).filter(([, v]) => v).map(([k]) => k);
  const gate = (feat, fn) => { if (isPro) return fn(); setPaywall(feat); };

  const handleUpgrade = async (planId) => {
    setPaywall(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || "Betalingen zijn nog niet geconfigureerd.");
    } catch {
      setError("Checkout kon niet worden gestart. Probeer opnieuw.");
    }
  };

  // Autocomplete
  const fetchSugg = useCallback(async (val) => {
    if (val.trim().length < 3) { setSugg([]); return; }
    setSuggLoading(true);
    try {
      const data = await api("autocomplete", { input: val });
      if (data.suggestions?.length) { setSugg(data.suggestions.slice(0, 6)); setShowSugg(true); }
    } catch { setSugg([]); }
    setSuggLoading(false);
  }, []);

  const onQChange = (val) => { setQuery(val); clearTimeout(suggTimer.current); if (val.trim().length >= 3) { suggTimer.current = setTimeout(() => fetchSugg(val), 700); } else { setSugg([]); } };
  const pickSugg = (s) => { setQuery(s); setSugg([]); setShowSugg(false); };

  // Research actions
  async function runScan() {
    if (!query.trim() || !canScan) return;
    setLoading(true); setError(null); setResults(null); setIdeas(null); setComp(null); setDD({}); setExpanded(null); setSelected(new Set()); setTab("scan"); setShowSugg(false);
    try {
      const data = await api("research", { query, sources: activeSrc, maxProblems: maxP });
      setResults(data);
      if (!isPro) setScansUsed(data.scansLeft !== undefined ? Math.max(0, 3 - data.scansLeft) : s => s + 1);
      if (isPro) setHistory(h => [{ query, date: new Date().toISOString(), results: data }, ...h].slice(0, 50));
    } catch (e) {
      if (e.status === 403) setPaywall("unlimited scans");
      else setError(e.message);
    }
    setLoading(false);
  }

  async function runDD(p) { gate("Deep Dive", async () => { setLoadingDD(p.id); try { const data = await api("deepdive", { problem: p, topic: results?.topic || query }); setDD(dd => ({ ...dd, [p.id]: data })); } catch (e) { if (e.status === 403) setPaywall("Deep Dive"); else setError(e.message); } setLoadingDD(null); }); }
  async function runIdeas() { const sel = results?.problems?.filter(p => selectedProblems.has(p.id)) || []; if (!sel.length) return; gate("Idea Generator", async () => { setLoadingIdeas(true); setTab("ideas"); try { const data = await api("ideas", { problems: sel, topic: results?.topic || query }); setIdeas(data); } catch (e) { if (e.status === 403) setPaywall("Idea Generator"); else setError(e.message); } setLoadingIdeas(false); }); }
  async function runComp() { gate("Competitive Landscape", async () => { setLoadingComp(true); setTab("competitive"); try { const data = await api("competitive", { topic: results?.topic || query }); setComp(data); } catch (e) { if (e.status === 403) setPaywall("Competitive Landscape"); else setError(e.message); } setLoadingComp(false); }); }

  const toggleSel = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const sorted = results?.problems ? [...results.problems]
    .filter(p => filterCat === "all" || p.category === filterCat)
    .sort((a, b) => {
      const sev = { critical: 4, high: 3, medium: 2, low: 1 }; const freq = { high: 3, medium: 2, low: 1 };
      if (sortBy === "score") return b.opportunityScore - a.opportunityScore;
      if (sortBy === "severity") return (sev[b.severity] || 0) - (sev[a.severity] || 0);
      return (freq[b.frequency] || 0) - (freq[a.frequency] || 0);
    }) : [];
  const cats = results?.problems ? [...new Set(results.problems.map(p => p.category))] : [];

  const SUGG = [["🏥 Healthcare", "healthcare problems"], ["🛒 E-commerce", "online shopping frustrations"], ["🏠 Rental Housing", "rental housing problems"], ["💼 Freelancing", "freelancer problems"], ["🎓 Online Education", "online education problems"], ["🐕 Pet Care", "pet care problems"], ["👴 Elder Care", "elderly care problems"], ["🌱 Sustainability", "sustainable living problems"], ["🚗 Electric Vehicles", "EV problems"], ["💰 Personal Finance", "personal finance problems"], ["🧒 Childcare", "childcare problems"], ["🍔 Food Delivery", "food delivery problems"]];
  const SRC = [["reddit", "💬", "Reddit"], ["twitter", "🐦", "X / Twitter"], ["forums", "🗣️", "Forums"], ["reviews", "⭐", "Reviews"], ["news", "📰", "News"], ["blogs", "✍️", "Blogs"]];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.t }}>
      {paywall && <Paywall feature={paywall} onClose={() => setPaywall(null)} onSelect={handleUpgrade} />}

      {upgraded && (
        <div style={{ background: "#F0FDF4", borderBottom: "1px solid #BBF7D0", padding: "11px 24px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>🎉 Welkom bij Pro! Alle functies zijn nu ontgrendeld.</span>
          <button onClick={() => setUpgraded(false)} style={{ background: "none", border: "none", color: C.tD, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${C.brd}`, background: C.s1, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth: 940, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accG, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#fff" }}>📡</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.t }}>ProblemRadar</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {!isPro && <span style={{ fontSize: 12, color: C.tM }}><span style={{ color: scansUsed >= 3 ? C.r : C.g, fontWeight: 700 }}>{3 - scansUsed}</span> scans left</span>}
            <Tag color={isPro ? C.acc : C.tD} style={{ cursor: "pointer" }} onClick={() => !isPro && setPaywall("Pro features")}>{plan === "team" ? "👥 Team" : plan === "pro" ? "⚡ Pro" : "Free"}</Tag>
            {!isPro && <Btn small primary onClick={() => setPaywall("all Pro features")}>Upgrade</Btn>}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 940, margin: "0 auto", padding: "28px 24px" }}>
        {/* Search */}
        <div style={{ background: C.s1, borderRadius: 20, padding: "24px 26px", border: `1px solid ${C.brd}`, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.acc, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>What market do you want to explore?</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, position: "relative" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input ref={inputRef} value={query} onChange={e => onQChange(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { setShowSugg(false); runScan(); } if (e.key === "Escape") setShowSugg(false); }}
                onFocus={() => { if (suggestions.length > 0) setShowSugg(true); }}
                onBlur={() => setTimeout(() => setShowSugg(false), 200)}
                placeholder="e.g. 'healthcare problems in Europe' or 'freelancer tools'"
                style={{ width: "100%", padding: "13px 18px", borderRadius: 12, background: C.bg, border: `1px solid ${C.brd}`, color: C.t, fontSize: 14, outline: "none", transition: "border 0.2s" }} />
              {suggLoading && <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, border: `2px solid ${C.s3}`, borderTopColor: C.acc, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
              {showSugg && suggestions.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50, background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.1)" }}>
                  <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 800, color: C.tDD, textTransform: "uppercase", letterSpacing: "0.08em" }}>✨ Suggested queries</div>
                  {suggestions.map((s, i) => (
                    <div key={i} onClick={() => pickSugg(s)} style={{ padding: "10px 16px", cursor: "pointer", fontSize: 13, color: C.tM, transition: "all 0.1s", display: "flex", alignItems: "center", gap: 10, borderTop: i === 0 ? `1px solid ${C.brd}` : "none" }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.accS; e.currentTarget.style.color = C.t; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.tM; }}>
                      <span style={{ color: C.acc, fontSize: 12 }}>🔍</span>{s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Btn primary onClick={() => { setShowSugg(false); runScan(); }} disabled={loading || !query.trim() || !canScan}>{loading ? "⏳" : !canScan ? "🔒" : "🔍 Scan"}</Btn>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {SUGG.map(([l, q]) => <button key={q} onClick={() => setQuery(q)} style={{ padding: "5px 12px", borderRadius: 20, background: C.bg, border: `1px solid ${C.brd}`, color: C.tD, fontSize: 11.5, cursor: "pointer", transition: "all 0.15s" }}>{l}</button>)}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.tDD, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>Sources:</span>
            {SRC.map(([id, ic, lb]) => <button key={id} onClick={() => setSrc(s => ({ ...s, [id]: !s[id] }))} style={{ padding: "4px 10px", borderRadius: 10, background: sources[id] ? C.accS : "transparent", border: `1px solid ${sources[id] ? C.acc + "33" : C.brd}`, color: sources[id] ? C.acc : C.tDD, fontSize: 11, cursor: "pointer" }}>{ic} {lb}</button>)}
          </div>
        </div>

        {/* Tabs */}
        {results && (
          <div style={{ display: "flex", gap: 3, marginBottom: 20, background: C.s1, borderRadius: 14, padding: 3, border: `1px solid ${C.brd}` }}>
            {[["scan", "📊 Problems"], ["ideas", "💡 Ideas"], ["competitive", "⚔️ Landscape"], ["history", "📁 History"]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: "10px 0", borderRadius: 11, border: "none", cursor: "pointer", background: tab === k ? C.accS : "transparent", color: tab === k ? C.acc : C.tD, fontWeight: 700, fontSize: 13, transition: "all 0.15s" }}>{l}</button>
            ))}
          </div>
        )}

        {loading && <Loader text="Scanning the web for problems" />}
        {error && (
          <div style={{ background: C.rS, border: `1px solid ${C.r}22`, borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 15, color: C.r, fontWeight: 700, marginBottom: 6 }}>⚠️ Something went wrong</div>
            <div style={{ fontSize: 13, color: C.tM, marginBottom: 14 }}>{error}</div>
            <Btn small primary onClick={runScan}>Retry</Btn>
          </div>
        )}

        {/* Scan Results */}
        {results && tab === "scan" && (
          <div className="animate-fadeIn">
            <div style={{ background: C.s1, borderRadius: 20, padding: "24px 26px", border: `1px solid ${C.brd}`, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: C.acc, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Research Report</div>
                  <h2 style={{ fontSize: 21, fontWeight: 800, margin: 0, color: C.t }}>{results.topic}</h2>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ background: C.bg, padding: "8px 16px", borderRadius: 12, border: `1px solid ${C.brd}`, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.acc }}>{results.problems?.length || 0}</div><div style={{ fontSize: 9, color: C.tD, fontWeight: 800 }}>PROBLEMS</div></div>
                  <div style={{ background: C.bg, padding: "8px 16px", borderRadius: 12, border: `1px solid ${C.brd}`, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.g }}>{results.problems?.filter(p => p.opportunityScore >= 70).length || 0}</div><div style={{ fontSize: 9, color: C.tD, fontWeight: 800 }}>HIGH OPP.</div></div>
                </div>
              </div>
              <p style={{ fontSize: 13.5, color: C.tM, lineHeight: 1.7, margin: "0 0 14px" }}>{results.summary}</p>
              {results.trendingTopics?.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}><span style={{ fontSize: 10, color: C.tDD, fontWeight: 800 }}>TRENDING:</span>{results.trendingTopics.map((t, i) => <Tag key={i} color={C.p}>{t}</Tag>)}</div>}
              {results.marketInsight && <div style={{ background: C.gS, borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.g}18` }}><span style={{ fontSize: 10, fontWeight: 800, color: C.g, textTransform: "uppercase" }}>💎 Market Insight</span><p style={{ fontSize: 12.5, color: C.t, margin: "4px 0 0", lineHeight: 1.5 }}>{results.marketInsight}</p></div>}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <Btn small primary onClick={runIdeas} disabled={selectedProblems.size === 0 || loadingIdeas}>💡 Generate Ideas {selectedProblems.size > 0 ? `(${selectedProblems.size})` : ""}</Btn>
              <Btn small onClick={runComp} disabled={loadingComp}>⚔️ Map Competitors</Btn>
              <Btn small ghost onClick={() => gate("Export", () => {
                const headers = ["#", "Title", "Category", "Score", "Frequency", "Severity", "Description", "Target Audience", "Potential Approach"];
                const rows = (results.problems || []).map((p, i) => [
                  i + 1,
                  `"${(p.title || "").replace(/"/g, '""')}"`,
                  p.category || "",
                  p.opportunityScore || "",
                  p.frequency || "",
                  p.severity || "",
                  `"${(p.description || "").replace(/"/g, '""')}"`,
                  `"${(p.targetAudience || "").replace(/"/g, '""')}"`,
                  `"${(p.potentialApproach || "").replace(/"/g, '""')}"`,
                ].join(","));
                const csv = [headers.join(","), ...rows].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `problemradar-${(results.topic || "export").replace(/\s+/g, "-")}.csv`;
                a.click();
              })}>📥 Export CSV</Btn>
              <div style={{ marginLeft: "auto", display: "flex", gap: 5, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: C.tDD, fontWeight: 800 }}>SORT:</span>
                {[["score", "Opportunity"], ["severity", "Severity"], ["frequency", "Frequency"]].map(([k, l]) => <button key={k} onClick={() => setSort(k)} style={{ padding: "4px 10px", borderRadius: 8, background: sortBy === k ? C.accS : "transparent", border: `1px solid ${sortBy === k ? C.acc + "33" : "transparent"}`, color: sortBy === k ? C.acc : C.tDD, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>{l}</button>)}
              </div>
            </div>

            {cats.length > 1 && <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
              <button onClick={() => setFilter("all")} style={{ padding: "3px 10px", borderRadius: 8, background: filterCat === "all" ? C.bS : "transparent", border: `1px solid ${filterCat === "all" ? C.b + "33" : "transparent"}`, color: filterCat === "all" ? C.b : C.tDD, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>All</button>
              {cats.map(c => <button key={c} onClick={() => setFilter(filterCat === c ? "all" : c)} style={{ padding: "3px 10px", borderRadius: 8, background: filterCat === c ? C.bS : "transparent", border: `1px solid ${filterCat === c ? C.b + "33" : "transparent"}`, color: filterCat === c ? C.b : C.tDD, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>{c}</button>)}
            </div>}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sorted.map((p, i) => (
                <div key={p.id} style={{ position: "relative" }}>
                  <div onClick={e => { e.stopPropagation(); toggleSel(p.id); }} style={{ position: "absolute", top: 18, right: 22, zIndex: 10, width: 22, height: 22, borderRadius: 6, border: `2px solid ${selectedProblems.has(p.id) ? C.acc : C.brdL}`, background: selectedProblems.has(p.id) ? C.accS : C.s1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", fontSize: 12, color: C.acc, fontWeight: 800 }}>
                    {selectedProblems.has(p.id) && "✓"}
                  </div>
                  <ProblemCard p={p} idx={i} expanded={expanded === p.id} onToggle={() => setExpanded(expanded === p.id ? null : p.id)} onDeepDive={runDD} deepDive={deepDives[p.id]} loadingDD={loadingDD === p.id} />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "ideas" && <div className="animate-fadeIn">{loadingIdeas && <Loader text="Generating startup ideas" />}{ideas?.ideas?.map((idea, i) => <IdeaCard key={idea.id} idea={idea} idx={i} />)}{!loadingIdeas && !ideas && <div style={{ textAlign: "center", padding: 40, color: C.tD }}>Select problems and click "Generate Ideas".</div>}</div>}
        {tab === "competitive" && <div className="animate-fadeIn">{loadingComp && <Loader text="Mapping competitive landscape" />}{competitive && <CompPanel data={competitive} />}{!loadingComp && !competitive && <div style={{ textAlign: "center", padding: 40, color: C.tD }}>Click "Map Competitors" to analyze.</div>}</div>}
        {tab === "history" && (
          <div className="animate-fadeIn">
            {!isPro ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.t, marginBottom: 6 }}>Research History is een Pro-functie</div>
                <div style={{ fontSize: 13, color: C.tM, marginBottom: 20, maxWidth: 340, margin: "0 auto 20px" }}>Bewaar al je onderzoeken en herlaad ze met één klik.</div>
                <Btn primary small onClick={() => setPaywall("Research History")}>Upgrade naar Pro</Btn>
              </div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: C.tD }}>Nog geen geschiedenis. Start een scan om te beginnen.</div>
            ) : (
              history.map((h, i) => (
                <div key={i} onClick={() => { setResults(h.results); setQuery(h.query); setTab("scan"); }} style={{ background: C.s1, borderRadius: 14, padding: "16px 20px", border: `1px solid ${C.brd}`, cursor: "pointer", marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: C.t, fontSize: 14 }}>{h.results?.topic || h.query}</div>
                      <div style={{ fontSize: 12, color: C.tD, marginTop: 2 }}>{h.results?.problems?.length || 0} problems</div>
                    </div>
                    <div style={{ fontSize: 11, color: C.tDD }}>{new Date(h.date).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !results && !error && (
          <div style={{ textAlign: "center", padding: "50px 20px" }} className="animate-fadeIn">
            <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: C.t, marginBottom: 8 }}>Discover what people actually need</h2>
            <p style={{ fontSize: 14, color: C.tM, maxWidth: 460, margin: "0 auto 36px", lineHeight: 1.7 }}>Enter any market or niche and ProblemRadar scans Reddit, forums, reviews, and social media to find real problems and opportunities.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", marginBottom: 44 }}>
              {[["🔍", "Web Research", "Scans real sources"], ["🧠", "AI Analysis", "Clusters & scores"], ["💡", "Idea Engine", "Generates concepts"], ["⚔️", "Landscape", "Maps competitors"]].map(([ic, t, d]) => (
                <div key={t} style={{ background: C.s1, borderRadius: 16, padding: "22px 20px", border: `1px solid ${C.brd}`, width: 165, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{ic}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.t, marginBottom: 3 }}>{t}</div>
                  <div style={{ fontSize: 11.5, color: C.tD }}>{d}</div>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: C.t, marginBottom: 20 }}>Simple pricing</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16, maxWidth: 740, margin: "0 auto" }}>
              {PLANS.map(p => (
                <div key={p.id} style={{ background: C.s1, borderRadius: 18, padding: 24, border: `1px solid ${p.popular ? C.acc + "44" : C.brd}`, position: "relative", textAlign: "left", boxShadow: p.popular ? "0 4px 20px rgba(232,93,36,0.08)" : "0 1px 4px rgba(0,0,0,0.03)" }}>
                  {p.popular && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: C.accG, color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 14px", borderRadius: 20 }}>POPULAR</div>}
                  <div style={{ fontSize: 13, fontWeight: 800, color: p.color, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ marginBottom: 16 }}><span style={{ fontSize: 32, fontWeight: 800, color: C.t }}>{p.price === 0 ? "Free" : `$${p.price}`}</span>{p.period && <span style={{ fontSize: 13, color: C.tM }}>{p.period}</span>}</div>
                  <div style={{ fontSize: 12, color: C.acc, fontWeight: 700, marginBottom: 12 }}>{p.scansLabel}</div>
                  {p.features.map((f, i) => <div key={i} style={{ fontSize: 12, color: C.tM, padding: "3px 0", display: "flex", gap: 6 }}><span style={{ color: C.g }}>✓</span>{f}</div>)}
                  {p.excluded.map((f, i) => <div key={i} style={{ fontSize: 12, color: C.tDD, padding: "3px 0", display: "flex", gap: 6 }}><span>✗</span>{f}</div>)}
                  <div style={{ marginTop: 16 }}><Btn primary={p.popular} small style={{ width: "100%", textAlign: "center" }} onClick={() => p.id !== "free" && handleUpgrade(p.id)}>{plan === p.id ? "Current Plan" : p.cta}</Btn></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: `1px solid ${C.brd}`, padding: "14px 24px", textAlign: "center", fontSize: 11, color: C.tDD, background: C.s1 }}>
        ProblemRadar · AI-powered problem discovery for entrepreneurs · Powered by Claude
      </footer>
    </div>
  );
}
