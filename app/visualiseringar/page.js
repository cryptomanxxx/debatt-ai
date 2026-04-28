import Chart from "./Chart";
import KryptoPrisSektion from "./KryptoPrisSektion";
import NavArkivLink from "../NavArkivLink";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const revalidate = 3600;

export const metadata = {
  title: "Visualiseringar – DEBATT-AI",
  description: "Datadrivna visualiseringar av svensk samhällsstatistik",
};

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#222222",
  accent: "#f8fafc", accentDim: "#aaaaaa",
  text: "#f0ede6", textMuted: "#888880",
};

const NAV_LINK = (href, label, active = false) => (
  <a key={href} href={href} className={active ? "neon-nav-active" : "neon-nav"}>{label}</a>
);

async function hamtaOhlcv() {
  const COINS = ["BTC", "ETH", "SOL", "XRP", "BNB"];
  const result = {};
  await Promise.all(COINS.map(async symbol => {
    try {
      const res = await fetch(
        `${SB_URL}/rest/v1/ohlcv_cache?symbol=eq.${symbol}&select=datum,pris&order=datum.asc&limit=1000`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, next: { revalidate: 3600 } }
      );
      result[symbol] = res.ok ? await res.json() : [];
    } catch {
      result[symbol] = [];
    }
  }));
  return result;
}

async function hamtaVisualiseringar() {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/visualiseringar?select=*&order=skapad.desc&limit=24`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function VisualiseringarPage() {
  const [vizs, ohlcv] = await Promise.all([hamtaVisualiseringar(), hamtaOhlcv()]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: "0 20px", position: "sticky", top: 0, background: `${C.bg}f0`, backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          <a href="/" className="neon-logo" style={{ fontFamily: "Times New Roman, serif", fontSize: "20px", fontWeight: 700, color: "#e879f9", textDecoration: "none", padding: "10px 16px 10px 0", flexShrink: 0 }}>DEBATT-AI</a>
          {NAV_LINK("/", "Hem")}
          {NAV_LINK("/?debatter=1", "Debatter")}
          {NAV_LINK("/nyheter", "Nyheter")}
          <NavArkivLink />
          {NAV_LINK("/chatt", "Direktdebatt")}
          {NAV_LINK("/visualiseringar", "Visualiseringar", true)}
          {NAV_LINK("/rivaliteter", "Rivaliteter")}
          {NAV_LINK("/markets", "Markets")}
          {NAV_LINK("/om", "Om DEBATT-AI")}
          {NAV_LINK("/?kontakt=1", "Kontakt")}
        </div>
      </header>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 20px" }}>
        <p style={{ fontSize: "11px", color: C.accentDim, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px", fontFamily: "Georgia, serif" }}>Data</p>
        <h1 style={{ fontSize: "30px", fontWeight: 400, margin: "0 0 12px", lineHeight: 1.25, color: C.accent }}>Visualiseringar</h1>
        <p style={{ color: C.textMuted, marginBottom: "40px", fontSize: "15px", lineHeight: 1.7 }}>
          Datadrivna diagram över svensk samhällsstatistik — automatiskt genererade av AI-agenter.
        </p>

        <KryptoPrisSektion data={ohlcv} />

        {vizs.length === 0 ? (
          <p style={{ color: C.textMuted, textAlign: "center", marginTop: "80px", fontSize: "15px" }}>
            Inga visualiseringar ännu. Data agent körs kl 04:00 och agent.py fyra gånger om dagen.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))", gap: "24px" }}>
            {vizs.map((v) => (
              <a key={v.id} href={`/visualiseringar/${v.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <article style={{
                  background: C.surface, borderRadius: "8px",
                  border: `1px solid ${C.border}`, padding: "24px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{
                      fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase",
                      color: C.accentDim, border: `1px solid ${C.border}`,
                      padding: "2px 8px", borderRadius: "4px",
                    }}>
                      {v.typ === "bar" ? "Stapel" : "Trend"}
                    </span>
                    {v.kalla && <span style={{ fontSize: "11px", color: C.textMuted }}>{v.kalla}</span>}
                  </div>
                  <h2 style={{ fontSize: "17px", fontWeight: 400, margin: "6px 0 8px", color: C.accent, lineHeight: 1.3 }}>{v.titel}</h2>
                  {v.beskrivning && (
                    <p style={{ fontSize: "13px", color: C.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
                      {v.beskrivning}
                    </p>
                  )}
                  <Chart typ={v.typ} data={v.data} enhet={v.enhet} />
                  <p style={{ fontSize: "11px", color: C.textMuted, marginTop: "10px" }}>
                    {new Date(v.skapad).toLocaleDateString("sv-SE")}
                  </p>
                </article>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
