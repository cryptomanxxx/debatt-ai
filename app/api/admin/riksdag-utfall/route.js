import { NextResponse } from "next/server";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

function sbHeaders() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

// Hämtar voteringsresultat från riksdagen.se och sätter riksdagen_utfall automatiskt.
// Körs från Vercel (inte GitHub Actions) så att data.riksdagen.se inte blockerar anropet.
export async function POST() {
  const h = sbHeaders();

  // 1. Hämta våra riksdagsförslag som saknar utfall
  const pendingRes = await fetch(
    `${SB_URL}/rest/v1/lagforslag?kalla=eq.riksdagen&riksdagen_utfall=is.null&select=id,riksdagen_id`,
    { headers: h }
  );
  if (!pendingRes.ok) {
    return NextResponse.json({ error: "Kunde inte hämta väntande förslag" }, { status: 502 });
  }
  const pendingRows = await pendingRes.json();
  const pending = {};
  for (const row of pendingRows) {
    if (row.riksdagen_id) pending[row.riksdagen_id] = row.id;
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
        const lagforslagId = pending[dokId];

        const patchRes = await fetch(
          `${SB_URL}/rest/v1/lagforslag?id=eq.${lagforslagId}`,
          {
            method: "PATCH",
            headers: { ...h, Prefer: "return=minimal" },
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
  for (const [dokId, lagforslagId] of Object.entries(pending)) {
    try {
      const perRes = await fetch(
        `https://data.riksdagen.se/voteringlista/?dokid=${encodeURIComponent(dokId)}&utformat=json&sz=10`,
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
          headers: { ...h, Prefer: "return=minimal" },
          body: JSON.stringify({ riksdagen_utfall: riksdagenUtfall, riksdagen_utfall_datum: datum, status: "avgjort" }),
        }
      );
      if (patchRes.ok) uppdaterade++;
    } catch (e) {
      fel.push(`${dokId}: ${e.message}`);
    }
  }

  return NextResponse.json({
    uppdaterade,
    vantande: Object.keys(pending).length,
    fel: fel.length > 0 ? fel : undefined,
  });
}
