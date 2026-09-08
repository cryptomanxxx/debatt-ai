export const dynamic = "force-dynamic";

export const metadata = {
  title: "Status – DEBATT-AI",
  description: "Invariant-checkaren: automatiska kontroller av att plattformen faktiskt beter sig som den ska.",
};

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const C = {
  bg: "#0a0a0a", surface: "#0a0a0f", border: "#1a1a1a",
  text: "#c8c8c2", textMuted: "#666", accent: "#4a9eff",
  ok: "#4ade80", fail: "#f87171", error: "#fbbf24",
};

const STATUS_META = {
  ok: { ikon: "✓", farg: C.ok, label: "OK" },
  fail: { ikon: "✗", farg: C.fail, label: "FAIL" },
  error: { ikon: "?", farg: C.error, label: "ERROR" },
};

async function hamtaRader() {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/invariant_checks?select=kord_at,check_namn,status,detalj,skapad&order=kord_at.desc&limit=400`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }, cache: "no-store" }
    );
    return res.ok ? res.json() : [];
  } catch { return []; }
}

function relativTid(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 2) return "just nu";
  if (min < 60) return `${min} min sedan`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} tim sedan`;
  const d = Math.floor(h / 24);
  return `${d} dagar sedan`;
}

export default async function StatusPage() {
  const rader = await hamtaRader();

  const kordAtLista = [...new Set(rader.map(r => r.kord_at))].sort((a, b) => new Date(b) - new Date(a));
  const senasteKordAt = kordAtLista[0] || null;
  const senasteChecks = senasteKordAt ? rader.filter(r => r.kord_at === senasteKordAt) : [];

  const historik = kordAtLista.slice(0, 20).map(kordAt => {
    const checks = rader.filter(r => r.kord_at === kordAt);
    const fail = checks.filter(c => c.status === "fail").length;
    const error = checks.filter(c => c.status === "error").length;
    return { kordAt, total: checks.length, fail, error };
  });

  const allaGrona = senasteChecks.length > 0 && senasteChecks.every(c => c.status === "ok");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Georgia, serif" }}>
      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "40px 20px" }}>
        <p style={{ fontSize: "11px", color: C.accent, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px", fontFamily: "monospace" }}>
          Systemstatus
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: 400, margin: "0 0 12px", lineHeight: 1.25, color: "#f0ede6" }}>
          Invariant-checkaren
        </h1>
        <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: 1.7, margin: "0 0 28px" }}>
          Automatiska kontroller som körs var 3:e timme och verifierar konkreta, tidigare buggfixade
          beteenden — inte "ser hemsidan bra ut" utan "gör den faktiskt det den ska". Varje ny bugg
          som hittas blir en ny permanent check här.
        </p>

        {senasteKordAt ? (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px",
            padding: "14px 18px", background: C.surface, border: `1px solid ${allaGrona ? C.ok + "44" : C.fail + "44"}`,
            borderRadius: "8px",
          }}>
            <span style={{ fontSize: "20px" }}>{allaGrona ? "✅" : "⚠️"}</span>
            <div>
              <div style={{ fontSize: "14px", color: allaGrona ? C.ok : C.fail, fontWeight: 600 }}>
                {allaGrona ? "Alla checkar gröna" : `${senasteChecks.filter(c => c.status !== "ok").length} av ${senasteChecks.length} checkar visar problem`}
              </div>
              <div style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace" }}>
                Senaste körning: {relativTid(senasteKordAt)}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: C.textMuted, fontSize: "13px" }}>Inga körningar ännu.</p>
        )}

        {senasteChecks.length > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", overflow: "hidden", marginBottom: "28px" }}>
            {senasteChecks
              .sort((a, b) => (a.status === b.status ? 0 : a.status === "ok" ? 1 : -1))
              .map((c, i) => {
                const meta = STATUS_META[c.status] || STATUS_META.error;
                return (
                  <div key={c.check_namn + i} style={{
                    display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 18px",
                    borderBottom: i < senasteChecks.length - 1 ? `1px solid ${C.border}` : "none",
                  }}>
                    <span style={{ fontSize: "13px", color: meta.farg, fontFamily: "monospace", fontWeight: 700, flexShrink: 0, width: "50px" }}>
                      {meta.ikon} {meta.label}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", color: "#e8e5de", fontFamily: "monospace" }}>{c.check_namn}</div>
                      {c.detalj && (
                        <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "2px", lineHeight: 1.5 }}>{c.detalj}</div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {historik.length > 1 && (
          <>
            <p style={{ fontSize: "11px", color: C.textMuted, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>
              Historik
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {historik.map(h => (
                <div key={h.kordAt} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", fontFamily: "monospace", color: C.textMuted }}>
                  <span style={{ color: h.fail + h.error > 0 ? C.fail : C.ok }}>{h.fail + h.error > 0 ? "✗" : "✓"}</span>
                  <span>{relativTid(h.kordAt)}</span>
                  <span>—</span>
                  <span>{h.total - h.fail - h.error}/{h.total} ok{h.fail > 0 ? `, ${h.fail} fail` : ""}{h.error > 0 ? `, ${h.error} error` : ""}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
