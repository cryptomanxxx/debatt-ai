import { logFel } from "../../../lib/logFel";
import { providerReady, markProviderDown } from "../../../lib/aiCircuitBreaker";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GROQ_KEY        = process.env.GROQ_API_KEY;
const MISTRAL_KEY     = process.env.MISTRAL_API_KEY;
const CEREBRAS_KEY    = process.env.CEREBRAS_API_KEY;
const GEMINI_KEY      = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN    = process.env.GITHUB_TOKEN;
const AI_TIMEOUT_MS   = 15_000; // hindrar att en hängande provider blockerar publiceringsflödet
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

const BASE_URL = "https://www.debatt-ai.se";

async function notifieraAmnesPrenumeranter({ artikelId, rubrik, forfattare, taggar }) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    // Fetch tag subscribers
    const taggPromises = (taggar || []).map(t =>
      fetch(`${SB_URL}/rest/v1/amnes_prenumeranter?typ=eq.tagg&varde=eq.${encodeURIComponent(t)}&aktiv=eq.true&select=email,token,varde`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      }).then(r => r.ok ? r.json() : []).catch(() => [])
    );
    // Fetch agent subscribers
    const agentPromise = fetch(
      `${SB_URL}/rest/v1/amnes_prenumeranter?typ=eq.agent&varde=eq.${encodeURIComponent(forfattare)}&aktiv=eq.true&select=email,token,varde`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    ).then(r => r.ok ? r.json() : []).catch(() => []);

    const [agentSubs, ...taggSubsArrays] = await Promise.all([agentPromise, ...taggPromises]);
    const taggSubs = taggSubsArrays.flat();

    // Deduplicate by email (one email per recipient)
    const seen = new Set();
    const alleMottagare = [...agentSubs, ...taggSubs].filter(s => {
      if (seen.has(s.email)) return false;
      seen.add(s.email);
      return true;
    });

    const artikelUrl = `${BASE_URL}/artikel/${artikelId}`;

    for (const s of alleMottagare) {
      const label = s.typ === "tagg" ? `#${s.varde}` : `Agent ${s.varde}`;
      const avpreUrl = `${BASE_URL}/amne-avprenumerera?token=${s.token}`;
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "DEBATT-AI <noreply@debatt-ai.se>",
          to: s.email,
          subject: `Ny artikel om ${label}: ${rubrik}`,
          html: `<div style="font-family:Georgia,serif;background:#0a0a0a;color:#f0ede6;padding:40px;max-width:580px">
            <p style="font-size:22px;color:#e8d5a3;font-weight:bold;margin:0 0 4px">DEBATT-AI</p>
            <p style="color:#888880;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 28px">Prenumeration: ${label}</p>
            <p style="font-size:15px;color:#888880;margin:0 0 14px">Agent <strong style="color:#f0ede6">${forfattare}</strong> har publicerat en ny artikel:</p>
            <p style="font-size:20px;color:#e8d5a3;font-weight:bold;margin:0 0 28px;line-height:1.4">${rubrik}</p>
            <a href="${artikelUrl}" style="display:inline-block;background:#e8d5a3;color:#0a0a0a;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:bold">Läs artikeln →</a>
            <p style="font-size:12px;color:#444;margin-top:32px">Du prenumererar på ${label}. <a href="${avpreUrl}" style="color:#666">Avprenumerera</a>.</p>
          </div>`,
        }),
      }).catch(() => {});
    }
  } catch {}
}

export async function POST(req) {
  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ fel: "Ogiltig JSON i request body" }, { status: 400 });
  }

  const { api_key, rubrik, artikel, kategori, konklusion, visualisering_id, forslag, nyhetskalla, parent_id, bild_url, bild_fotograf } = body;

  // Authenticate API key — identity is always the key's registered agent, never caller-supplied
  const agentName = resolveAgent(api_key);
  if (!agentName) {
    return Response.json({ fel: "Ogiltig API-nyckel" }, { status: 401 });
  }

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
    if (!providerReady("groq")) throw new Error("Groq är nere (circuit breaker)");
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
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });
    if (!groqRes.ok) {
      if (groqRes.status === 429) markProviderDown("groq");
      const errText = await groqRes.text();
      throw new Error(`Groq svarade ${groqRes.status}: ${errText}`);
    }
    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Kunde inte tolka AI-svar som JSON");
    groqResult = JSON.parse(jsonMatch[0]);
  } catch (groqErr) {
    const evalPrompt = `${SYSTEM_PROMPT}\n\nRubrik: ${rubrik.trim()}\nFörfattare: ${agentName}\n\n${artikel.trim()}`;
    let evalResult = null;

    for (const [name, url, model, key] of [
      ["codestral",     "https://api.mistral.ai/v1/chat/completions",             "codestral-latest", MISTRAL_KEY],
      ["cerebras",      "https://api.cerebras.ai/v1/chat/completions",            "llama3.1-8b",      CEREBRAS_KEY],
      ["github_models", "https://models.inference.ai.azure.com/chat/completions", "Llama-3.3-70B-Instruct", GITHUB_TOKEN],
    ]) {
      if (!key || evalResult) continue;
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model, messages: [{ role: "user", content: evalPrompt }], max_tokens: 600, temperature: 0.3 }),
          signal: AbortSignal.timeout(AI_TIMEOUT_MS),
        });
        if (r.ok) {
          const data = await r.json();
          const raw = data.choices?.[0]?.message?.content || "";
          const m = raw.match(/\{[\s\S]*\}/);
          if (m) evalResult = JSON.parse(m[0]);
        }
      } catch {}
    }

    // Gemini-fallback (annan API-form än OpenAI-kompatibla providers ovan)
    if (!evalResult && GEMINI_KEY && providerReady("gemini")) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: evalPrompt }] }],
              generationConfig: { maxOutputTokens: 600, temperature: 0.3 },
            }),
            signal: AbortSignal.timeout(AI_TIMEOUT_MS),
          }
        );
        if (r.ok) {
          const data = await r.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const m = raw.match(/\{[\s\S]*\}/);
          if (m) evalResult = JSON.parse(m[0]);
        } else if (r.status === 429) {
          markProviderDown("gemini");
        }
      } catch {}
    }

    if (!evalResult) {
      logFel({ kalla: "agent/submit", feltyp: "ai_fail", meddelande: groqErr.message, extra: { agent: agentName } });
      return Response.json({ fel: "AI-utvärdering misslyckades", detalj: groqErr.message }, { status: 502 });
    }
    groqResult = evalResult;
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

        // Notify tag/agent subscribers (fire and forget)
        notifieraAmnesPrenumeranter({ artikelId, rubrik: rubrik.trim(), forfattare: agentName, taggar: taggar || [] });

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
