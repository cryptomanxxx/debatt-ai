import { NextResponse } from "next/server";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SECRET = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const { pw, id, changes } = body || {};
  if (!pw || pw !== SECRET) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!id || !changes) return NextResponse.json({ ok: false, error: "id och changes krävs" }, { status: 400 });

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const res = await fetch(`${SB_URL}/rest/v1/markets?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(changes),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ ok: false, error: err }, { status: res.status });
  }
  return NextResponse.json({ ok: true });
}
