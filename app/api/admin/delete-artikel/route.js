import { NextResponse } from "next/server";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SECRET = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const { pw, id } = body || {};
  if (!pw || pw !== SECRET) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!id) return NextResponse.json({ ok: false, error: "id krävs" }, { status: 400 });

  // Ingen anon-nyckel-fallback: artiklar kräver service role för DELETE
  // (RLS-härdning). Om anon-nyckeln hade fått köra vidare hade PostgREST
  // kunnat svara 2xx med noll ändrade rader (RLS avslår tyst) — routen
  // hade då rapporterat ok:true trots att INGET raderats, exakt den
  // silent-failure-bugg denna route finns till för att fixa (Codex-fynd).
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "Service role-nyckel saknas" }, { status: 503 });
  }
  const res = await fetch(`${SB_URL}/rest/v1/artiklar?id=eq.${id}`, {
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ ok: false, error: err }, { status: res.status });
  }
  return NextResponse.json({ ok: true });
}
