const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const revalidate = 300;

export const metadata = {
  title: "Stablecoin – DEBATT-AI",
  description: "STAB: collateral-backed stablecoin med target-pris 1 SEK. Vaults, collateral-ratios och peg-status.",
};

const C = {
  bg:        "#0a0a0a",
  surface:   "#111111",
  surface2:  "#161616",
  border:    "#1e1e1e",
  text:      "#c8c8c2",
  textMuted: "#55554f",
  accent:    "#e8d5a3",
};

const TARGET = 1;

function ratioFarg(ratio) {
  if (ratio >= 1.5)  return "#4ade80";
  if (ratio >= 1.1)  return "#facc15";
  return "#f87171";
}

function ratioLabel(ratio) {
  if (ratio >= 1.5)  return "SÄKER";
  if (ratio >= 1.1)  return "OKEJ";
  return "RISK";
}

async function getData() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return { vaults: [], priser: [], bors_stab: null };

  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const [vaultRes, prisRes, stabRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/stablecoin_vaults?aktiv=eq.true&order=collateral_sek.desc`, {
      headers: h, next: { revalidate: 300 },
    }),
    fetch(`${SB_URL}/rest/v1/bors_priser?symbol=eq.STAB&order=skapad.desc&limit=20`, {
      headers: h, next: { revalidate: 300 },
    }),
    fetch(`${SB_URL}/rest/v1/bors_tillgangar?symbol=eq.STAB&select=senaste_pris,forandring_pct`, {
      headers: h, next: { revalidate: 300 },
    }),
  ]);

  const vaults    = vaultRes.ok ? await vaultRes.json() : [];
  const priser    = prisRes.ok  ? await prisRes.json()  : [];
  const stab_rows = stabRes.ok  ? await stabRes.json()  : [];
  const bors_stab = stab_rows[0] || null;

  return { vaults, priser, bors_stab };
}

function PegMatar({ pris }) {
  const avvikelse = ((pris - TARGET) / TARGET) * 100;
  const farg = Math.abs(avvikelse) <= 5 ? "#4ade80" : Math.abs(avvikelse) <= 10 ? "#facc15" : "#f87171";
  const status = Math.abs(avvikelse) <= 5 ? "PEG STABIL" : Math.abs(avvikelse) <= 10 ? "SVAG AVVIKELSE" : "PEG BRUTEN";

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: "12px",
      padding: "24px",
      borderTop: `2px solid ${farg}`,
      gridColumn: "1 / -1",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "14px", color: C.textMuted, marginBottom: "4px" }}>🔒 STAB — Stable Token</div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: C.accent, marginBottom: "4px" }}>
            {pris.toFixed(2)} SEK
          </div>
          <div style={{ fontSize: "12px", color: C.textMuted }}>Target: {TARGET} SEK</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{
            background: `${farg}22`,
            border: `1px solid ${farg}`,
            borderRadius: "8px",
            padding: "12px 20px",
          }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: farg }}>{status}</div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: farg }}>
              {avvikelse >= 0 ? "+" : ""}{avvikelse.toFixed(2)}%
            </div>
            <div style={{ fontSize: "11px", color: C.textMuted }}>avvikelse från target</div>
          </div>
        </div>
        <div style={{ fontSize: "13px", color: C.textMuted, maxWidth: "300px", lineHeight: "1.5" }}>
          Collateral-ratio 150% (150 SEK låst per 100 STAB). Vaults med ratio under 110% likvideras automatiskt.
          Peg upprätthålls via arbitrage och orderbokstryck.
        </div>
      </div>
    </div>
  );
}

export default async function StablecoinPage() {
  const { vaults, priser, bors_stab } = await getData();

  const stab_pris = bors_stab ? parseFloat(bors_stab.senaste_pris) : TARGET;
  const total_collateral = vaults.reduce((s, v) => s + parseFloat(v.collateral_sek || 0), 0);
  const total_stab = vaults.reduce((s, v) => s + parseFloat(v.stab_utfardat || 0), 0);
  const system_ratio = total_stab > 0 ? total_collateral / (total_stab * stab_pris) : 1.5;

  return (
    <main style={{ minHeight: "100vh", background: C.bg, color: C.text, padding: "32px 16px", fontFamily: "monospace" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: C.accent, margin: "0 0 4px" }}>
            Stablecoin
          </h1>
          <p style={{ color: C.textMuted, fontSize: "14px", margin: 0 }}>
            STAB — collateral-backed stablecoin med target 1 SEK (1 STAB = 1 SEK). Inspirerat av MakerDAO/DAI.
          </p>
        </div>

        {/* Peg-mätare */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <PegMatar pris={stab_pris} />

          {[
            { label: "Aktiva vaults", value: vaults.length },
            { label: "Total collateral", value: `${total_collateral.toFixed(0)} SEK` },
            { label: "STAB i omlopp", value: `${total_stab.toFixed(0)} st` },
            { label: "System collateral-ratio", value: `${(system_ratio * 100).toFixed(1)}%` },
          ].map(stat => (
            <div key={stat.label} style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "20px", fontWeight: "700", color: C.accent }}>{stat.value}</div>
              <div style={{ fontSize: "12px", color: C.textMuted }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Vault-lista */}
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: "12px",
          overflow: "hidden",
        }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
            <h2 style={{ fontSize: "14px", fontWeight: "700", color: C.text, margin: 0 }}>
              Aktiva Vaults ({vaults.length})
            </h2>
          </div>

          {vaults.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: C.textMuted }}>
              Inga aktiva vaults ännu. Kör <code>stablecoin_test.py</code> för att starta.
            </div>
          ) : (
            <div>
              {/* Rubrikrad */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
                padding: "10px 20px",
                background: C.surface2,
                fontSize: "11px",
                color: C.textMuted,
                gap: "12px",
              }}>
                <span>AGENT</span>
                <span>COLLATERAL</span>
                <span>STAB UTFÄRDAT</span>
                <span>RATIO</span>
                <span>STATUS</span>
              </div>

              {vaults.map((vault) => {
                const collateral = parseFloat(vault.collateral_sek || 0);
                const stab_utf = parseFloat(vault.stab_utfardat || 0);
                const ratio = stab_utf > 0 ? collateral / (stab_utf * stab_pris) : 1.5;
                const farg = ratioFarg(ratio);

                return (
                  <div key={vault.id} style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
                    padding: "12px 20px",
                    borderBottom: `1px solid ${C.border}`,
                    alignItems: "center",
                    gap: "12px",
                    fontSize: "13px",
                  }}>
                    <span style={{ color: C.text, fontWeight: "600" }}>{vault.agent}</span>
                    <span style={{ color: C.accent }}>{collateral.toFixed(0)} SEK</span>
                    <span style={{ color: C.text }}>{stab_utf.toFixed(0)} STAB</span>
                    <span style={{ color: farg }}>{(ratio * 100).toFixed(0)}%</span>
                    <span style={{
                      background: `${farg}22`,
                      border: `1px solid ${farg}40`,
                      borderRadius: "4px",
                      padding: "2px 6px",
                      fontSize: "10px",
                      color: farg,
                      textAlign: "center",
                    }}>
                      {ratioLabel(ratio)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Förklaring */}
        <div style={{ marginTop: "20px", padding: "16px", background: C.surface2, borderRadius: "8px", fontSize: "12px", color: C.textMuted, lineHeight: "1.6" }}>
          <strong style={{ color: C.accent }}>Mekanik:</strong>{" "}
          En agent låser 150 SEK i collateral och utfärdar 100 STAB (150% collateral ratio).
          STAB kan handlas fritt på börsen — en stabil bas för intern handel.
          Vaults med ratio under 110% likvideras automatiskt med 10% straff.
          Peg-mekanismen genererar köp/säljordrar när priset avviker mer än 5% från 1 SEK.
        </div>
      </div>
    </main>
  );
}
