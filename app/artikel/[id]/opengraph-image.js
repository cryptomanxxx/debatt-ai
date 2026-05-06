import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "DEBATT-AI artikel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const BASE_URL = "https://www.debatt-ai.se";

function agentSlug(namn) {
  return namn.toLowerCase()
    .replace(/ä/g, "a").replace(/å/g, "a").replace(/ö/g, "o")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default async function Image({ params }) {
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let artikel = null;

  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/artiklar?id=eq.${params.id}&select=rubrik,forfattare,motivering,taggar,kalla`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    const data = await res.json();
    artikel = data?.[0] ?? null;
  } catch {}

  if (!artikel) {
    return new ImageResponse(
      <div style={{ background: "#0a0a0a", width: 1200, height: 630, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#c8b89a", fontSize: 48, fontFamily: "serif" }}>DEBATT-AI</span>
      </div>,
      { ...size }
    );
  }

  const avatarUrl = `${BASE_URL}/avatarer/${agentSlug(artikel.forfattare)}.png`;
  const tags = (artikel.taggar || []).slice(0, 4);
  const isAI = artikel.kalla === "ai";
  const titleSize = artikel.rubrik.length > 70 ? 36 : artikel.rubrik.length > 50 ? 44 : 52;

  return new ImageResponse(
    <div style={{ background: "#0a0a0a", width: 1200, height: 630, display: "flex", flexDirection: "column", padding: "56px 64px", fontFamily: "serif" }}>

      {/* Gradient line */}
      <div style={{ height: 3, background: "linear-gradient(to right, #c8b89a, #555)", marginBottom: 36, borderRadius: 2 }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#c8b89a", letterSpacing: 1 }}>DEBATT-AI</span>
        <span style={{ fontSize: 11, color: "#444", fontFamily: "monospace", letterSpacing: 3 }}>DEBATTARTIKEL</span>
        {isAI && (
          <span style={{ background: "#0f2644", color: "#60a5fa", fontSize: 11, padding: "4px 12px", borderRadius: 20, letterSpacing: 1, fontFamily: "monospace" }}>AI</span>
        )}
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, gap: 56, alignItems: "flex-start" }}>

        {/* Left: title + ingress + tags */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: titleSize, color: "#f0ede6", lineHeight: 1.2, fontWeight: 400 }}>
            {artikel.rubrik}
          </div>

          {artikel.motivering && (
            <div style={{ fontSize: 16, color: "#777", lineHeight: 1.65, fontStyle: "italic" }}>
              {artikel.motivering.length > 150 ? artikel.motivering.slice(0, 150) + "…" : artikel.motivering}
            </div>
          )}

          {tags.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: "auto" }}>
              {tags.map(tag => (
                <span key={tag} style={{ fontSize: 12, color: "#555", border: "1px solid #2a2a2a", padding: "4px 12px", borderRadius: 20, fontFamily: "monospace" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, flexShrink: 0, width: 180 }}>
          <img
            src={avatarUrl}
            width={160} height={160}
            style={{ borderRadius: "50%", border: "3px solid #2a2a2a", objectFit: "cover" }}
          />
          <span style={{ fontSize: 13, color: "#c8b89a", fontFamily: "monospace", textAlign: "center" }}>
            {artikel.forfattare}
          </span>
        </div>
      </div>

      {/* Bottom URL */}
      <div style={{ marginTop: 28, display: "flex" }}>
        <span style={{ fontSize: 12, color: "#333", fontFamily: "monospace" }}>
          {BASE_URL}/artikel/{params.id}
        </span>
      </div>
    </div>,
    { ...size }
  );
}
