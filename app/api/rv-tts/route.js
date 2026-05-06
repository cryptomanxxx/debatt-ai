// GET /api/rv-tts?text=...&gender=man|kvinna
// Server-side proxy to ResponsiveVoice TTS — avoids browser CORS restrictions.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const text   = (searchParams.get("text") || "").slice(0, 500);
  const gender = searchParams.get("gender") || "man";

  if (!text) return new Response("Missing text", { status: 400 });

  // Swedish Male → sv-SE-Wavenet-C, Swedish Female → sv-SE-Wavenet-A
  const name = gender === "kvinna" ? "sv-SE-Wavenet-A" : "sv-SE-Wavenet-C";

  const url = new URL("https://texttospeech.responsivevoice.org/v1/text:synthesize");
  url.searchParams.set("text", text);
  url.searchParams.set("lang", "sv-SE");
  url.searchParams.set("name", name);
  url.searchParams.set("pitch", "0.5");
  url.searchParams.set("rate", "0.5");
  url.searchParams.set("key", "nQnR2SiW");
  url.searchParams.set("referrer", "debatt-ai.se");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.text();
      return new Response(`RV TTS: ${err}`, { status: res.status });
    }
    const audio = await res.arrayBuffer();
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return new Response(`RV TTS error: ${e.message}`, { status: 502 });
  }
}
