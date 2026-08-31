// No edge runtime — Node.js ger oss dns.lookup() för SSRF-skydd mot privata IP-intervall.

import dns from "node:dns/promises";
import { checkRateLimit } from "../../../lib/kanalRateLimit";
import { logFel, getIp } from "../../../lib/logFel";
import { decodeHtmlEntities } from "../../../lib/escapeHtml";

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB
const TITEL_MAX = 200;
const SAMMANFATTNING_MAX = 500;

function isPrivateIp(ip) {
  if (ip.includes(".")) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("::ffff:")) return isPrivateIp(lower.slice(7));
  if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
  return false;
}

// Snabb, synkron formatkontroll — filtrerar bort uppenbart olämpliga URL:er
// innan någon nätverkstrafik görs (http://, javascript:, IPv4/IPv6-literaler, "localhost").
function harRimligtVardformat(url) {
  if (url.protocol !== "https:") return false;
  const h = url.hostname;
  if (!h || h.startsWith("[")) return false; // IPv6-literal i URL
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return false; // IPv4-literal
  if (!h.includes(".")) return false; // t.ex. "localhost"
  return true;
}

// Fullständig kontroll (inkl. DNS-uppslag) — körs för varje hopp i en redirect-kedja,
// eftersom ett domännamn kan peka på en privat IP oavsett hur "riktigt" det ser ut.
async function ärSakerAttHamta(url) {
  if (!harRimligtVardformat(url)) return false;
  try {
    const addresses = await dns.lookup(url.hostname, { all: true });
    return addresses.length > 0 && addresses.every((a) => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

async function lasBegransat(response, maxBytes) {
  if (!response.body) return await response.text();
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    chunks.push(value);
    if (total > maxBytes) { reader.cancel().catch(() => {}); break; }
  }
  const kapadLangd = Math.min(total, maxBytes);
  const merged = new Uint8Array(kapadLangd);
  let offset = 0;
  for (const chunk of chunks) {
    const kvar = merged.length - offset;
    if (kvar <= 0) break;
    merged.set(chunk.subarray(0, kvar), offset);
    offset += Math.min(chunk.byteLength, kvar);
  }
  return new TextDecoder("utf-8").decode(merged);
}

async function hamtaArtikelHtml(startUrl) {
  let current = startUrl;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    if (!(await ärSakerAttHamta(current))) return { fel: "otillåten_url" };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(current.toString(), {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; DebattAI/1.0; +https://www.debatt-ai.se)" },
      });
    } catch (e) {
      return { fel: e.name === "AbortError" ? "timeout" : "fetch_fel" };
    } finally {
      clearTimeout(timeout);
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return { fel: "redirect_utan_mal" };
      try { current = new URL(loc, current); } catch { return { fel: "ogiltig_redirect" }; }
      continue;
    }
    if (!res.ok) return { fel: `http_${res.status}` };

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return { fel: "fel_content_type" };

    const contentLength = parseInt(res.headers.get("content-length") || "0", 10);
    if (contentLength && contentLength > MAX_BODY_BYTES) return { fel: "for_stor" };

    const html = await lasBegransat(res, MAX_BODY_BYTES);
    return { html, slutgiltigUrl: current.toString() };
  }
  return { fel: "for_manga_redirects" };
}

function extraheraMeta(html, re) {
  const m = html.match(re);
  return m ? decodeHtmlEntities(m[1].trim()) : "";
}

function extraheraArtikel(html) {
  const ogTitel =
    extraheraMeta(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i) ||
    extraheraMeta(html, /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i);
  const titleTag = extraheraMeta(html, /<title[^>]*>([^<]*)<\/title>/i);
  const ogBeskrivning =
    extraheraMeta(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i) ||
    extraheraMeta(html, /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i);
  const metaBeskrivning =
    extraheraMeta(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    extraheraMeta(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);

  const titel = (ogTitel || titleTag || "").slice(0, TITEL_MAX);
  let sammanfattning = ogBeskrivning || metaBeskrivning;

  if (!sammanfattning) {
    const utanSkript = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ");
    sammanfattning = decodeHtmlEntities(utanSkript.replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
  }

  return { titel, sammanfattning: sammanfattning.slice(0, SAMMANFATTNING_MAX) };
}

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

  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return Response.json({ error: "Ogiltig URL" }, { status: 400 });
  }

  if (!harRimligtVardformat(parsed)) {
    return Response.json({ error: "Bara https-länkar till en vanlig webbadress stöds" }, { status: 400 });
  }

  const result = await hamtaArtikelHtml(parsed);
  if (result.fel) {
    logFel({ kalla: "chatt/artikel-kontext", feltyp: "rss_fail", meddelande: result.fel, ip, extra: { url: url.slice(0, 300) } });
    const publikaFel = { otillåten_url: "Den här webbadressen kan inte hämtas", fel_content_type: "Länken är inte en vanlig webbsida", for_stor: "Sidan är för stor" };
    return Response.json({ error: publikaFel[result.fel] || "Kunde inte hämta artikeln" }, { status: 502 });
  }

  const { titel, sammanfattning } = extraheraArtikel(result.html);
  if (!sammanfattning) {
    return Response.json({ error: "Hittade ingen läsbar text på sidan" }, { status: 422 });
  }

  return Response.json({ titel: titel || null, sammanfattning, url: result.slutgiltigUrl });
}
