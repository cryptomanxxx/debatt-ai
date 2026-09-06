// Engångsmigrering: laddar upp public/avatarer/podd/ till Supabase Storage
// (bucket "podd-avatarer", publik) för att minska Vercels Deployment Storage
// — den mappen (45 MB, 58 filer) buntades tidigare in i VARJE deployment.
// Körs via .github/workflows/upload-podd-assets.yml (workflow_dispatch),
// som redan har SUPABASE_SERVICE_ROLE_KEY som secret (samma mönster som
// forskning-test.yml). Body för koden som konsumerar resultatet tas bort
// från public/ och pekas om mot Storage-URL:erna i en uppföljande commit
// — det här skriptet är bara uppladdningssteget.
const fs = require("fs");
const path = require("path");

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const BUCKET = "podd-avatarer";
const LOKAL_MAPP = path.join(__dirname, "..", "public", "avatarer", "podd");

async function skapaBucketOmSaknas(key) {
  const res = await fetch(`${SB_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (res.ok) {
    console.log(`✓ Skapade bucket ${BUCKET}`);
  } else {
    const text = await res.text().catch(() => "");
    // 400/409 = finns redan — inte ett fel
    if (res.status === 400 || res.status === 409) {
      console.log(`  Bucket ${BUCKET} finns redan`);
    } else {
      console.log(`  ⚠ Kunde inte skapa bucket: HTTP ${res.status} ${text.slice(0, 200)}`);
    }
  }
}

async function laddaUppFil(key, filnamn) {
  const filPath = path.join(LOKAL_MAPP, filnamn);
  const bytes = fs.readFileSync(filPath);
  const res = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${filnamn}`, {
    method: "PUT",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "image/png",
      "x-upsert": "true",
    },
    body: bytes,
  });
  return res;
}

async function main() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    console.error("✗ SUPABASE_SERVICE_ROLE_KEY saknas");
    process.exit(1);
  }
  if (!fs.existsSync(LOKAL_MAPP)) {
    console.error(`✗ Lokal mapp saknas: ${LOKAL_MAPP} (redan migrerad och borttagen?)`);
    process.exit(1);
  }

  await skapaBucketOmSaknas(key);

  const filer = fs.readdirSync(LOKAL_MAPP).filter(f => f.endsWith(".png"));
  console.log(`Laddar upp ${filer.length} filer till ${BUCKET}...`);

  let lyckade = 0;
  const misslyckade = [];
  for (const filnamn of filer) {
    const res = await laddaUppFil(key, filnamn);
    if (res.ok) {
      lyckade++;
      console.log(`  ✓ ${filnamn}`);
    } else {
      const text = await res.text().catch(() => "");
      misslyckade.push(filnamn);
      console.log(`  ✗ ${filnamn}: HTTP ${res.status} ${text.slice(0, 150)}`);
    }
  }

  console.log(`\n${lyckade}/${filer.length} uppladdade.`);
  if (misslyckade.length) {
    console.log(`Misslyckades: ${misslyckade.join(", ")}`);
    process.exit(1);
  }
  console.log(`Publik bas-URL: ${SB_URL}/storage/v1/object/public/${BUCKET}/`);
}

main().catch(e => {
  console.error("✗ Oväntat fel:", e);
  process.exit(1);
});
