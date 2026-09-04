// Delad SSRF-säker artikelhämtning — utbruten ur app/api/chatt/artikel-kontext/route.js
// oförändrad (samma logik, samma säkerhetsegenskaper) så att både den routen och
// /api/nyhetsflode/importera/route.js kan återanvända EXAKT samma validerade
// implementation istället för att dupliceras. All säkerhetslogik (BlockList,
// DNS-rebinding-skydd, redirect-hantering) hör hemma på ETT ställe.
//
// No edge runtime — Node.js ger oss dns.lookup() + net.BlockList + https.request()
// för SSRF-skydd mot privata IP-intervall, med anslutningen pinnad till den
// validerade adressen (se motivering nedan).

import dns from "node:dns/promises";
import https from "node:https";
import net from "node:net";
import { decodeHtmlEntities } from "./escapeHtml";

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB
const TITEL_MAX = 200;
const SAMMANFATTNING_MAX = 500;
const KALLA_MAX = 100;

// Två separata BlockList-instanser — net.BlockList slår ihop IPv4- och
// IPv6-regler i EN instans på ett sätt som gör att en ::ffff:0:0/96-regel
// (IPv4-mapped) tyst matchar ALLA vanliga IPv4-adresser även vid en ren
// "ipv4"-kontroll (verifierat empiriskt, inte dokumenterat beteende) — att
// blanda dem i samma BlockList hade blockerat all trafik. Verifierat att
// separata instanser INTE har den kollisionen.
const blockListV4 = new net.BlockList();
blockListV4.addSubnet("10.0.0.0", 8, "ipv4");
blockListV4.addSubnet("127.0.0.0", 8, "ipv4");
blockListV4.addSubnet("0.0.0.0", 8, "ipv4");
blockListV4.addSubnet("169.254.0.0", 16, "ipv4"); // inkl. molnmetadata-IP:t 169.254.169.254
blockListV4.addSubnet("172.16.0.0", 12, "ipv4");
blockListV4.addSubnet("192.168.0.0", 16, "ipv4");
blockListV4.addSubnet("100.64.0.0", 10, "ipv4"); // CGNAT

const blockListV6 = new net.BlockList();
blockListV6.addSubnet("::1", 128, "ipv6"); // loopback
blockListV6.addSubnet("::", 128, "ipv6"); // ospecificerad
blockListV6.addSubnet("fc00::", 7, "ipv6"); // unique local (fc00::/7 — hela intervallet, inte bara fc00-prefixet)
blockListV6.addSubnet("fe80::", 10, "ipv6"); // link-local (fe80::/10 — hela intervallet, inte bara fe80-prefixet)
blockListV6.addSubnet("ff00::", 8, "ipv6"); // multicast
blockListV6.addSubnet("64:ff9b::", 96, "ipv6"); // NAT64
blockListV6.addSubnet("100::", 64, "ipv6"); // discard-only

// Extraherar en inbäddad IPv4-adress ur en IPv4-mapped IPv6-adress, i BÅDA
// textformerna DNS kan returnera dem i: "::ffff:169.254.169.254" (dotted)
// och "::ffff:a9fe:a9fe" (hex-grupper — samma adress, annan notation).
function ipv4FranMapped(adress) {
  const dotted = adress.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (dotted) return dotted[1];
  const hex = adress.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (hex) {
    const a = parseInt(hex[1], 16), b = parseInt(hex[2], 16);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    return [(a >> 8) & 0xff, a & 0xff, (b >> 8) & 0xff, b & 0xff].join(".");
  }
  return null;
}

function arPrivatAdress(address, family) {
  if (family === 4) return blockListV4.check(address, "ipv4");
  if (blockListV6.check(address, "ipv6")) return true;
  const mapped = ipv4FranMapped(address.toLowerCase());
  return mapped ? blockListV4.check(mapped, "ipv4") : false;
}

// Snabb, synkron formatkontroll — filtrerar bort uppenbart olämpliga URL:er
// innan någon nätverkstrafik görs (http://, javascript:, IPv4/IPv6-literaler, "localhost").
export function harRimligtVardformat(url) {
  if (url.protocol !== "https:") return false;
  const h = url.hostname;
  if (!h || h.startsWith("[")) return false; // IPv6-literal i URL
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return false; // IPv4-literal
  if (!h.includes(".")) return false; // t.ex. "localhost"
  return true;
}

// DNS-uppslag + val av EN specifik säker adress att pinna anslutningen till.
// Att bara validera med dns.lookup() och sedan låta fetch()/https.request()
// göra ett EGET nytt uppslag är en TOCTOU-lucka (DNS-rebinding): svaret kan
// hinna ändras mellan kontrollen och den faktiska anslutningen. Genom att
// koppla upp mot exakt den adress vi själva validerat elimineras luckan.
async function hittaSakerAdress(hostname) {
  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    return null;
  }
  return addresses.find((a) => !arPrivatAdress(a.address, a.family)) ?? null;
}

// Ett enskilt hopp — ansluter till den pinnade IP-adressen men behåller det
// riktiga värdnamnet för TLS SNI/certifikatvalidering (servername) och
// HTTP Host-headern, annars skulle anslutningen antingen misslyckas mot
// CDN-frontade sajter eller läcka fel certifikat.
function hamtaEttHopp(url, safeAddress, signal) {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: safeAddress.address,
        family: safeAddress.family,
        servername: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: "GET",
        headers: {
          Host: url.hostname,
          "User-Agent": "Mozilla/5.0 (compatible; DebattAI/1.0; +https://www.debatt-ai.se)",
        },
        signal,
      },
      (res) => resolve({ res })
    );
    req.on("error", (e) => resolve({ fel: e.name === "AbortError" ? "timeout" : "fetch_fel" }));
    req.end();
  });
}

