// POST /api/skicka-in/bild — besökare bifogar en bild till sin människo-
// inlämnade artikel på /skicka-in (SkickaInClient.js). Laddar upp till en
// publik Supabase Storage-bucket (samma mönster som agent-bilder,
// supabase_utils.py → _ladda_upp_till_storage()/_skapa_storage_bucket_om_saknas()
// — service role key, bucket skapas automatiskt vid första uppladdningen om
// den saknas) och returnerar den publika URL:en. bild_url/bild_fotograf
// sparas sedan av klienten på både inlamningar och (vid publicering) artiklar
// — samma två kolumner som redan används av AI-agenternas Pexels-bilder
// (app/api/agent/submit/route.js).
//
// Ingen Turnstile-verifiering här: SkickaInClient.js's enda Turnstile-token
// konsumeras redan av /api/analyze (Cloudflare-token är engångsbruk — att
// verifiera samma token två gånger hade fått den andra verifieringen att
// misslyckas). Skyddas istället av rate limit + strikt filvalidering, samma
// avvägning som /api/nyhetsflode/importera redan gör för ett jämförbart
// besökarinnehålls-flöde. checkRateLimit() är in-memory per serverless-
// instans (se lib/kanalRateLimit.js) — samma dokumenterade begränsning som
// alla andra rate-limiterade routes i den här kodbasen, inte unikt för
// denna. En riktig delad/durabel rate limiter är en separat, större
// avvägning som inte görs ensidigt bara för den här endpointen.
//
// DELETE /api/skicka-in/bild {url, token} — tar bort en uppladdad men aldrig
// kopplad bild igen (klickad "✕ Ta bort" innan artikeln skickats in, eller
// en bild som ersätts med en ny). Kräver ett HMAC-baserat raderingstoken som
// POST-svaret gav tillbaka vid uppladdningen — INTE bara URL:en. En publik
// Storage-URL är per definition delad (den visas i artikeltexten, kan synas
// i referrer-headers, skärmdumpar m.m.), så att låta den fungera som egen
// behörighet hade gjort vem som helst som ser bilden till en potentiell
// raderare. Token = HMAC-SHA256(filnamn) nyckad med SUPABASE_SERVICE_ROLE_KEY
// (HMAC_SECRET nedan) — MEDVETET aldrig anon-nyckeln, som är synlig för
// klienten och därför skulle göra token förfalskningsbart om den användes
// (se HMAC_SECRET-kommentaren nedan) — och jämförs tidskonstant
// (timingSafeEqual). Saknas den privata nyckeln svarar både POST och DELETE
// 503 istället för att falla tillbaka på ett svagare skydd.
// Kompletteras av cleanup_lasarbilder.py (körs periodiskt via GitHub Actions)
// som städar bort bilder ingen någonsin kopplade till en inlämning alls —
// t.ex. om besökaren stänger fliken direkt efter uppladdning utan att
// klicka "✕ Ta bort".
import { createHmac, timingSafeEqual } from "crypto";
import { checkRateLimit } from "../../../lib/kanalRateLimit";
import { logFel, getIp } from "../../../lib/logFel";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_WRITE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_ANON_KEY;

// Nyckel för raderingstoken — MEDVETET utan fallback till anon-nyckeln.
// NEXT_PUBLIC_SUPABASE_ANON_KEY är per definition synlig för klienten (den
// bäddas in i webbläsarbunten), så om den någonsin använts som HMAC-nyckel
// hade vem som helst kunnat räkna ut ett giltigt raderingstoken för valfritt
// filnamn själva — HMAC-SHA256(filnamn, anon-nyckel) kräver bara att man
// känner till nyckeln, och den nyckeln är redan offentlig. Bara den privata
// SUPABASE_SERVICE_ROLE_KEY (server-only, aldrig skickad till klienten) får
// nyckla token. Saknas den misslyckas uppladdning/radering hellre helt
// (503, se nedan) än att tyst falla tillbaka på en osäker nyckel.
const HMAC_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const BUCKET = "lasarbilder";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const TILLATNA_TYPER = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// UUID (från crypto.randomUUID()) + en av de tre tillåtna filändelserna —
// exakt det format den här routen själv genererar vid uppladdning. Används
// både för att validera DELETE-anrop (skydd mot path traversal/godtyckliga
// Storage-nycklar) och kan återanvändas av framtida verktyg som behöver
// känna igen ett giltigt lasarbilder-filnamn.
const FILNAMN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i;

