export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const text = (searchParams.get("text") || "").slice(0, 200);
  if (!text) return new Response("Missing text", { status: 400 });

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=sv&client=tw-ob&q=${encodeURIComponent(text)}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });
    if (!res.ok) return new Response("TTS failed", { status: 502 });
    const audio = await res.arrayBuffer();
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("TTS error", { status: 502 });
  }
}