async function lasBegransat(res, maxBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of res) {
    total += chunk.length;
    if (total > maxBytes) { res.destroy(); break; }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).subarray(0, maxBytes).toString("utf-8");
}

async function hamtaArtikelHtml(startUrl) {
  // EN gemensam timeout-budget för HELA operationen (alla hopp + hela
  // bodyläsningen) — att bara skydda anslutningsfasen och sedan rensa
  // timeouten så fort svarshuvudena kommit in lämnar en långsamt
  // dröppelmatad body helt oskyddad mot en frusen/hängande koppling.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let current = startUrl;
    for (let i = 0; i <= MAX_REDIRECTS; i++) {
      if (!harRimligtVardformat(current)) return { fel: "otillåten_url" };

      const safeAddress = await hittaSakerAdress(current.hostname);
      if (!safeAddress) return { fel: "otillåten_url" };

      const { res, fel } = await hamtaEttHopp(current, safeAddress, controller.signal);
      if (fel) return { fel };

      if (res.statusCode >= 300 && res.statusCode < 400) {
        const loc = res.headers.location;
        res.resume(); // dränera svaret så sockeln frigörs innan nästa hopp
        if (!loc) return { fel: "redirect_utan_mal" };
        try { current = new URL(loc, current); } catch { return { fel: "ogiltig_redirect" }; }
        continue;
      }
      if (res.statusCode < 200 || res.statusCode >= 300) { res.resume(); return { fel: `http_${res.statusCode}` }; }

      const contentType = res.headers["content-type"] || "";
      if (!contentType.includes("text/html")) { res.resume(); return { fel: "fel_content_type" }; }

      const contentLength = parseInt(res.headers["content-length"] || "0", 10);
      if (contentLength && contentLength > MAX_BODY_BYTES) { res.resume(); return { fel: "for_stor" }; }

      const html = await lasBegransat(res, MAX_BODY_BYTES);
      return { html, slutgiltigUrl: current.toString() };
    }
    return { fel: "for_manga_redirects" };
  } catch (e) {
    return { fel: e.name === "AbortError" ? "timeout" : "fetch_fel" };
  } finally {
    clearTimeout(timeout);
  }
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
  const ogSiteName =
    extraheraMeta(html, /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)["']/i) ||
    extraheraMeta(html, /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:site_name["']/i);

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

  return {
    titel,
    sammanfattning: sammanfattning.slice(0, SAMMANFATTNING_MAX),
    kalla: ogSiteName.slice(0, KALLA_MAX),
  };
}

// Fallback när sidan saknar og:site_name — härleder ett läsbart källnamn ur
// värdnamnet ("omni.se" -> "Omni", "www.svt.se" -> "Svt"). Ofullständigt för
// versaliseringskänsliga förkortningar, men bättre än att visa den råa URL:en
// eller en generisk platshållare.
function kallaFranHostname(hostname) {
  const forsta = hostname.replace(/^www\./i, "").split(".")[0] || hostname;
  return forsta.charAt(0).toUpperCase() + forsta.slice(1);
}

export const PUBLIKA_FEL = {
  otillåten_url: "Den här webbadressen kan inte hämtas",
  fel_content_type: "Länken är inte en vanlig webbsida",
  for_stor: "Sidan är för stor",
};

/**
 * Validerar och hämtar en artikel-URL server-side med SSRF-skydd, extraherar
 * titel + sammanfattning + källnamn (og:site_name, annars härlett ur
 * värdnamnet). Returnerar antingen
 * { ok: true, titel, sammanfattning, kalla, url } eller { ok: false, fel, publiktFel }.
 */
export async function hamtaArtikelInnehall(urlStr) {
  let parsed;
  try {
    parsed = new URL(urlStr.trim());
  } catch {
    return { ok: false, fel: "ogiltig_url", publiktFel: "Ogiltig URL" };
  }

  if (!harRimligtVardformat(parsed)) {
    // Skild felkod från hamtaArtikelHtml()s interna "otillåten_url" (t.ex. en
    // redirect som slutar på en privat IP) — den ursprungliga routen gav 400
    // för det HÄR (uppenbart felformaterad indata) men 502 för det andra
    // (nätverksvalideringen misslyckades efter att formatet redan godkänts).
    return { ok: false, fel: "url_format", publiktFel: "Bara https-länkar till en vanlig webbadress stöds" };
  }

  const result = await hamtaArtikelHtml(parsed);
  if (result.fel) {
    return { ok: false, fel: result.fel, publiktFel: PUBLIKA_FEL[result.fel] || "Kunde inte hämta artikeln" };
  }

  const { titel, sammanfattning, kalla } = extraheraArtikel(result.html);
  if (!sammanfattning) {
    return { ok: false, fel: "ingen_text", publiktFel: "Hittade ingen läsbar text på sidan" };
  }

  // Slutgiltig URL (efter ev. redirects) används för hostname-fallbacken —
  // annars hade en redirect från en förkortningstjänst till den riktiga
  // sajten kunnat ge fel källnamn.
  let hostnameFallback = parsed.hostname;
  try { hostnameFallback = new URL(result.slutgiltigUrl).hostname; } catch {}

  return {
    ok: true,
    titel: titel || null,
    sammanfattning,
    kalla: kalla || kallaFranHostname(hostnameFallback),
    url: result.slutgiltigUrl,
  };
}
