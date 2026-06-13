import { NextResponse } from "next/server";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

function sbHeaders() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

function sbWriteHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export async function POST() {
  const h = sbHeaders();

  // 1. Hämta riksdagsförslag som saknar utfall — nyast först så senaste session bearbetas varje körning
  const pendingRes = await fetch(
    `${SB_URL}/rest/v1/lagforslag?kalla=eq.riksdagen&riksdagen_utfall=is.null&select=id,riksdagen_id,riksdagen_url&order=skapad.desc`,
    { headers: h }
  );
  if (!pendingRes.ok) {
    return NextResponse.json({ error: "Kunde inte hämta väntande förslag" }, { status: 502 });
  }
  const pendingRows = await pendingRes.json();
  const pending = {};
  for (const row of pendingRows) {
    if (row.riksdagen_id) pending[row.riksdagen_id] = { id: row.id, url: row.riksdagen_url || "" };
  }

  if (Object.keys(pending).length === 0) {
    return NextResponse.json({ uppdaterade: 0, meddelande: "Inga väntande förslag" });
  }

  let uppdaterade = 0;
  const fel = [];

  // 2. Bulk-sökning i senaste voteringar (täcker nyligen röstade betänkanden)
  try {
    const bulkRes = await fetch(
      "https://data.riksdagen.se/voteringlista/?utformat=json&sz=200&sort=datum&sortorder=desc",
      { headers: { "User-Agent": "debatt-ai.se/1.0" }, signal: AbortSignal.timeout(15000) }
    );
    if (bulkRes.ok) {
      const data = await bulkRes.json();
      let voteringar = data?.voteringlista?.votering || [];
      if (!Array.isArray(voteringar)) voteringar = [voteringar];

      for (const v of voteringar) {
        const dokId = (v.tillhor_dok_id || "").trim();
        if (!dokId || !(dokId in pending)) continue;

        const utfallRaw = (v.utfall || "").trim();
        const riksdagenUtfall = utfallRaw === "Ja" ? "bifall" : utfallRaw === "Nej" ? "avslag" : null;
        if (!riksdagenUtfall) continue;

        const datum = (v.datum || "").trim() || null;
        const lagforslagId = pending[dokId].id;

        const patchRes = await fetch(
          `${SB_URL}/rest/v1/lagforslag?id=eq.${lagforslagId}`,
          {
            method: "PATCH",
            headers: { ...sbWriteHeaders(), Prefer: "return=minimal" },
            body: JSON.stringify({ riksdagen_utfall: riksdagenUtfall, riksdagen_utfall_datum: datum, status: "avgjort" }),
          }
        );
        if (patchRes.ok) {
          uppdaterade++;
          delete pending[dokId];
        }
      }
    }
  } catch (e) {
    fel.push(`bulk: ${e.message}`);
  }

  // 3+4. Parallell batch (max 50) — voteringlista per dok, sedan dokumentstatus-fallback.
  //      Parallell = ~20s totalt oavsett antal, undviker Vercel-timeout.
  //      Batch 50 (ej 100) för att undvika rate-limiting mot riksdagen.se.
  const debugA = [];
  const debugB = [];
  const batch = Object.entries(pending).slice(0, 50);

  await Promise.allSettled(batch.map(async ([dokId, { id: lagforslagId, url: lagforslagUrl }]) => {
    // Steg A: voteringlista per dokument
    // bet2024/25:FiU20 → rm=2024/25&bet=FiU20&sz=1 (specifik sessionssökning, snabbare)
    // Gamla HC01xxx → generisk dokid-sökning
    try {
      let perRes;
      const betMatch = dokId.match(/^bet(\d{4}\/\d{2}):(.+)$/i);
      if (betMatch) {
        const rm = betMatch[1];   // "2024/25"
        const bet = betMatch[2];  // "FiU20"
        perRes = await fetch(
          `https://data.riksdagen.se/voteringlista/?rm=${encodeURIComponent(rm)}&bet=${encodeURIComponent(bet)}&utformat=json&sz=1`,
          { headers: { "User-Agent": "debatt-ai.se/1.0" }, signal: AbortSignal.timeout(20000) }
        );
      } else {
        perRes = await fetch(
          `https://data.riksdagen.se/voteringlista/?dokid=${dokId}&utformat=json&sz=10`,
          { headers: { "User-Agent": "debatt-ai.se/1.0" }, signal: AbortSignal.timeout(20000) }
        );
      }
      if (perRes.ok) {
        const perData = await perRes.json();
        let voteringar = perData?.voteringlista?.votering || [];
        if (!Array.isArray(voteringar)) voteringar = [voteringar];
        if (voteringar.length > 0) {
          const v = voteringar[0];
          const utfallRaw = (v.utfall || "").trim();
          const riksdagenUtfall = utfallRaw === "Ja" ? "bifall" : utfallRaw === "Nej" ? "avslag" : null;
          if (riksdagenUtfall) {
            const datum = (v.datum || "").trim() || null;
            const pr = await fetch(
              `${SB_URL}/rest/v1/lagforslag?id=eq.${lagforslagId}`,
              {
                method: "PATCH",
                headers: { ...sbWriteHeaders(), Prefer: "return=minimal" },
                body: JSON.stringify({ riksdagen_utfall: riksdagenUtfall, riksdagen_utfall_datum: datum, status: "avgjort" }),
              }
            );
            if (pr.ok) { uppdaterade++; delete pending[dokId]; return; }
          }
        }
      }
    } catch (e) {
      if (debugA.length < 3) debugA.push({ dokId, error: e.message });
    }

    // Steg B: dokumentstatus-fallback (acklamationsbeslut + propositioner)
    try {
      // Riksdagen-konvention: literal slash i path, t.ex. /dokumentstatus/bet2024/25:FiU20.json
      let dsRes = await fetch(
        `https://data.riksdagen.se/dokumentstatus/${dokId}.json`,
        { headers: { "User-Agent": "debatt-ai.se/1.0" }, signal: AbortSignal.timeout(20000) }
      );
      if (!dsRes.ok) {
        dsRes = await fetch(
          `https://data.riksdagen.se/dokumentstatus/${encodeURIComponent(dokId)}.json`,
          { headers: { "User-Agent": "debatt-ai.se/1.0" }, signal: AbortSignal.timeout(20000) }
        );
      }
      if (!dsRes.ok) {
        if (debugB.length < 3) debugB.push({ dokId, http: dsRes.status });
        return;
      }
      const ds = await dsRes.json();

      const dokStatus = (ds?.dokumentstatus?.dokument?.status || "").toLowerCase();
      const rawBeslut = ds?.dokumentstatus?.dokbeslut;
      const beslutObj = Array.isArray(rawBeslut) ? rawBeslut[0] : rawBeslut;
      const beslutText = (beslutObj?.beslut || "").toLowerCase();
      const datum = (ds?.dokumentstatus?.dokument?.datum || "").trim() || null;

      if (debugB.length < 3) debugB.push({ dokId, dokStatus, beslutText: beslutText.slice(0, 100) });

      if (!["avslutad", "beslutat", "slutbehandlad"].some(s => dokStatus.includes(s)) && !beslutText) return;

      const harBifall = /bifall|biföll|godkänn|antog|antagen|tillstyrk/.test(beslutText);
      // Targeted avslag — fångar "om avslag" (biföll utskottets förslag OM AVSLAG) och
      // explicita avslag på förslaget, men INTE "avslag på motionerna" i blandade beslut.
      // "Bifall till propositionen. Avslag på motionerna." → harAvslag=false → bifall ✓
      // "biföll utskottets förslag om avslag" → harAvslag=true → avslag ✓
      const harAvslag = /om avslag|avslår propositionen|avslog propositionen|avvisad|avstyrk/.test(beslutText);

      let riksdagenUtfall = null;
      if (harAvslag) {
        riksdagenUtfall = "avslag";
      } else if (harBifall) {
        riksdagenUtfall = "bifall";
      } else if (
        (dokStatus.includes("avslutad") || dokStatus.includes("beslutat") || dokStatus.includes("slutbehandlad")) &&
        beslutText === "" && (lagforslagUrl.includes("/proposition/") || lagforslagUrl.includes("/betankande/"))
      ) {
        riksdagenUtfall = "bifall";
      }

      if (!riksdagenUtfall) return;

      const pr = await fetch(
        `${SB_URL}/rest/v1/lagforslag?id=eq.${lagforslagId}`,
        {
          method: "PATCH",
          headers: { ...sbWriteHeaders(), Prefer: "return=minimal" },
          body: JSON.stringify({ riksdagen_utfall: riksdagenUtfall, riksdagen_utfall_datum: datum, status: "avgjort" }),
        }
      );
      if (pr.ok) { uppdaterade++; delete pending[dokId]; }
    } catch (e) {
      if (debugB.length < 3) debugB.push({ dokId, error: e.message });
    }
  }));

  return NextResponse.json({
    uppdaterade,
    vantande: Object.keys(pending).length,
    fel: fel.length > 0 ? fel : undefined,
    debug: { stepA: debugA, stepB: debugB },
  });
}
