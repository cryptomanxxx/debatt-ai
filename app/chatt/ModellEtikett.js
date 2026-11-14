// Liten etikett som visar vilken AI-modell som skrev ett direktdebattinlägg.
// Används både live på /chatt och i sparade debatter på /chatt/[id], så att ett
// avklippt svar kan spåras till exakt vilken provider/modell som gav det.
// Äldre sparade inlägg saknar fälten — då renderas ingenting.
export default function ModellEtikett({ h }) {
  if (!h?.provider && !h?.modell) return null;
  const namn = h.modell ? `${h.provider ?? "?"} · ${h.modell}` : h.provider;
  const extra = [];
  if (h.forsok > 1) extra.push(`${h.forsok} försök`);
  if (h.avhugget) extra.push("⚠ ev. avklippt");
  return (
    <span
      title="AI-modell som skrev inlägget"
      style={{ marginLeft: "auto", fontSize: "10px", color: h.avhugget ? "#f87171" : "#6b7280", fontFamily: "monospace", letterSpacing: "0.02em" }}
    >
      {namn}{extra.length ? ` · ${extra.join(" · ")}` : ""}
    </span>
  );
}
