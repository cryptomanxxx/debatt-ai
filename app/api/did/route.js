import { NextResponse } from "next/server";

const DID_API  = "https://api.d-id.com";
// Flyttat till Supabase Storage sep 2026 — se app/nyhetskallor/AgentOverlay.js
const PODD_AVATAR_BASE = "https://fmwxftnistkoqazfwnuj.supabase.co/storage/v1/object/public/podd-avatarer";

function didHeaders() {
  const encoded = Buffer.from(`${process.env.D_ID_API_KEY}:`).toString("base64");
  return {
    "Authorization": `Basic ${encoded}`,
    "Content-Type":  "application/json",
    "Accept":        "application/json",
  };
}

function agentSlug(namn) {
  return namn.toLowerCase()
    .replace(/ä/g, "a").replace(/å/g, "a").replace(/ö/g, "o")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// Svensk röst per agent (Microsoft Azure via D-ID)
const AGENT_VOICE = {
  "Nationalekonom":       "sv-SE-MattiasNeural",
  "Miljöaktivist":        "sv-SE-MattiasNeural",
  "Teknikoptimist":       "sv-SE-MattiasNeural",
  "Konservativ debattör": "sv-SE-MattiasNeural",
  "Jurist":               "sv-SE-MattiasNeural",
  "Journalist":           "sv-SE-MattiasNeural",
  "Filosof":              "sv-SE-MattiasNeural",
  "Läkare":               "sv-SE-MattiasNeural",
  "Psykolog":             "sv-SE-SofieNeural",
  "Historiker":           "sv-SE-MattiasNeural",
  "Sociolog":             "sv-SE-SofieNeural",
  "Kryptoanalytiker":     "sv-SE-MattiasNeural",
  "Den hungriga":         "sv-SE-MattiasNeural",
  "Mamman":               "sv-SE-SofieNeural",
  "Den sura":             "sv-SE-MattiasNeural",
  "Den trötta":           "sv-SE-MattiasNeural",
  "Den stressade":        "sv-SE-SofieNeural",
  "Den lugna":            "sv-SE-SofieNeural",
  "Pensionären":          "sv-SE-MattiasNeural",
  "Tonåringen":           "sv-SE-MattiasNeural",
  "Den nostalgiske":      "sv-SE-MattiasNeural",
  "Hypokondrikern":       "sv-SE-SofieNeural",
  "Optimisten":           "sv-SE-SofieNeural",
  "Den rike":             "sv-SE-MattiasNeural",
};

// POST /api/did — skapar ett D-ID talk-jobb, returnerar { id }
export async function POST(req) {
  const { agent, text, kon } = await req.json();
  if (!agent || !text) return NextResponse.json({ error: "agent och text krävs" }, { status: 400 });

  const slug     = agentSlug(agent);
  const imageUrl = `${PODD_AVATAR_BASE}/${slug}.png`;
  const voice    = kon === "kvinna"
    ? "sv-SE-SofieNeural"
    : kon === "man"
    ? "sv-SE-MattiasNeural"
    : AGENT_VOICE[agent] || "sv-SE-MattiasNeural";

  try {
    const res = await fetch(`${DID_API}/talks`, {
      method: "POST",
      headers: didHeaders(),
      body: JSON.stringify({
        source_url: imageUrl,
        script: {
          type: "text",
          input: text.slice(0, 500),
          provider: {
            type: "microsoft",
            voice_id: voice,
          },
        },
        config: { fluent: true, pad_audio: 0.0 },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ id: data.id, status: data.status });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/did?id=xxx — pollar status och returnerar result_url när klar
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id krävs" }, { status: 400 });

  try {
    const res = await fetch(`${DID_API}/talks/${id}`, { headers: didHeaders() });
    if (!res.ok) return NextResponse.json({ error: "D-ID fetch misslyckades" }, { status: res.status });
    const data = await res.json();
    return NextResponse.json({
      id:         data.id,
      status:     data.status,
      result_url: data.result_url || null,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
