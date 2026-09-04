// Tunn route-wrapper — all SSRF-säker hämtnings-/extraktionslogik bor i
// app/lib/hamtaArtikelInnehall.js (delad med /api/nyhetsflode/importera).
// Samma request-/svarskontrakt som innan (POST {url} -> {titel, sammanfattning, url} | {error}).

import { checkRateLimit } from "../../../lib/kanalRateLimit";
import { logFel, getIp } from "../../../lib/logFel";
import { hamtaArtikelInnehall } from "../../../lib/hamtaArtikelInnehall";

export async function POST(req) {
  const ip = getIp(req);
  const rl = checkRateLimit(req, "chatt-artikel-kontext", 15, 10 * 60 * 1000);
  if (!rl.ok) {
    logFel({ kalla: "chatt/artikel-kontext", feltyp: "rate_limit", meddelande: "429 rate limit", ip, extra: { retryAfter: rl.retryAfter } });
    return Response.json({ error: "Too many requests", retryAfter: rl.retryAfter }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  const { url } = await req.json().catch(() => ({}));
  if (typeof url !== "string" || !url.trim() || url.length > 2000) {
    return Response.json({ error: "Ogiltig URL" }, { status: 400 });
  }

  const result = await hamtaArtikelInnehall(url);
  if (!result.ok) {
    const status = result.fel === "ingen_text" ? 422 : (result.fel === "ogiltig_url" || result.fel === "url_format") ? 400 : 502;
    if (status === 502) {
      logFel({ kalla: "chatt/artikel-kontext", feltyp: "rss_fail", meddelande: result.fel, ip, extra: { url: url.slice(0, 300) } });
    }
    return Response.json({ error: result.publiktFel }, { status });
  }

  return Response.json({ titel: result.titel, sammanfattning: result.sammanfattning, url: result.url });
}
