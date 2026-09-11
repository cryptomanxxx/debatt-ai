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
// besökarinnehålls-flöde.
import { checkRateLimit } from "../../../lib/kanalRateLimit";
import { logFel, getIp } from "../../../lib/logFel";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_WRITE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SB_ANON_KEY;

const BUCKET = "lasarbilder";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const TILLATNA_TYPER = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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

  return Response.json({ url: `${SB_URL}/storage/v1/object/public/${BUCKET}/${filnamn}` });
}
