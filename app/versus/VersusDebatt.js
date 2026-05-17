"use client";
import { useState, useRef } from "react";
import AgentAvatar from "../agent/[namn]/AgentAvatar";
import { agentVisuell } from "../agentData";

const C = {
  bg: "#0a0a0a", surface: "#0f0f0f", border: "#1a1a1a",
  text: "#e8e8e8", dim: "#555", accent: "#e879f9",
  green: "#4ade80", red: "#f87171",
};

const AMNESFORSLAG = [
  "Ska AI få fatta juridiska beslut?",
  "Ska vi beskatta rika mycket mer?",
  "Är demokrati överskattat?",
  "Är bostadsmarknaden trasig?",
  "Ska Sverige ha kärnkraft?",
  "Har livet blivit sämre trots högre standard?",
  "Är klimatrörelsen för radikal?",
  "Ska droger legaliseras?",
  "Är grundinkomst en bra idé?",
  "Är skärmtid ett folkhälsoproblem?",
  "Ska arvsskatt återinföras?",
  "Kan AI ersätta läkare?",
  "Arbetar vi för mycket?",
  "Är Bitcoin framtidens valuta?",
  "Är ensamhet ett samhällsproblem?",
];

const ROLLER = ["ÖPPNINGSANSPRÅK", "MOTHUGG", "SLUTREPLIK"];

