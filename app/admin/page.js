"use client";

import { useState, useEffect, useRef } from "react";

const S = {
  page: { minHeight: "100vh", background: "#0F1117", color: "#E2E8F0", fontFamily: "system-ui, sans-serif", padding: "0 0 60px" },
  header: { background: "#1A1F2E", borderBottom: "1px solid #2D3748", padding: "16px 32px", display: "flex", alignItems: "center", gap: 12 },
  logo: { fontSize: 20, fontWeight: 800, color: "#E85D24" },
  badge: { fontSize: 11, background: "#2D3748", color: "#94A3B8", padding: "3px 10px", borderRadius: 20, fontWeight: 600 },
  container: { maxWidth: 760, margin: "0 auto", padding: "32px 24px" },
  card: { background: "#1A1F2E", borderRadius: 16, border: "1px solid #2D3748", padding: 28, marginBottom: 24 },
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" },
  input: { width: "100%", background: "#0F1117", border: "1px solid #2D3748", borderRadius: 10, padding: "11px 14px", color: "#E2E8F0", fontSize: 14, outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", background: "#0F1117", border: "1px solid #2D3748", borderRadius: 10, padding: "11px 14px", color: "#E2E8F0", fontSize: 13, outline: "none", resize: "vertical", minHeight: 220, fontFamily: "monospace", boxSizing: "border-box" },
  btnPrimary: { background: "linear-gradient(135deg,#E85D24,#F59E0B)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  btnGhost: { background: "transparent", color: "#94A3B8", border: "1px solid #2D3748", borderRadius: 10, padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  stat: { textAlign: "center" },
  statNum: { fontSize: 40, fontWeight: 800, color: "#E85D24" },
  statLabel: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
  msg: (ok) => ({ background: ok ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.12)", border: `1px solid ${ok ? "rgba(5,150,105,0.3)" : "rgba(220,38,38,0.3)"}`, color: ok ? "#34D399" : "#F87171", borderRadius: 10, padding: "11px 16px", fontSize: 13, marginTop: 16 }),
  preview: { background: "#fff", borderRadius: 10, border: "1px solid #2D3748", overflow: "hidden", marginTop: 16 },
};

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState("");
  const [subCount, setSubCount] = useState(null);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const secretRef = useRef();

  // Restore secret from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_secret");
    if (saved) { setSecret(saved); tryAuth(saved); }
  }, []);

  async function fetchCount(s) {
    try {
      const res = await fetch("/api/newsletter/subscribe", { headers: { "x-admin-secret": s } });
      const data = await res.json();
      if (data.error) return;
      setSubCount(data.count);
    } catch {}
  }

  async function tryAuth(s) {
    setAuthErr("");
    const res = await fetch("/api/newsletter/subscribe", { headers: { "x-admin-secret": s } });
    const data = await res.json();
    if (res.status === 401 || data.error === "Unauthorized") {
      setAuthErr("Verkeerd wachtwoord.");
      sessionStorage.removeItem("admin_secret");
      return;
    }
    sessionStorage.setItem("admin_secret", s);
    setAuthed(true);
    setSubCount(data.count ?? null);
  }

  async function handleSend() {
    if (!subject.trim() || !html.trim()) { setSendResult({ ok: false, msg: "Vul zowel onderwerp als inhoud in." }); return; }
    if (!confirm(`Verstuur "${subject}" naar alle subscribers?`)) return;
    setSending(true); setSendResult(null);
    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, subject, html }),
      });
      const data = await res.json();
      if (data.sent) {
        setSendResult({ ok: true, msg: `Broadcast verstuurd! ID: ${data.broadcastId}` });
        setSubject(""); setHtml("");
      } else {
        setSendResult({ ok: false, msg: data.error || "Versturen mislukt." });
      }
    } catch (e) {
      setSendResult({ ok: false, msg: e.message });
    } finally {
      setSending(false);
    }
  }

  if (!authed) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <span style={S.logo}>📡 ProblemRadar</span>
          <span style={S.badge}>Admin</span>
        </div>
        <div style={{ ...S.container, maxWidth: 420 }}>
          <div style={S.card}>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Admin toegang</h1>
            <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 24 }}>Vul je ADMIN_SECRET in om verder te gaan.</p>
            <label style={S.label}>Wachtwoord</label>
            <input
              ref={secretRef}
              type="password"
              style={S.input}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && tryAuth(secret)}
              placeholder="ADMIN_SECRET"
            />
            {authErr && <div style={S.msg(false)}>{authErr}</div>}
            <button style={{ ...S.btnPrimary, marginTop: 20, width: "100%" }} onClick={() => tryAuth(secret)}>
              Inloggen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <span style={S.logo}>📡 ProblemRadar</span>
        <span style={S.badge}>Admin</span>
        <span style={{ marginLeft: "auto", ...S.btnGhost, cursor: "pointer" }} onClick={() => { sessionStorage.removeItem("admin_secret"); setAuthed(false); setSecret(""); }}>
          Uitloggen
        </span>
      </div>

      <div style={S.container}>
        {/* Stats */}
        <div style={S.card}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Subscribers</h2>
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div style={S.stat}>
              <div style={S.statNum}>{subCount === null ? "…" : subCount}</div>
              <div style={S.statLabel}>Actieve subscribers</div>
            </div>
          </div>
          <button style={{ ...S.btnGhost, marginTop: 20 }} onClick={() => fetchCount(secret)}>
            ↻ Vernieuwen
          </button>
        </div>

        {/* Compose */}
        <div style={S.card}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Verstuur nieuwsbrief</h2>

          <label style={S.label}>Onderwerp</label>
          <input
            style={{ ...S.input, marginBottom: 20 }}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="bijv. Top 5 niches this week"
          />

          <label style={S.label}>Inhoud (HTML)</label>
          <textarea
            style={S.textarea}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder={"<h2>Hallo!</h2>\n<p>Deze week ontdekten we...</p>"}
          />

          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <button style={S.btnPrimary} onClick={handleSend} disabled={sending}>
              {sending ? "Versturen…" : `📤 Verstuur naar ${subCount !== null ? subCount + " " : ""}subscribers`}
            </button>
            <button style={S.btnGhost} onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? "Verberg preview" : "Toon preview"}
            </button>
          </div>

          {sendResult && <div style={S.msg(sendResult.ok)}>{sendResult.msg}</div>}
        </div>

        {/* Preview */}
        {showPreview && html && (
          <div style={S.card}>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Preview</h2>
            {subject && <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 12 }}>Onderwerp: <strong style={{ color: "#E2E8F0" }}>{subject}</strong></div>}
            <div style={S.preview}>
              <div style={{ padding: 24 }} dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
