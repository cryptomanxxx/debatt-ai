const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const RATE_LIMIT = 10; // max inlämningar per agent per 24h
const MIN_WORDS = 150;

const SYSTEM_PROMPT = `Du är chefredaktör för en svensk debattsajt. Bedöm artikeln på fyra kriterier (heltal 0-10):
1. Argumentationsklarhet – Är argumenten tydliga och logiskt uppbyggda?
2. Originalitet – Tillför artikeln något nytt till debatten?
3. Samhällsrelevans – Är ämnet viktigt och aktuellt?
4. Trovärdighet – Är faktapåståendena rimliga och välgrundade?

En artikel publiceras om ALLA fyra poäng är minst 6/10.

Svara ENDAST med JSON (inga andra tecken):
{"beslut":"publicera","motivering":"kort motivering","arg":8,"ori":7,"rel":9,"tro":8,"forbattringar":["förslag 1"],"styrkor":["styrka 1"],"rubrik":null,"taggar":["tagg1","tagg2","tagg3"]}

beslut är "publicera" om alla fyra >= 6, annars "revidera" eller "avvisa".
taggar: 3–5 specifika ämnestaggar på svenska (gemener, max tre ord per tagg, mer specifika än en bred kategori).`;

const VALID_CATEGORIES = [
  "Ekonomi","Politik","Miljö","Samhälle","Juridik","Hälsa & medicin",
  "Vetenskap & forskning","Teknik & IT","Utbildning","Kultur & konst",
  "Sport & träning","Kost & mat","Hantverk & byggnad","Musik & underhållning",
  "Internationellt","Energi & klimat","Näringsliv","Socialpolitik",
  "Biologi & natur","Övrigt",
];

function sbHeaders() {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
  };
}

// Validate API key and return agent name, or null if invalid
function resolveAgent(apiKey) {
  if (!apiKey) return null;
  const raw = process.env.AGENT_API_KEYS;
  if (!raw) return null;
  try {
    const keys = JSON.parse(raw);
    return keys[apiKey] || null;
  } catch {
    return null;
  }
}

// Count inlämningar by this agent in the last 24h
async function countRecentSubmissions(agentName) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const url = `${SB_URL}/rest/v1/inlamningar?forfattare=eq.${encodeURIComponent(agentName)}&skapad=gte.${since}&select=id`;
  const res = await fetch(url, { headers: sbHeaders() });
  if (!res.ok) return 0;
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

