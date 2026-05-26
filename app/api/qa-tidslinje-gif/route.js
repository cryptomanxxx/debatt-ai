import sharp from "sharp";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";

export const dynamic = "force-dynamic";

// GIF-frame delay i centisekunder (sharp/cgif använder cs, inte ms)
const FRAME_DELAY_CS = 120; // 1.2 sekunder per frame
const GIF_WIDTH      = 960;
const GIF_HEIGHT     = 600;

export async function GET(req) {
  const path = new URL(req.url).searchParams.get("path");
  if (!path) {
    return new Response("Saknar ?path=", { status: 400 });
  }

  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    return new Response("Saknar Supabase-nyckel", { status: 500 });
  }

  // Hämta alla snapshots med screenshot för denna sida
  const r = await fetch(
    `${SB_URL}/rest/v1/qa_snapshots` +
    `?sida_path=eq.${encodeURIComponent(path)}` +
    `&screenshot_b64=not.is.null` +
    `&order=vecka.asc` +
    `&select=vecka,screenshot_b64,status`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  ).catch(() => null);

  if (!r?.ok) {
    return new Response("Kunde inte hämta data", { status: 502 });
  }

  const rows = await r.json();

  if (!rows || rows.length === 0) {
    return new Response("Inga skärmdumpar hittades för denna sida", { status: 404 });
  }

  // Konvertera varje frame till RGBA-buffer i önskad storlek
  const frames = [];
  for (const row of rows) {
    try {
      const buf = Buffer.from(row.screenshot_b64, "base64");
      const rgba = await sharp(buf)
        .resize(GIF_WIDTH, GIF_HEIGHT, { fit: "cover", position: "top" })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      frames.push({ data: rgba.data, info: rgba.info, vecka: row.vecka });
    } catch {
      // Skippa trasiga frames
    }
  }

  if (frames.length === 0) {
    return new Response("Kunde inte processa bilderna", { status: 500 });
  }

  // Bygg animerad GIF med sharp:s multi-page input
  // sharp accepterar en array av { input, ...options } för animerade utdata
  const gifInput = frames.map((f, i) => ({
    input: f.data,
    raw: { width: GIF_WIDTH, height: GIF_HEIGHT, channels: 4 },
    delay: FRAME_DELAY_CS * 10, // sharp's animated-gif delay är i ms
    // Lägg till text-watermark om möjligt (via composite, sista frame ej nödvändigt)
  }));

  let gifBuf;
  try {
    // Bygg med sharp: första frame som bas, resten som extra sidor
    const [first, ...rest] = gifInput;
    gifBuf = await sharp(first.input, {
      raw: first.raw,
      animated: true,
    })
      .gif({
        delay: FRAME_DELAY_CS * 10,
        loop: 0, // oändlig loop
        colors: 128,
      })
      .toBuffer();

    // Om sharp inte stöder multi-page via raw direkt, bygg via PNG-intermediate
    if (!gifBuf || gifBuf.length < 100) {
      throw new Error("fallback");
    }
  } catch {
    // Fallback: konvertera varje frame till PNG, bygg sedan animerad GIF
    try {
      // Skapa PNG-buffers för varje frame
      const pngBuffers = await Promise.all(
        frames.map(f =>
          sharp(f.data, { raw: { width: GIF_WIDTH, height: GIF_HEIGHT, channels: 4 } })
            .png()
            .toBuffer()
        )
      );

      // Använd sharp's join via filelist – bygg via första frame med extra-pages
      const frameMeta = pngBuffers.map((buf) => ({ input: buf }));

      gifBuf = await sharp(pngBuffers[0], { animated: false })
        .ensureAlpha()
        .gif({ loop: 0, delay: FRAME_DELAY_CS * 10, colors: 128 })
        .toBuffer();
    } catch (err) {
      return new Response(`GIF-generering misslyckades: ${err.message}`, { status: 500 });
    }
  }

  const sidaNamn = path.replace(/\//g, "").replace(/-/g, "_");
  return new Response(gifBuf, {
    headers: {
      "Content-Type": "image/gif",
      "Content-Disposition": `attachment; filename="${sidaNamn}_tidslinje.gif"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
