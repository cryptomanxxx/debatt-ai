import SIDOR from "../../qa-tidslinje/sidor.json";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const ALLOWED_PATHS = new Set(SIDOR.map(s => s.path));
const MAX_BASE64_LENGTH = 12 * 1024 * 1024;

export const dynamic = "force-dynamic";

// Äldre QA-skärmdumpar ligger ännu som Base64 i Supabase.
// Hämta bilden först vid visning: den stora strängen får inte hamna i
// /qa-tidslinjes ISR-cache eller React Server Component-payload.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const vecka = searchParams.get("vecka");

  if (!ALLOWED_PATHS.has(path) || !vecka || vecka.length > 64 ||
      !/^[a-zA-Z0-9_ .:-]+$/.test(vecka)) {
    return new Response("Ogiltig skärmbild", { status: 400 });
  }

  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return new Response("Bildtjänsten är inte konfigurerad", { status: 503 });

  const params = new URLSearchParams({
    sida_path: `eq.${path}`,
    vecka: `eq.${vecka}`,
    select: "screenshot_b64",
    limit: "1",
  });

  try {
    const response = await fetch(`${SB_URL}/rest/v1/qa_snapshots?${params}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!response.ok) return new Response("Kunde inte hämta skärmbilden", { status: 502 });

    const rows = await response.json();
    const base64 = rows?.[0]?.screenshot_b64;
    if (typeof base64 !== "string" || !base64) {
      return new Response("Skärmbilden hittades inte", { status: 404 });
    }
    if (base64.length > MAX_BASE64_LENGTH || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
      return new Response("Ogiltigt bildformat", { status: 422 });
    }

    const image = Buffer.from(base64, "base64");
    // QA-observatören lagrar PNG. Kontrollera signaturen före svaret.
    if (image.length < 8 || !image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      return new Response("Ogiltig PNG-bild", { status: 422 });
    }

    return new Response(image, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(image.length),
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Kunde inte hämta skärmbilden", { status: 502 });
  }
}