// Kontrollerar filens FAKTISKA innehåll (magic bytes) mot det Content-Type
// klienten påstod — multipart-headern är obekräftad metadata och kan sättas
// till vad som helst av en anropare som pratar direkt mot API:et förbi
// webbläsarens filväljare. En godtycklig binärfil (eller HTML/JS) omdöpt/
// deklarerad som en bild hade annars lagrats och serverats publikt under en
// image/*-etikett. Kollar bara de första byten (headers), inte hela filens
// giltighet — tillräckligt för att stoppa enkel typ-spoofing, inte en
// fullständig bildvalidering.
function filSignaturMatchar(bytes, contentType) {
  if (contentType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === "image/png") {
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= sig.length && sig.every((b, i) => bytes[i] === b);
  }
  if (contentType === "image/webp") {
    return (
      bytes.length >= 12 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // "RIFF"
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // "WEBP"
    );
  }
  return false;
}

// Raderingstoken = HMAC-SHA256(filnamn) nyckad med HMAC_SECRET (den privata
// SUPABASE_SERVICE_ROLE_KEY, aldrig anon-nyckeln). Genereras vid uppladdning
// och skickas tillbaka i POST-svaret; DELETE kräver att klienten skickar
// tillbaka exakt detta token — inte bara URL:en (se filhuvudkommentaren ovan
// för motivering).
function delningsToken(filnamn) {
  return createHmac("sha256", HMAC_SECRET).update(filnamn).digest("hex");
}

function tokenMatchar(filnamn, token) {
  if (!HMAC_SECRET) return false;
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/i.test(token)) return false;
  const forvantad = delningsToken(filnamn);
  return timingSafeEqual(Buffer.from(token.toLowerCase(), "hex"), Buffer.from(forvantad, "hex"));
}

async function skapaBucketOmSaknas() {
  try {
    await fetch(`${SB_URL}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        apikey: SB_WRITE_KEY,
        Authorization: `Bearer ${SB_WRITE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
    });
  } catch {}
}

async function laddaUpp(bytes, contentType, filnamn) {
  return fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${filnamn}`, {
    method: "PUT",
    headers: {
      apikey: SB_WRITE_KEY,
      Authorization: `Bearer ${SB_WRITE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: bytes,
  });
}

