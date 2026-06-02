/**
 * GET /api/v1/policy/proposals
 * Listar lagförslag som har PIS-analys. Returnerar full analysdata så att
 * klienten kan visa resultaten direkt utan extra API-anrop.
 *
 * Query params:
 *   ?q=          — fritextsökning i titel
 *   ?kalla=      — "riksdagen" | "ai" | "api" | "alla" (default)
 *   ?limit=      — max antal resultat (default 80, max 200)
 */

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const H = () => ({ apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` });

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q     = (searchParams.get("q") || "").trim().toLowerCase();
  const kalla = searchParams.get("kalla") || "alla";
  const limit = Math.min(parseInt(searchParams.get("limit") || "80", 10), 200);

  // Hämta PIS-analyser + MC-status parallellt
  const [pisRes, mcRes] = await Promise.all([
    fetch(
      `${SB_URL}/rest/v1/pis_analyser` +
      `?select=lagforslag_id,bnp_effekt_pct,gini_effekt,inflation_delta,arbetsloshet_delta` +
      `,socialt_kapital_effekt,koalition_stabilitet,konfidens,analys,skapad` +
      `&order=skapad.desc&limit=${limit}`,
      { headers: H(), next: { revalidate: 60 } }
    ),
    fetch(
      `${SB_URL}/rest/v1/pis_monte_carlo` +
      `?select=lagforslag_id,iterationer,lyckade_iterationer` +
      `,bnp_mean,bnp_std,bnp_min,bnp_max,gini_mean,gini_std` +
      `,inflation_mean,inflation_std,arbetsloshet_mean,arbetsloshet_std` +
      `,socialt_kapital_dist,koalition_dist,konfidens_dist`,
      { headers: H(), next: { revalidate: 60 } }
    ),
  ]);

  const pisRows = pisRes.ok ? await pisRes.json() : [];
  const mcRows  = mcRes.ok  ? await mcRes.json()  : [];

  if (!pisRows.length) return Response.json({ proposals: [], total: 0 });

  // Hämta lagförslag-metadata för de hittade ID:na
  const ids = pisRows.map(r => r.lagforslag_id).join(",");
  const lfRes = await fetch(
    `${SB_URL}/rest/v1/lagforslag` +
    `?id=in.(${ids})` +
    `&select=id,titel,kalla,status,riksdagen_url,riksdagen_utfall,ai_ja_roster,ai_nej_roster,skapad`,
    { headers: H(), next: { revalidate: 60 } }
  );
  const lfRows = lfRes.ok ? await lfRes.json() : [];

  // Bygg lookup-maps
  const lfMap = {};
  for (const lf of lfRows) lfMap[lf.id] = lf;
  const mcMap = {};
  for (const mc of mcRows) mcMap[mc.lagforslag_id] = mc;

  // Slå ihop
  let proposals = pisRows.map(pis => {
    const lf = lfMap[pis.lagforslag_id] || {};
    const mc = mcMap[pis.lagforslag_id] || null;
    return {
      id:            pis.lagforslag_id,
      titel:         lf.titel         || "—",
      kalla:         lf.kalla         || "ai",
      status:        lf.status        || "omrostning",
      riksdagen_url: lf.riksdagen_url || null,
      riksdagen_utfall: lf.riksdagen_utfall || null,
      ai_ja_roster:  lf.ai_ja_roster  ?? 0,
      ai_nej_roster: lf.ai_nej_roster ?? 0,
      skapad:        lf.skapad        || pis.skapad,
      analys: {
        bnp_effekt_pct:         pis.bnp_effekt_pct,
        gini_effekt:            pis.gini_effekt,
        inflation_delta:        pis.inflation_delta,
        arbetsloshet_delta:     pis.arbetsloshet_delta,
        socialt_kapital_effekt: pis.socialt_kapital_effekt,
        koalition_stabilitet:   pis.koalition_stabilitet,
        konfidens:              pis.konfidens,
        analys:                 pis.analys,
      },
      monte_carlo: mc ? {
        iterationer:         mc.iterationer,
        lyckade_iterationer: mc.lyckade_iterationer,
        bnp:          mc.bnp_mean         !== null ? { mean: mc.bnp_mean,         std: mc.bnp_std,         min: mc.bnp_min,         max: mc.bnp_max         } : null,
        gini:         mc.gini_mean        !== null ? { mean: mc.gini_mean,        std: mc.gini_std        } : null,
        inflation:    mc.inflation_mean   !== null ? { mean: mc.inflation_mean,   std: mc.inflation_std   } : null,
        arbetsloshet: mc.arbetsloshet_mean !== null ? { mean: mc.arbetsloshet_mean, std: mc.arbetsloshet_std } : null,
        socialt_kapital_dist: mc.socialt_kapital_dist,
        koalition_dist:       mc.koalition_dist,
        konfidens_dist:       mc.konfidens_dist,
      } : null,
    };
  });

  // Filtrera
  if (kalla && kalla !== "alla") {
    proposals = proposals.filter(p => p.kalla === kalla);
  }
  if (q) {
    proposals = proposals.filter(p => p.titel.toLowerCase().includes(q));
  }

  return Response.json({ proposals, total: proposals.length });
}
