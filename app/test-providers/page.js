"use client";
import { useState } from "react";

const PROVIDERS = ["groq", "fireworks", "deepseek", "github_models", "cloudflare", "cerebras", "sambanova", "openrouter", "codestral", "gemini"];

const LABELS = {
  groq:         "Groq — llama-3.3-70b-versatile",
  fireworks:    "Fireworks AI — llama-v3p1-70b-instruct",
  deepseek:     "DeepSeek — deepseek-chat (V3)",
  github_models:"GitHub Models — Llama-3.3-70B-Instruct",
  cloudflare:   "Cloudflare Workers AI — llama-3.3-70b-fp8-fast",
  cerebras:     "Cerebras — qwen-3-235b",
  sambanova:    "Sambanova — Meta-Llama-3.3-70B",
  openrouter:   "OpenRouter — llama-3.3-70b (free)",
  codestral:    "Codestral — codestral-latest",
  gemini:       "Gemini — gemini-2.0-flash-lite",
};

export default function TestProviders() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  async function runTest() {
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/test-providers");
      const data = await res.json();
      setResults(data);
    } catch (e) {
      setResults({ _error: e.message });
    }
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px", fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>AI Provider-test</h1>
      <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
        Testar alla 10 providers parallellt — i fallback-ordning: Groq → Fireworks → DeepSeek → GitHub Models → Cloudflare → Gemini m.fl.
      </p>

      <button
        onClick={runTest}
        disabled={loading}
        style={{
          padding: "10px 28px",
          background: loading ? "#333" : "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: loading ? "default" : "pointer",
          fontSize: 15,
          marginBottom: 32,
        }}
      >
        {loading ? "Testar…" : "Kör test"}
      </button>

      {results && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PROVIDERS.map((key) => {
            const r = results[key];
            if (!r) return null;
            const ok = r.ok;
            return (
              <div
                key={key}
                style={{
                  border: `1px solid ${ok ? "#1a4a1a" : "#4a1a1a"}`,
                  borderLeft: `4px solid ${ok ? "#22c55e" : "#ef4444"}`,
                  borderRadius: 6,
                  padding: "14px 16px",
                  background: ok ? "#0a1a0a" : "#1a0a0a",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: "bold", fontSize: 15, color: ok ? "#22c55e" : "#ef4444" }}>
                    {ok ? "✓" : "✗"} {LABELS[key] || key}
                  </span>
                  {r.latency != null && (
                    <span style={{ color: "#888", fontSize: 13 }}>{r.latency} ms</span>
                  )}
                </div>

                {ok ? (
                  <>
                    <div style={{ color: "#ccc", fontSize: 14, marginBottom: 4 }}>
                      Svar: <span style={{ color: "#fff" }}>{r.text}</span>
                    </div>
                    {r.model && (
                      <div style={{ color: "#666", fontSize: 12 }}>Modell: {r.model}</div>
                    )}
                    {r.availableModels?.length > 0 && (
                      <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>
                        Tillgängliga: {r.availableModels.join(", ")}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: "#f87171", fontSize: 13, wordBreak: "break-word" }}>
                    {r.error || `HTTP ${r.status}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
