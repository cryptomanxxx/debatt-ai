import { checkRateLimit } from "../../lib/kanalRateLimit";
import { logFel, getIp } from "../../lib/logFel";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const readHdrs = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
const writeHdrs = { ...readHdrs, "Content-Type": "application/json", "Prefer": "return=minimal" };

async function getCount(agent) {
  const r = await fetch(
    `${SB_URL}/rest/v1/koalitioner?agent=eq.${encodeURIComponent(agent)}&select=foljare`,
    { headers: readHdrs, cache: "no-store" }
  );
  if (!r.ok) return null;
  const data = await r.json();
  return data?.[0]?.foljare ?? 0;
}

async function setCount(agent, val) {
  const r = await fetch(
    `${SB_URL}/rest/v1/koalitioner?agent=eq.${encodeURIComponent(agent)}`,
    { method: "PATCH", headers: writeHdrs, body: JSON.stringify({ foljare: val }) }
  );
  return r.ok;
}

// GET: fresh follower counts (bypasses SSR cache)
export async function GET() {
  const r = await fetch(
    `${SB_URL}/rest/v1/koalitioner?select=agent,foljare&order=foljare.desc`,
    { headers: readHdrs, cache: "no-store" }
  );
  const data = r.ok ? await r.json() : [];
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}

// POST: join or switch coalition
// Body: { agent: string, previousAgent?: string }
export async function POST(req) {
  const ip = getIp(req);
  const rl = checkRateLimit(req, "koalition", 10, 60 * 60 * 1000);
  if (!rl.ok) return Response.json({ error: "Too many requests" }, { status: 429 });

  const { agent, previousAgent } = await req.json().catch(() => ({}));
  if (!agent || typeof agent !== "string") {
    return Response.json({ error: "agent required" }, { status: 400 });
  }

  // Decrement previous agent if switching
  if (previousAgent && previousAgent !== agent) {
    const prev = await getCount(previousAgent);
    if (prev !== null) await setCount(previousAgent, Math.max(0, prev - 1));
  }

  // Increment new agent
  const current = await getCount(agent);
  if (current === null) {
    logFel({ kalla: "api/koalition POST", feltyp: "db_error", meddelande: `agent not found: ${agent}`, ip });
    return Response.json({ error: "agent not found" }, { status: 500 });
  }
  const ok = await setCount(agent, current + 1);
  if (!ok) {
    logFel({ kalla: "api/koalition POST", feltyp: "db_error", meddelande: "patch failed", ip });
    return Response.json({ error: "db error" }, { status: 500 });
  }

  return Response.json({ ok: true });
}

// DELETE: leave coalition
// Body: { agent: string }
export async function DELETE(req) {
  const ip = getIp(req);
  const { agent } = await req.json().catch(() => ({}));
  if (!agent || typeof agent !== "string") {
    return Response.json({ error: "agent required" }, { status: 400 });
  }

  const current = await getCount(agent);
  if (current === null) return Response.json({ error: "agent not found" }, { status: 500 });
  await setCount(agent, Math.max(0, current - 1));

  return Response.json({ ok: true });
}
