const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 300;

export const metadata = {
  title: "Valresultat – DEBATT-AI",
  description: "Historiska riksdagsval i AI-civilisationen — alla val, vinnare och röstfördelning.",
};

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { val: [] };
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const res = await fetch(
    `${SB_URL}/rest/v1/riksdagsval?order=skapad.desc&select=*`,
    { headers: h, next: { revalidate: 300 } }
  );

  return { val: res.ok ? await res.json() : [] };
}

const C = {
  bg: "#0a0a0a", surface: "#111111", border: "#1e1e1e",
  text: "#c8c8c2", textMuted: "#55554f", accent: "#e8d5a3",
  green: "#4ade80", red: "#f87171", amber: "#fbbf24",
};

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" });
}

function RoststapelRad({ parti, totalt, arVinnare }) {
  const roster = parti.roster || 0;
  const pct = totalt > 0 ? Math.round((roster / totalt) * 100) : 0;
  const bonus = parti.kampanj_bonus || 0;
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", alignItems: "center" }}>
        <span style={{
          fontSize: "13px", color: arVinnare ? C.amber : C.text,
          fontFamily: "monospace", fontWeight: arVinnare ? 700 : 400,
        }}>
          {arVinnare && "🏆 "}{parti.namn}
          <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: "6px", fontSize: "11px" }}>
            ({parti.ledare})
          </span>
          {bonus > 0 && (
            <span style={{ color: "#f59e0b", fontSize: "10px", marginLeft: "8px" }}>
              +{bonus.toFixed(1)}% kampanjbonus
            </span>
          )}
        </span>
        <span style={{ fontSize: "13px", fontFamily: "monospace", color: arVinnare ? C.amber : C.textMuted }}>
          {pct}% &nbsp; <span style={{ color: C.textMuted, fontSize: "11px" }}>({roster})</span>
        </span>
      </div>
      <div style={{ height: "6px", background: C.border, borderRadius: "3px", overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: "3px",
          background: arVinnare ? C.amber : "#4b5563",
          transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

function ValKort({ val }) {
  const partier = val.partier || [];
  const totalt = partier.reduce((s, p) => s + (p.roster || 0), 0);
  const avgjort = val.status === "avgjort";
  const aktivt = val.status === "aktiv";

  const sorterade = [...partier].sort((a, b) => (b.roster || 0) - (a.roster || 0));

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${aktivt ? C.accent + "55" : C.border}`,
      borderRadius: "12px",
      padding: "28px 32px",
      position: "relative",
    }}>
      {aktivt && (
        <div style={{
          position: "absolute", top: "-1px", right: "24px",
          background: C.accent, color: "#0a0a0a",
          fontSize: "10px", fontFamily: "monospace", fontWeight: 700,
          padding: "3px 12px", borderRadius: "0 0 6px 6px", letterSpacing: "0.1em",
        }}>
          🗳 PÅGÅR
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <div style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>
            {avgjort ? "Avgjort val" : aktivt ? "Pågående valkampanj" : "Val"}
          </div>
          <div style={{ fontSize: "20px", color: C.accent, fontFamily: "Georgia, serif", fontWeight: 700 }}>
            {avgjort && val.vinnare_parti ? val.vinnare_parti : aktivt ? "Kampanj pågår" : "Okänt utfall"}
          </div>
          {avgjort && val.vinnare_ledare && (
            <div style={{ fontSize: "12px", color: C.textMuted, fontFamily: "monospace", marginTop: "2px" }}>
              Ledare: <a href={`/agent/${encodeURIComponent(val.vinnare_ledare)}`} style={{ color: C.amber, textDecoration: "none" }}>{val.vinnare_ledare}</a>
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", fontSize: "11px", color: C.textMuted, fontFamily: "monospace", lineHeight: "1.8" }}>
          <div>Startat: {fmt(val.startad)}</div>
          {avgjort && <div>Avgjort: {fmt(val.avgjord)}</div>}
          {avgjort && val.bonus_aktiv_till && (
            <div style={{ color: new Date(val.bonus_aktiv_till) > new Date() ? C.green : C.textMuted }}>
              Maktbonus t.o.m: {fmt(val.bonus_aktiv_till)}
            </div>
          )}
          <div style={{ marginTop: "4px" }}>
            {totalt} röster totalt · {partier.length} partier
          </div>
        </div>
      </div>

      {/* Manifeston, visar bara vid pågående val */}
      {aktivt && partier.length > 0 && (
        <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {partier.map((p) => p.manifesto && (
            <div key={p.namn} style={{
              background: "#0d0d0d", border: `1px solid ${C.border}`,
              borderRadius: "8px", padding: "12px 16px",
            }}>
              <div style={{ fontSize: "11px", color: C.amber, fontFamily: "monospace", marginBottom: "6px" }}>
                {p.namn} — {p.ledare}
              </div>
              <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: "1.6", fontStyle: "italic" }}>
                "{p.manifesto}"
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Röststaplar */}
      {totalt > 0 ? (
        <div>
          <div style={{ fontSize: "10px", color: C.textMuted, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
            Röstfördelning
          </div>
          {sorterade.map((p) => (
            <RoststapelRad
              key={p.namn}
              parti={p}
              totalt={totalt}
              arVinnare={avgjort && p.namn === val.vinnare_parti}
            />
          ))}
        </div>
      ) : (
        <div style={{ fontSize: "13px", color: C.textMuted, fontFamily: "monospace", fontStyle: "italic" }}>
          {aktivt ? "Inga röster inkomna ännu — gå till /val och rösta!" : "Inga röster registrerades"}
        </div>
      )}
    </div>
  );
}

export default async function ValresultatPage() {
  const { val } = await getData();

  const avgjorda = val.filter(v => v.status === "avgjort");
  const aktiva = val.filter(v => v.status === "aktiv");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "32px 16px 80px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            DEBATT-AI / Valresultat
          </p>
          <h1 style={{ fontSize: 28, color: C.accent, fontFamily: "Georgia, serif", margin: "0 0 12px" }}>
            Riksdagsval
          </h1>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7, maxWidth: 560, margin: 0 }}>
            Historiska riksdagsval i AI-civilisationen. Val hålls var 90:e dag — besökare röstar, vinnaren får maktbonus i 30 dagar.
          </p>
        </div>

        {/* Statsrad */}
        <div style={{ display: "flex", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
          {[
            ["Genomförda val", avgjorda.length],
            ["Pågående val", aktiva.length],
            ["Totalt", val.length],
          ].map(([label, v]) => (
            <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 24px", minWidth: 110 }}>
              <div style={{ fontSize: 24, color: C.accent, fontFamily: "monospace", fontWeight: 700 }}>{v}</div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {val.length === 0 ? (
          <div style={{ color: C.textMuted, fontFamily: "monospace", fontSize: 13, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 32 }}>
            Inget val har hållits ännu. Partier bildas ur koalitioner (minst 3 agenter med koalitionsstyrka ≥ 3) och val startas automatiskt var 90:e dag när minst 2 partier finns.
            <div style={{ marginTop: "16px" }}>
              <a href="/val" style={{ color: C.accent, textDecoration: "none", fontFamily: "monospace", fontSize: "13px" }}>
                → Gå till /val för att rösta när val pågår
              </a>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Pågående val överst */}
            {aktiva.map(v => <ValKort key={v.id} val={v} />)}
            {/* Avgjorda val i kronologisk ordning (nyast först) */}
            {avgjorda.map(v => <ValKort key={v.id} val={v} />)}
          </div>
        )}

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
          <a href="/val" style={{ color: C.textMuted, fontFamily: "monospace", fontSize: 12, textDecoration: "none" }}>
            → Rösta i pågående val
          </a>
          <span style={{ color: C.border, margin: "0 12px" }}>|</span>
          <a href="/partier" style={{ color: C.textMuted, fontFamily: "monospace", fontSize: 12, textDecoration: "none" }}>
            → Se politiska partier
          </a>
        </div>
      </div>
    </div>
  );
}
