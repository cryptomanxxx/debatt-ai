import { NextResponse } from "next/server";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

function sbHeaders() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

// Service role key för PATCH — anon-nyckeln kan ha blockerade UPDATE-rättigheter via RLS
function sbWriteHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

// Hämtar voteringsresultat från riksdagen.se och sätter riksdagen_utfall automatiskt.
// Körs från Vercel (inte GitHub Actions) så att data.riksdagen.se inte blockerar anropet.
export async function POST() {
  const h = sbHeaders();

  // 1. Hämta våra riksdagsförslag som saknar utfall
  const pendingRes = await fetch(
    `${SB_URL}/rest/v1/lagforslag?kalla=eq.riksdagen&riksdagen_utfall=is.null&select=id,riksdagen_id,riksdagen_url`,
    { headers: h }
  );
  if (!pendingRes.ok) {
    return NextResponse.json({ error: "Kunde inte hämta väntande förslag" }, { status: 502 });
  }
  const pendingRows = await pendingRes.json();
  // pending: dok_id → { id, url } — url behövs för att skilja propositioner från motioner
  const pending = {};
  for (const row of pendingRows) {
    if (row.riksdagen_id) pending[row.riksdagen_id] = { id: row.id, url: row.riksdagen_url || "" };
  }

  if (Object.keys(pending).length === 0) {
    return NextResponse.json({ uppdaterade: 0, meddelande: "Inga väntande förslag" });
  }

  let uppdaterade = 0;
  const fel = [];

  // 2. Bulk-sökning i senaste 200 voteringar (täcker betänkande-baserade)
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

  // 3. Per-dokument-anrop för kvarvarande
  for (const [dokId, { id: lagforslagId }] of Object.entries(pending)) {
    try {
      const perRes = await fetch(
        `https://data.riksdagen.se/voteringlista/?dokid=${dokId}&utformat=json&sz=10`,
        { headers: { "User-Agent": "debatt-ai.se/1.0" }, signal: AbortSignal.timeout(10000) }
      );
      if (!perRes.ok) continue;

      const perData = await perRes.json();
      let perVoteringar = perData?.voteringlista?.votering || [];
      if (!Array.isArray(perVoteringar)) perVoteringar = [perVoteringar];
      if (perVoteringar.length === 0) continue;

      const v = perVoteringar[0];
      const utfallRaw = (v.utfall || "").trim();
      const riksdagenUtfall = utfallRaw === "Ja" ? "bifall" : utfallRaw === "Nej" ? "avslag" : null;
      if (!riksdagenUtfall) continue;

      const datum = (v.datum || "").trim() || null;
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
    } catch (e) {
      fel.push(`${dokId}: ${e.message}`);
    }
  }

  // 4. Dokumentstatus-fallback: motioner röstades på via betänkande (annan dok_id).
  //    dokumentstatus/{id}.json har dokbeslut.beslut med texten "bifall"/"avslag" direkt.
  const remainingEntries = Object.entries(pending);
  const dokstatusChunk = remainingEntries.slice(0, 30); // max 30 per körning

  const debugSample = [];

  await Promise.allSettled(dokstatusChunk.map(async ([dokId, { id: lagforslagId, url: lagforslagUrl }]) => {
    try {
      // Försök med literal slash i path (riksdagen-konvention), fallback till encodeURIComponent
      let dsRes = await fetch(
        `https://data.riksdagen.se/dokumentstatus/${dokId}.json`,
        { headers: { "User-Agent": "debatt-ai.se/1.0" }, signal: AbortSignal.timeout(8000) }
      );
      if (!dsRes.ok) {
        dsRes = await fetch(
          `https://data.riksdagen.se/dokumentstatus/${encodeURIComponent(dokId)}.json`,
          { headers: { "User-Agent": "debatt-ai.se/1.0" }, signal: AbortSignal.timeout(8000) }
        );
      }
      if (!dsRes.ok) {
        if (debugSample.length < 3) debugSample.push({ dokId, http: dsRes.status });
        return;
      }
      const ds = await dsRes.json();

      // Extrahera besluttext — kan vara objekt eller array
      const dokStatus = (ds?.dokumentstatus?.dokument?.status || "").toLowerCase();
      const rawBeslut = ds?.dokumentstatus?.dokbeslut;
      const beslutObj = Array.isArray(rawBeslut) ? rawBeslut[0] : rawBeslut;
      const beslutText = (beslutObj?.beslut || "").toLowerCase();
      const datum = (ds?.dokumentstatus?.dokument?.datum || "").trim() || null;

      if (debugSample.length < 3) debugSample.push({ dokId, dokStatus, beslutText: beslutText.slice(0, 80) });

      // Avgör om avslutad
      if (!["avslutad", "beslutat", "slutbehandlad"].some(s => dokStatus.includes(s)) && !beslutText) return;

      // Avslag tar alltid prioritet — "biföll utskottets förslag om avslag" är avslag
      const harBifall = /bifall|biföll|godkänn|antog|antagen|tillstyrk/.test(beslutText);
      const harAvslag = /avslag|avslog|avvisad|avstyrk|avslå/.test(beslutText);

      let riksdagenUtfall = null;
      if (harAvslag) {
        riksdagenUtfall = "avslag";
      } else if (harBifall) {
        riksdagenUtfall = "bifall";
      } else if (
        (dokStatus.includes("avslutad") || dokStatus.includes("beslutat") || dokStatus.includes("slutbehandlad")) &&
        beslutText === "" && (lagforslagUrl.includes("/proposition/") || lagforslagUrl.includes("/betankande/"))
      ) {
        // Avslutad/beslutat utan explicit besluttext — nästan alltid bifall för prop och bet
        riksdagenUtfall = "bifall";
      }

      if (!riksdagenUtfall) return;

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
    } catch { /* ignorera per-dok-fel */ }
  }));

  return NextResponse.json({
    uppdaterade,
    vantande: Object.keys(pending).length,
    fel: fel.length > 0 ? fel : undefined,
    debug: debugSample,
  });
}
