const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const sbh = () => ({ apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` });

// Enkel cache: 60 sekunder
let cache = null;
let cacheTs = 0;

async function getAllOpinions() {
  if (cache && Date.now() - cacheTs < 60_000) return cache;
  const res = await fetch(
    `${SB_URL}/rest/v1/opinion_roster?select=fraga,kategori,roster_ja,roster_nej,roster_osaker,ai_ja,ai_nej,ai_osaker&order=fraga.asc`,
    { headers: sbh() }
  );
  if (!res.ok) return [];
  const raw = await res.json();
  cache = raw.map(r => {
    const total     = (r.roster_ja || 0) + (r.roster_nej || 0) + (r.roster_osaker || 0);
    const ai_total  = (r.ai_ja || 0) + (r.ai_nej || 0) + (r.ai_osaker || 0);
    return {
      fraga:       r.fraga,
      kategori:    r.kategori || "övrigt",
      votes: {
        ja:     r.roster_ja   || 0,
        nej:    r.roster_nej  || 0,
        osaker: r.roster_osaker || 0,
        total,
      },
      percentages: total > 0 ? {
        ja:     Math.round((r.roster_ja   || 0) / total * 100),
        nej:    Math.round((r.roster_nej  || 0) / total * 100),
        osaker: Math.round((r.roster_osaker || 0) / total * 100),
      } : { ja: null, nej: null, osaker: null },
      ai_votes: ai_total > 0 ? {
        ja:     r.ai_ja    || 0,
        nej:    r.ai_nej   || 0,
        osaker: r.ai_osaker || 0,
        total:  ai_total,
        ja_pct: Math.round((r.ai_ja || 0) / ai_total * 100),
      } : null,
    };
  });
  cacheTs = Date.now();
  return cache;
}

// GET /api/opinion-stats
// Params: ?kategori=ekonomi  ?q=skatt  ?limit=10  ?sort=total|ja_pct|nej_pct
export async function GET(req) {
  const url      = new URL(req.url);
  const kategori = url.searchParams.get("kategori");
  const q        = url.searchParams.get("q")?.toLowerCase();
  const limit    = Math.min(parseInt(url.searchParams.get("limit") || "100"), 200);
  const sort     = url.searchParams.get("sort") || "total";

  let data = await getAllOpinions();

  if (kategori) data = data.filter(r => r.kategori === kategori);
  if (q)        data = data.filter(r => r.fraga.toLowerCase().includes(q));

  // Sortering
  data = [...data].sort((a, b) => {
    if (sort === "ja_pct")  return (b.percentages.ja  ?? -1) - (a.percentages.ja  ?? -1);
    if (sort === "nej_pct") return (b.percentages.nej ?? -1) - (a.percentages.nej ?? -1);
    return b.votes.total - a.votes.total; // default: mest röstade
  });

  data = data.slice(0, limit);

  const totalVotes    = data.reduce((s, r) => s + r.votes.total, 0);
  const kategorier    = [...new Set((await getAllOpinions()).map(r => r.kategori))].sort();

  return Response.json({
    meta: {
      total_questions: (await getAllOpinions()).length,
      returned:        data.length,
      total_votes:     (await getAllOpinions()).reduce((s, r) => s + r.votes.total, 0),
      kategorier,
      filters: { kategori: kategori || null, q: q || null, sort, limit },
    },
    questions: data,
  }, {
    headers: { "Cache-Control": "public, s-maxage=60" },
  });
}
