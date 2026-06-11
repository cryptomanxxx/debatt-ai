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
  const { zon_id, reservpris, besokare_id, display_name } = await req.json();

  if (!zon_id || !reservpris || !besokare_id || !display_name) {
    return NextResponse.json({ error: "Saknade fält" }, { status: 400 });
  }
  if (!display_name.startsWith("Besökare-")) {
    return NextResponse.json({ error: "Ogiltigt besökarnamn" }, { status: 400 });
  }
  if (!Number.isInteger(reservpris) || reservpris < 50) {
    return NextResponse.json({ error: "Reservpriset måste vara minst 50 kr" }, { status: 400 });
  }

  // Verifiera att besokare_id matchar display_name i visitor_wallets (förhindrar identity spoofing)
  const walletR = await sb(`visitor_wallets?id=eq.${besokare_id}&display_name=eq.${encodeURIComponent(display_name)}&select=id`);
  const walletRows = walletR.ok ? await walletR.json() : [];
  if (!walletRows.length) {
    return NextResponse.json({ error: "Ogiltig identitet" }, { status: 403 });
  }

  // Kontrollera att besökaren äger zonen
  const agareR = await sb(
    `mark_agare?zon_id=eq.${zon_id}&agent=eq.${encodeURIComponent(display_name)}&select=id`,
  );
  const agare = agareR.ok ? await agareR.json() : [];
  if (!agare.length) {
    return NextResponse.json({ error: "Du äger inte den här zonen" }, { status: 403 });
  }

  // Kontrollera att ingen aktiv auktion redan finns
  const existR = await sb(`mark_auktioner?zon_id=eq.${zon_id}&status=eq.%C3%B6ppen&select=id`);
  const exist  = existR.ok ? await existR.json() : [];
  if (exist.length) {
    return NextResponse.json({ error: "Zonen är redan i aktiv auktion" }, { status: 409 });
  }

  // Skapa 24h-auktion
  const stanger = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  const cr = await sb("mark_auktioner", {
    method: "POST",
    body: JSON.stringify({
      zon_id,
      saljare: display_name,
      reservpris,
      nuv_bud: null,
      hogst_budgivare: null,
      stanger_at: stanger,
      status: "öppen",
    }),
    prefer: "return=minimal",
  });
  if (!cr.ok) return NextResponse.json({ error: "Kunde inte skapa auktion" }, { status: 500 });

  return NextResponse.json({ ok: true, stanger_at: stanger });
}
