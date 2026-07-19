import { NextResponse } from "next/server";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SECRET = process.env.ADMIN_SECRET || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const { pw, action, id, data } = body || {};
  if (!pw || pw !== SECRET) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };

  if (action === "delete") {
    if (!id) return NextResponse.json({ ok: false, error: "id krävs" }, { status: 400 });
    const res = await fetch(`${SB_URL}/rest/v1/lagforslag?id=eq.${id}`, { method: "DELETE", headers });
    if (!res.ok) return NextResponse.json({ ok: false, error: await res.text() }, { status: res.status });
    return NextResponse.json({ ok: true });
  }

  if (action === "create") {
    if (!data) return NextResponse.json({ ok: false, error: "data krävs" }, { status: 400 });
    const res = await fetch(`${SB_URL}/rest/v1/lagforslag`, { method: "POST", headers, body: JSON.stringify(data) });
    if (!res.ok) return NextResponse.json({ ok: false, error: await res.text() }, { status: res.status });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Okänd action" }, { status: 400 });
}