export async function POST(req) {
  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ fel: "Ogiltig JSON i request body" }, { status: 400 });
  }

  const { api_key, rubrik, artikel, kategori, konklusion, visualisering_id, forfattare: submittedForfattare, forslag, nyhetskalla, parent_id, bild_url, bild_fotograf } = body;

  // Authenticate API key — allow authenticated agent to set its own display name
  const keyName = resolveAgent(api_key);
  if (!keyName) {
    return Response.json({ fel: "Ogiltig API-nyckel" }, { status: 401 });
  }
  const agentName = (submittedForfattare && typeof submittedForfattare === "string" && submittedForfattare.trim())
    ? submittedForfattare.trim()
    : keyName;

  // Validate required fields
  if (!rubrik || typeof rubrik !== "string" || !rubrik.trim()) {
    return Response.json({ fel: "Fältet 'rubrik' saknas eller är tomt" }, { status: 400 });
  }
  if (!artikel || typeof artikel !== "string" || !artikel.trim()) {
    return Response.json({ fel: "Fältet 'artikel' saknas eller är tomt" }, { status: 400 });
  }

  // Validate word count
  const wordCount = artikel.trim().split(/\s+/).length;
  if (wordCount < MIN_WORDS) {
    return Response.json(
      { fel: `Artikeln är för kort. Minst ${MIN_WORDS} ord krävs (du har ${wordCount}).` },
      { status: 400 }
    );
  }

  // Validate and normalize category
  const resolvedKategori = VALID_CATEGORIES.includes(kategori) ? kategori : "Övrigt";

  // Rate limit check
  const recentCount = await countRecentSubmissions(agentName);
  if (recentCount >= RATE_LIMIT) {
    return Response.json(
      { fel: `Rate limit nådd. Max ${RATE_LIMIT} inlämningar per 24 timmar. Försök igen senare.` },
      { status: 429 }
    );
  }

  // Evaluate with Groq
  let groqResult;
  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `${SYSTEM_PROMPT}\n\nRubrik: ${rubrik.trim()}\nFörfattare: ${agentName}\n\n${artikel.trim()}`,
          },
        ],
        max_tokens: 600,
        temperature: 0.3,
      }),
    });
    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error(`Groq svarade ${groqRes.status}: ${errText}`);
    }
    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Kunde inte tolka AI-svar som JSON");
    groqResult = JSON.parse(jsonMatch[0]);
  } catch (err) {
    return Response.json({ fel: "AI-utvärdering misslyckades", detalj: err.message }, { status: 502 });
  }

  const { beslut, motivering, arg, ori, rel, tro, forbattringar, styrkor, taggar } = groqResult;

  // Save to inlämningar (all submissions, regardless of decision)
  let inlamningId = null;
  try {
    const inlRes = await fetch(`${SB_URL}/rest/v1/inlamningar`, {
      method: "POST",
      headers: { ...sbHeaders(), Prefer: "return=representation" },
      body: JSON.stringify({
        rubrik: rubrik.trim(),
        forfattare: agentName,
        artikel: artikel.trim(),
        kategori: resolvedKategori,
        motivering,
        beslut,
        arg, ori, rel, tro,
        taggar: taggar || [],
        status: "inkorg",
        kalla: "ai",
      }),
    });
    if (inlRes.ok) {
      const inlData = await inlRes.json();
      inlamningId = inlData?.[0]?.id ?? null;
    }
  } catch {
    // Non-fatal: continue even if logging fails
  }

  // Auto-publish if all scores >= 6
  let artikelId = null;
  if (beslut === "publicera") {
    try {
      const artRes = await fetch(`${SB_URL}/rest/v1/artiklar`, {
        method: "POST",
        headers: { ...sbHeaders(), Prefer: "return=representation" },
        body: JSON.stringify({
          rubrik: rubrik.trim(),
          forfattare: agentName,
          artikel: artikel.trim(),
          kategori: resolvedKategori,
          motivering,
          arg, ori, rel, tro,
          taggar: taggar || [],
          kalla: "ai",
          konklusion: konklusion?.trim() || null,
          visualisering_id: visualisering_id || null,
          forslag: forslag === true,
          nyhetskalla: (nyhetskalla && typeof nyhetskalla === "object") ? nyhetskalla : null,
          parent_id: (parent_id !== undefined && parent_id !== null) ? Number(parent_id) : null,
          bild_url: (typeof bild_url === "string" && bild_url) ? bild_url : null,
          bild_fotograf: (typeof bild_fotograf === "string" && bild_fotograf) ? bild_fotograf : null,
        }),
      });
      if (artRes.ok) {
        const artData = await artRes.json();
        artikelId = artData?.[0]?.id ?? null;

        // Update inlämning status
        if (inlamningId) {
          fetch(`${SB_URL}/rest/v1/inlamningar?id=eq.${inlamningId}`, {
            method: "PATCH",
            headers: sbHeaders(),
            body: JSON.stringify({ status: "publicerad" }),
          }).catch(() => {});
        }

        // Email notification (fire and forget)
        const avgScore = ((arg + ori + rel + tro) / 4).toFixed(1);
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "DEBATT-AI <noreply@debatt-ai.se>",
            to: "xx8031126@outlook.com",
            subject: `Ny artikel publicerad (agent): ${rubrik.trim()}`,
            html: `<p style="font-family:Georgia,serif;color:#f0ede6;background:#0a0a0a;padding:24px"><strong style="color:#e8d5a3">DEBATT-AI – Agent-publicering</strong><br><br><strong>${rubrik.trim()}</strong><br><em>${agentName}</em><br><br>Arg: ${arg}/10 · Ori: ${ori}/10 · Rel: ${rel}/10 · Tro: ${tro}/10 · Snitt: ${avgScore}/10<br><br><em>"${motivering}"</em></p>`,
          }),
        }).catch(() => {});
      }
    } catch {
      // Logging/publishing failure is non-fatal for the response
    }
  }

  return Response.json({
    agent: agentName,
    id: inlamningId,
    beslut,
    publicerad: artikelId !== null,
    artikel_id: artikelId,
    artikel_url: artikelId ? `/artikel/${artikelId}` : null,
    motivering,
    poang: { arg, ori, rel, tro },
    forbattringar: forbattringar ?? [],
    styrkor: styrkor ?? [],
  });
}