async function streamPost({ amne, historik, agent, onToken, signal }) {
  const res = await fetch("/api/chatt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amne, historik, agent }),
    signal,
  });
  if (!res.ok || !res.body) {
    if (res.status === 429) throw Object.assign(new Error("rate_limit"), { status: 429 });
    throw new Error(`HTTP ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "", buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") return text;
      try {
        const token = JSON.parse(raw).choices?.[0]?.delta?.content ?? "";
        if (token) { text += token; onToken(text); }
      } catch { /* ignore */ }
    }
  }
  return text;
}

export default function VersusDebatt({ agentA, agentB }) {
  const [amne, setAmne] = useState("");
  const [status, setStatus] = useState("idle"); // idle | streaming | done | error
  const [posts, setPosts] = useState([]); // [{agent, roll, text, done}]
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef(null);
  const va = agentVisuell(agentA);
  const vb = agentVisuell(agentB);

  function shuffleAmne() {
    setAmne(AMNESFORSLAG[Math.floor(Math.random() * AMNESFORSLAG.length)]);
  }

  function stop() {
    abortRef.current?.abort();
    setStatus("done");
  }

  function reset() {
    abortRef.current?.abort();
    setPosts([]);
    setStatus("idle");
    setErrorMsg("");
  }

  async function starta() {
    if (!amne.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPosts([]);
    setStatus("streaming");
    setErrorMsg("");

    // Sequence: A opens → B rebuts → A closes
    const sequence = [
      { agent: agentA, roll: "ÖPPNINGSANSPRÅK" },
      { agent: agentB, roll: "MOTHUGG" },
      { agent: agentA, roll: "SLUTREPLIK" },
    ];

    const historik = [];
    try {
      for (let i = 0; i < sequence.length; i++) {
        const { agent, roll } = sequence[i];
        const postIdx = i;
        setPosts(prev => [...prev, { agent, roll, text: "", done: false }]);

        const result = await streamPost({
          amne,
          historik: [...historik],
          agent,
          signal: ctrl.signal,
          onToken: (text) => {
            setPosts(prev => prev.map((p, idx) => idx === postIdx ? { ...p, text } : p));
          },
        });

        historik.push({ agent, text: result });
        setPosts(prev => prev.map((p, idx) => idx === postIdx ? { ...p, text: result, done: true } : p));
      }
      setStatus("done");
    } catch (e) {
      if (e.name === "AbortError") return;
      setErrorMsg(e.status === 429 ? "För många debatter. Vänta en stund." : "Något gick fel. Försök igen.");
      setStatus("error");
    }
  }

  const isStreaming = status === "streaming";
  const isDone = status === "done";

  return (
    <div style={{ marginTop: "48px", borderTop: `1px solid ${C.border}`, paddingTop: "36px" }}>
      <p style={{ fontSize: "11px", color: C.dim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px", fontFamily: "monospace" }}>
        1v1 Debattsimulator
      </p>
      <p style={{ fontSize: "14px", color: "#666", margin: "0 0 24px", lineHeight: 1.6 }}>
        Tre inlägg — öppningsanspråk, direkt mothugg och slutreplik — bara mellan dessa två agenter.
      </p>

      {/* Topic input */}
      {!isStreaming && !isDone && (
        <div style={{ display: "flex", gap: "10px", alignItems: "stretch", flexWrap: "wrap", marginBottom: "20px" }}>
          <input
            value={amne}
            onChange={e => setAmne(e.target.value)}
            onKeyDown={e => e.key === "Enter" && starta()}
            placeholder="Ange ett debattämne…"
            maxLength={200}
            style={{
              flex: 1, minWidth: "200px", background: "#111", border: `1px solid ${C.border}`,
              borderRadius: "6px", color: C.text, fontSize: "14px", padding: "10px 14px",
              fontFamily: "Georgia, serif", outline: "none",
            }}
          />
          <button
            onClick={shuffleAmne}
            title="Slumpa ämne"
            style={{ background: "#111", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.dim, fontSize: "16px", padding: "10px 14px", cursor: "pointer" }}
          >
            ⟳
          </button>
          <button
            onClick={starta}
            disabled={!amne.trim()}
            style={{
              background: amne.trim() ? C.accent : "#222", border: "none", borderRadius: "6px",
              color: amne.trim() ? "#000" : C.dim, fontSize: "13px", fontWeight: 700,
              padding: "10px 20px", cursor: amne.trim() ? "pointer" : "not-allowed",
              letterSpacing: "0.05em", fontFamily: "Georgia, serif",
            }}
          >
            Starta
          </button>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div style={{ background: "#1a0808", border: `1px solid #f8717130`, borderRadius: "6px", padding: "12px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: C.red }}>{errorMsg}</span>
          <button onClick={reset} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: "13px" }}>Försök igen</button>
        </div>
      )}

      {/* Posts */}
      {posts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {posts.map((post, i) => {
            const v = post.agent === agentA ? va : vb;
            const rollFarg = i === 0 ? C.accent : i === 1 ? C.red : C.green;
            return (
              <div key={i} style={{ display: "flex", gap: "14px", padding: "20px 0", borderBottom: i < posts.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ flexShrink: 0, paddingTop: "2px" }}>
                  <AgentAvatar namn={post.agent} gradient={v.gradient} ring={v.ring} ikon={v.ikon} ikonFarg={v.ikonFarg} size={40} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", color: C.text, fontWeight: 600 }}>{post.agent}</span>
                    <span style={{ fontSize: "9px", color: rollFarg, letterSpacing: "0.12em", fontFamily: "monospace", background: rollFarg + "18", border: `1px solid ${rollFarg}30`, borderRadius: "10px", padding: "2px 8px" }}>
                      {post.roll}
                    </span>
                  </div>
                  <p style={{ fontSize: "15px", color: "#ccc", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                    {post.text}
                    {!post.done && <span style={{ display: "inline-block", width: "2px", height: "1em", background: C.accent, marginLeft: "2px", verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Controls after streaming */}
      {isStreaming && (
        <button onClick={stop} style={{ marginTop: "16px", background: "none", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.dim, fontSize: "12px", padding: "8px 16px", cursor: "pointer" }}>
          Avbryt
        </button>
      )}
      {isDone && (
        <button onClick={reset} style={{ marginTop: "20px", background: "#111", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.dim, fontSize: "13px", padding: "10px 20px", cursor: "pointer", fontFamily: "Georgia, serif" }}>
          Ny debatt
        </button>
      )}

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}
