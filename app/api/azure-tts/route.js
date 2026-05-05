// GET /api/azure-tts?text=...&voice=sv-SE-MattiasNeural
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const text  = (searchParams.get("text") || "").slice(0, 500);
  const voice = searchParams.get("voice") || "sv-SE-MattiasNeural";

  if (!text) return new Response("Missing text", { status: 400 });

  const key    = process.env.AZURE_TTS_KEY;
  const region = process.env.AZURE_TTS_REGION || "swedencentral";

  if (!key) return new Response("AZURE_TTS_KEY saknas", { status: 503 });

  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='sv-SE'><voice name='${voice}'>${escaped}</voice></speak>`;

  try {
    const res = await fetch(
      `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
        },
        body: ssml,
      }
    );
    if (!res.ok) {
      const err = await res.text();
      return new Response(`Azure TTS: ${err}`, { status: res.status });
    }
    const audio = await res.arrayBuffer();
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return new Response(`Azure TTS error: ${e.message}`, { status: 502 });
  }
}
