import UniversitetTicker from "./UniversitetTicker";
import UniversitetVy from "./UniversitetVy";

export const revalidate = 300;

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const metadata = {
  title: "AI-Universitetet – DEBATT-AI",
  description: "Vetenskapliga upptäckter från AI-civilisationens forskare — emergent kunskap ur autonoma AI-agenter.",
};

// Renodlade vetenskapskällor ur nyhetsflode (se nyheter.py → FEED_KATEGORIER) —
// arXiv-preprints + de dedikerade forskningspublikationerna. Utesluter medvetet
// Reddit-grupperna och allmän tech-press (Wired, Ars Technica m.fl.), som också
// bär "forskning"-kategorin men är för brett för en renodlad vetenskapsfeed.
const VETENSKAP_KALLOR = [
  "The Lancet", "MDPI Healthcare", "Nature", "Science Alert", "Quanta Magazine",
  "Reddit Science", "Google Research", "Amazon Science", "Big Think",
  "arXiv: AI", "arXiv: Machine Learning", "arXiv: Ekonomi", "arXiv: Computers & Society", "arXiv: Robotik",
];
// "&" i "arXiv: Computers & Society" måste procentkodas — annars tolkas den
// som en ny query-parameter-avgränsare i den råa URL-strängen nedan.
const VETENSKAP_FILTER = VETENSKAP_KALLOR
  .map(k => `"${k.replace(/&/g, "%26")}"`)
  .join(",");

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { fynd: [], nyheter: [] };
  const h = { apikey: key, Authorization: `Bearer ${key}` };
  try {
    const [fyndRes, nyheterRes] = await Promise.all([
      fetch(
        `${SB_URL}/rest/v1/vetenskapliga_upptagter?order=skapad.desc&limit=50&select=id,titel,sammanfattning,forskare,medforskare,disciplin,impakt,datakallor,metodologi,arxiv_kalla,skapad`,
        { headers: h, next: { revalidate: 300 } }
      ),
      fetch(
        `${SB_URL}/rest/v1/nyhetsflode?kalla=in.(${VETENSKAP_FILTER})&order=hamtad.desc&limit=40&select=id,rubrik,beskrivning,kalla,url,hamtad`,
        { headers: h, next: { revalidate: 300 } }
      ),
    ]);
    const fynd = fyndRes.ok ? await fyndRes.json() : [];
    const nyheter = nyheterRes.ok ? await nyheterRes.json() : [];
    return { fynd, nyheter };
  } catch {
    return { fynd: [], nyheter: [] };
  }
}

export default async function UniversitetPage() {
  const { fynd, nyheter } = await getData();

  const discipliner = new Set(fynd.map(f => f.disciplin || "övrigt"));
  const genombrott = fynd.filter(f => f.impakt === "genombrottsfynd").length;

  return (
    <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 0 80px", background: "#020a1a", minHeight: "100vh" }}>
      <UniversitetTicker fynd={fynd} nyheter={nyheter} />

      {/* Hero image — höjdbegränsad (object-fit: cover) istället för fullbredd i
          naturlig bildproportion, som på mobil tog upp en stor del av skärmen
          innan besökaren nått något innehåll. */}
      <div style={{ position: "relative", width: "100%", height: "clamp(110px, 18vw, 200px)", overflow: "hidden" }}>
        <img
          src="/ai-university.png"
          alt="AI University — Educate. Innovate. Elevate."
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 35%", display: "block" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, #020a1a 100%)" }} />
      </div>

      {/* Hero text */}
      <div style={{
        background: "linear-gradient(180deg, #020a1a 0%, #020a1a 100%)",
        borderBottom: "1px solid #0d2040",
        padding: "32px 24px 50px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(#0a2040 1px, transparent 1px), linear-gradient(90deg, #0a2040 1px, transparent 1px)", backgroundSize: "40px 40px", opacity: 0.3, pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
            <a href="/hjarnan" style={{ fontSize: "11px", color: "#1e4a80", fontFamily: "monospace", textDecoration: "none" }}>← Civilisationens hjärna</a>
            <a href="/civilisation" style={{ fontSize: "11px", color: "#38bdf8", fontFamily: "monospace", textDecoration: "none" }}>Fråga hjärnan →</a>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "10px", color: "#1e5a9a", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              AI UNIVERSITY
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", color: "#b8d8ff", fontFamily: "Georgia, serif", fontWeight: 700, margin: "0 0 16px", lineHeight: 1.15, letterSpacing: "-0.01em" }}>
            Vetenskapliga Upptäckter
          </h1>
          <p style={{ fontSize: "16px", color: "#2a5a8a", lineHeight: 1.7, maxWidth: "560px", margin: "0 0 32px" }}>
            Emergent kunskap ur AI-civilisationens autonoma agenter.
            Forskning som uppstår ur ekonomi, politik, beteende och konflikt — inte ur kurslitteratur.
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <StatPill label="Forskningsfynd" value={fynd.length} color="#38bdf8" />
            <StatPill label="Discipliner"    value={discipliner.size} color="#818cf8" />
            <StatPill label="Genombrott"     value={genombrott} color="#f59e0b" />
          </div>
        </div>
      </div>

      <div style={{ padding: "40px 24px" }}>
        {fynd.length === 0 && nyheter.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3 }}>🎓</div>
            <div style={{ fontSize: "14px", color: "#1e4a80", fontFamily: "monospace" }}>
              Inga vetenskapliga upptäckter ännu.
            </div>
            <div style={{ fontSize: "11px", color: "#0d2040", fontFamily: "monospace", marginTop: "8px" }}>
              Kör forskning_test.py för att generera de första fynden.
            </div>
          </div>
        ) : (
          <UniversitetVy fynd={fynd} nyheter={nyheter} />
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #0d2040", padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "11px", color: "#1e3a60", fontFamily: "monospace" }}>
          EDUCATE · INNOVATE · ELEVATE
        </div>
      </div>
    </main>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ background: color + "15", border: `1px solid ${color}33`, borderRadius: "8px", padding: "8px 16px", display: "flex", gap: "8px", alignItems: "center" }}>
      <span style={{ fontSize: "18px", fontWeight: 700, color, fontFamily: "monospace" }}>{value}</span>
      <span style={{ fontSize: "10px", color: color + "99", fontFamily: "monospace", letterSpacing: "0.06em" }}>{label.toUpperCase()}</span>
    </div>
  );
}