export async function POST(req) {
  const ip = getIp(req);
  if (!HMAC_SECRET) {
    // Utan en privat servernyckel kan vi inte utfärda ett meningsfullt
    // raderingstoken (se HMAC_SECRET-kommentaren ovan) — fail closed hellre
    // än att generera ett token som skulle behöva nyckla på anon-nyckeln.
    logFel({
      kalla: "skicka-in/bild",
      feltyp: "saknad_service_role_key",
      meddelande: "SUPABASE_SERVICE_ROLE_KEY saknas — kan inte utfärda raderingstoken",
      ip,
    });
    return Response.json(
      { fel: "Bilduppladdning är tillfälligt otillgänglig." },
      { status: 503 }
    );
  }
  const rl = checkRateLimit(req, "skicka-in-bild", 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return Response.json(
      { fel: "För många bilduppladdningar — försök igen om en stund." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let form;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ fel: "Ogiltig förfrågan." }, { status: 400 });
  }

  const fil = form.get("bild");
  if (!fil || typeof fil === "string") {
    return Response.json({ fel: "Ingen bild bifogad." }, { status: 400 });
  }

  const ext = TILLATNA_TYPER[fil.type];
  if (!ext) {
    return Response.json({ fel: "Bilden måste vara JPG, PNG eller WEBP." }, { status: 400 });
  }
  if (fil.size > MAX_BYTES) {
    return Response.json({ fel: "Bilden är för stor (max 5 MB)." }, { status: 413 });
  }

  const bytes = Buffer.from(await fil.arrayBuffer());
  if (!filSignaturMatchar(bytes, fil.type)) {
    return Response.json({ fel: "Filen verkar inte vara en giltig bild." }, { status: 400 });
  }
  const filnamn = `${crypto.randomUUID()}.${ext}`;

  let res = await laddaUpp(bytes, fil.type, filnamn);
  if (!res.ok && (res.status === 400 || res.status === 404)) {
    // Bucket saknas troligen — skapa den och försök en gång till, samma
    // mönster som Python-motsvarigheten för agent-bilder.
    await skapaBucketOmSaknas();
    res = await laddaUpp(bytes, fil.type, filnamn);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    logFel({
      kalla: "skicka-in/bild",
      feltyp: "supabase_fail",
      meddelande: `HTTP ${res.status}`,
      ip,
      extra: { errText: errText.slice(0, 300) },
    });
    return Response.json({ fel: "Uppladdningen misslyckades." }, { status: 500 });
  }

  return Response.json({
    url: `${SB_URL}/storage/v1/object/public/${BUCKET}/${filnamn}`,
    token: delningsToken(filnamn),
  });
}

export async function DELETE(req) {
  if (!HMAC_SECRET) {
    // Samma fail-closed-princip som POST: utan den privata nyckeln kan inget
    // token någonsin verifieras korrekt, så vi vägrar radera överhuvudtaget
    // istället för att falla tillbaka på ett svagare (eller inget) skydd.
    logFel({
      kalla: "skicka-in/bild",
      feltyp: "saknad_service_role_key",
      meddelande: "SUPABASE_SERVICE_ROLE_KEY saknas — kan inte verifiera raderingstoken",
      ip: getIp(req),
    });
    return Response.json(
      { fel: "Bildradering är tillfälligt otillgänglig." },
      { status: 503 }
    );
  }
  const rl = checkRateLimit(req, "skicka-in-bild-delete", 20, 60 * 60 * 1000);
  if (!rl.ok) {
    return Response.json(
      { fel: "För många förfrågningar — försök igen om en stund." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ fel: "Ogiltig förfrågan." }, { status: 400 });
  }

  const url = typeof body?.url === "string" ? body.url : "";
  const prefix = `${SB_URL}/storage/v1/object/public/${BUCKET}/`;
  if (!url.startsWith(prefix)) {
    return Response.json({ fel: "Ogiltig bild-URL." }, { status: 400 });
  }
  const filnamn = url.slice(prefix.length);
  if (!FILNAMN_RE.test(filnamn)) {
    return Response.json({ fel: "Ogiltigt filnamn." }, { status: 400 });
  }
  if (!tokenMatchar(filnamn, body?.token)) {
    return Response.json({ fel: "Ogiltig raderingstoken." }, { status: 403 });
  }

  try {
    const res = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${filnamn}`, {
      method: "DELETE",
      headers: { apikey: SB_WRITE_KEY, Authorization: `Bearer ${SB_WRITE_KEY}` },
    });
    if (!res.ok) {
      logFel({
        kalla: "skicka-in/bild",
        feltyp: "supabase_delete_fail",
        meddelande: `HTTP ${res.status}`,
        ip: getIp(req),
      });
    }
  } catch {}

  // Alltid ok mot klienten — det är ett best-effort-städanrop (klienten har
  // redan tagit bort bilden ur sin egen UI oavsett), och cleanup_lasarbilder.py
  // städar upp allt som faktiskt blir kvar föräldralöst i bucketen.
  return Response.json({ ok: true });
}
