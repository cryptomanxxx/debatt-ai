import { NextResponse } from "next/server";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function sb(path, opts = {}) {
  const { prefer = "return=representation", ...rest } = opts;
  return fetch(`${SB_URL}/rest/v1/${path}`, {
    ...rest,
    headers: {
      apikey: SB_KEY(),
      Authorization: `Bearer ${SB_KEY()}`,
      "Content-Type": "application/json",
      Prefer: prefer,
      ...rest.headers,
    },
  });
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 }); }

  const { auktion_id, besokare_id, display_name } = body;

  if (!auktion_id || !besokare_id || !display_name)
    return NextResponse.json({ error: "Saknade fält" }, { status: 400 });
  if (!display_name.startsWith("Besökare-"))
    return NextResponse.json({ error: "Ogiltigt besökarnamn" }, { status: 400 });

  // Verifiera att besokare_id faktiskt tillhör display_name (förhindrar spoofing)
  const walletR = await sb(`visitor_wallets?id=eq.${besokare_id}&display_name=eq.${encodeURIComponent(display_name)}&select=id`);
  if (!walletR.ok) return NextResponse.json({ error: "Databasfel" }, { status: 500 });
  const wallets = await walletR.json();
  if (!wallets.length) return NextResponse.json({ error: "Ogiltig identitet" }, { status: 403 });

  // Hämta auktionen och verifiera ägarskap
  const auktionR = await sb(`mark_auktioner?id=eq.${auktion_id}&select=id,status,saljare,nuv_bud`);
  if (!auktionR.ok) return NextResponse.json({ error: "Databasfel" }, { status: 500 });
  const auktioner = await auktionR.json();
  if (!auktioner.length) return NextResponse.json({ error: "Auktionen hittades inte" }, { status: 404 });
  const auktion = auktioner[0];

  if (auktion.saljare !== display_name)
    return NextResponse.json({ error: "Inte din auktion" }, { status: 403 });
  if (auktion.status !== "öppen")
    return NextResponse.json({ error: "Auktionen är inte längre öppen" }, { status: 400 });
  if (auktion.nuv_bud)
    return NextResponse.json({ error: "Kan inte avbryta — det finns redan ett bud" }, { status: 400 });

  // Atomisk statusövergång: filtret status=eq.öppen förhindrar double-cancel
  const cancelR = await sb(`mark_auktioner?id=eq.${auktion_id}&status=eq.%C3%B6ppen`, {
    method: "PATCH",
    body: JSON.stringify({ status: "inställd" }),
    prefer: "return=representation",
  });
  if (!cancelR.ok) return NextResponse.json({ error: "Kunde inte avbryta auktionen" }, { status: 500 });
  const cancelled = await cancelR.json();
  if (!Array.isArray(cancelled) || cancelled.length === 0)
    return NextResponse.json({ error: "Auktionen är inte längre öppen" }, { status: 409 });

  return NextResponse.json({ ok: true });
}
