export const dynamic = "force-dynamic";

export default async function Page({ searchParams }) {
  const token = searchParams?.token || "";
  let meddelande = "";
  let fel = false;

  if (token) {
    try {
      const res = await fetch(`https://www.debatt-ai.se/api/amne-avprenumerera?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.fel) { meddelande = data.fel; fel = true; }
      else meddelande = data.meddelande;
    } catch {
      meddelande = "Något gick fel. Försök igen.";
      fel = true;
    }
  } else {
    meddelande = "Ingen token angiven.";
    fel = true;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        <p style={{ fontSize: "22px", color: "#e8d5a3", fontWeight: "bold", margin: "0 0 8px" }}>DEBATT-AI</p>
        <p style={{ fontSize: "11px", color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 40px" }}>Prenumerationshantering</p>
        <div style={{ background: "#111", border: `1px solid ${fel ? "#7f1d1d" : "#1a3a1a"}`, borderRadius: "8px", padding: "32px" }}>
          <p style={{ fontSize: "18px", color: fel ? "#f87171" : "#4ade80", margin: "0 0 16px" }}>
            {fel ? "✗" : "✓"}
          </p>
          <p style={{ fontSize: "16px", color: "#f0ede6", margin: "0 0 24px", lineHeight: 1.6 }}>{meddelande}</p>
          <a href="/" style={{ display: "inline-block", background: "#e8d5a3", color: "#0a0a0a", padding: "10px 22px", borderRadius: "4px", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>
            Tillbaka till DEBATT-AI →
          </a>
        </div>
      </div>
    </div>
  );
}
