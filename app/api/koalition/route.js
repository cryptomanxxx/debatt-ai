import { checkRateLimit } from "../../lib/kanalRateLimit";
import { logFel, getIp } from "../../lib/logFel";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hdrs = () => ({ apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" });

// POST: join or switch coalition
// Body: { agent: string, previousAgent?: string }
export async function POST(req) {
  const ip = getIp(req);
  const rl = checkRateLimit(req, "koalition", 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { agent, previousAgent } = await req.json().catch(() => ({}));
  if (!agent || typeof agent !== "string") {
    return Response.json({ error: "agent required" }, { status: 400 });
  }

  const r = await fetch(`${SB_URL}/rest/v1/rpc/koalition_ga_med`, {
    method: "POST",
    headers: hdrs(),
    body: JSON.stringify({ p_agent: agent, p_previous_agent: previousAgent || null }),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    logFel({ kalla: "api/koalition POST", feltyp: "db_error", meddelande: txt, ip });
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

  const r = await fetch(`${SB_URL}/rest/v1/rpc/koalition_lamna`, {
    method: "POST",
    headers: hdrs(),
    body: JSON.stringify({ p_agent: agent }),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    logFel({ kalla: "api/koalition DELETE", feltyp: "db_error", meddelande: txt, ip });
    return Response.json({ error: "db error" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
