import crypto from "crypto";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function sbHeaders() {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function hashIp(ip) {
  return crypto.createHash("sha256").update(ip + "val-salt-2025").digest("hex").slice(0, 32);
}

function getIp(req) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req) {
  const body = await req.json().catch(() => null);
  if (!body?.parti || !body?.val_id) {
    return Response.json({ error: "Saknar parti eller val_id" }, { status: 400 });
  }

  const valId = parseInt(body.val_id);
  const parti = String(body.parti).trim();
  if (!valId || !parti) return Response.json({ error: "Ogiltiga värden" }, { status: 400 });

  // Verify election is active
  const valRes = await fetch(
    `${SB_URL}/rest/v1/riksdagsval?id=eq.${valId}&status=eq.aktiv&select=id,partier`,
    { headers: sbHeaders() }
  );
  if (!valRes.ok) return Response.json({ error: "DB-fel" }, { status: 502 });
  const vals = await valRes.json();
  if (!vals.length) return Response.json({ error: "Inget aktivt val med detta id" }, { status: 404 });

  const partier = vals[0].partier || [];
  const partinOmn = partier.map(p => p.namn);
  if (!partinOmn.includes(parti)) {
    return Response.json({ error: "Okänt parti" }, { status: 400 });
  }

  const ipHash = hashIp(getIp(req));

  // Insert vote — UNIQUE(val_id, ip_hash) prevents double voting
  const rostRes = await fetch(`${SB_URL}/rest/v1/val_roster`, {
    method: "POST",
    headers: sbHeaders(),
    body: JSON.stringify({ val_id: valId, parti, ip_hash: ipHash, kalla: "manniska" }),
  });

  if (rostRes.status === 409) {
    return Response.json({ error: "Du har redan röstat i detta val." }, { status: 409 });
  }
  if (!rostRes.ok) {
    const txt = await rostRes.text();
    console.error("val-rost insert fel:", rostRes.status, txt);
    return Response.json({ error: "Kunde inte spara röst" }, { status: 502 });
  }

  // Return updated vote counts split by kalla
  const countRes = await fetch(
    `${SB_URL}/rest/v1/val_roster?val_id=eq.${valId}&select=parti,kalla`,
    { headers: sbHeaders() }
  );
  const roster = countRes.ok ? await countRes.json() : [];
  const counts = {};
  const humanCounts = {};
  const aiCounts = {};
  for (const r of roster) {
    counts[r.parti] = (counts[r.parti] || 0) + 1;
    if (r.kalla === "ai") {
      aiCounts[r.parti] = (aiCounts[r.parti] || 0) + 1;
    } else {
      humanCounts[r.parti] = (humanCounts[r.parti] || 0) + 1;
    }
  }

  return Response.json({ ok: true, counts, humanCounts, aiCounts });
}
