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

  const { besokare_id, display_name, order_id } = body;

  if (!besokare_id || !display_name || !order_id)
    return NextResponse.json({ error: "Saknade fält" }, { status: 400 });
  if (!display_name.startsWith("Besökare-"))
    return NextResponse.json({ error: "Ogiltigt besökarnamn" }, { status: 400 });

  // Verifiera att besokare_id faktiskt tillhör display_name (förhindrar spoofing)
  const walletR = await sb(`visitor_wallets?id=eq.${besokare_id}&display_name=eq.${encodeURIComponent(display_name)}&select=id,saldo`);
  if (!walletR.ok) return NextResponse.json({ error: "Databasfel" }, { status: 500 });
  const wallets = await walletR.json();
  if (!wallets.length) return NextResponse.json({ error: "Ogiltig identitet" }, { status: 403 });
  const wallet = wallets[0];

  // Hämta ordern och verifiera ägarskap
  const orderR = await sb(`mark_kop_ordrar?id=eq.${order_id}&select=*`);
  if (!orderR.ok) return NextResponse.json({ error: "Databasfel" }, { status: 500 });
  const orders = await orderR.json();
  if (!orders.length) return NextResponse.json({ error: "Order hittades inte" }, { status: 404 });
  const order = orders[0];

  if (order.kop_agent !== display_name)
    return NextResponse.json({ error: "Inte din order" }, { status: 403 });
  if (order.status !== "öppen")
    return NextResponse.json({ error: "Ordern är inte längre öppen" }, { status: 400 });

  // Atomisk statusövergång: filtret status=eq.öppen förhindrar double-cancel vid parallella anrop
  const cancelR = await sb(`mark_kop_ordrar?id=eq.${order_id}&status=eq.%C3%B6ppen`, {
    method: "PATCH",
    body: JSON.stringify({ status: "avbruten" }),
    prefer: "return=representation",
  });
  if (!cancelR.ok) return NextResponse.json({ error: "Kunde inte avbryta ordern" }, { status: 500 });
  const cancelled = await cancelR.json();
  if (!Array.isArray(cancelled) || cancelled.length === 0)
    return NextResponse.json({ error: "Ordern är inte längre öppen" }, { status: 409 });

  // Återbetala reserverat belopp — om detta misslyckas återöppnar vi ordern
  const reserverat = parseInt(order.reserverat_kr) || 0;
  let nyttSaldo = null;
  if (reserverat > 0) {
    nyttSaldo = wallet.saldo + reserverat;
    const refundR = await sb(`visitor_wallets?id=eq.${besokare_id}`, {
      method: "PATCH",
      body: JSON.stringify({ saldo: nyttSaldo, senast_aktiv: new Date().toISOString() }),
      prefer: "return=minimal",
    });
    if (!refundR.ok) {
      // Återöppna ordern så att reservationen inte går förlorad
      await sb(`mark_kop_ordrar?id=eq.${order_id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "öppen" }),
        prefer: "return=minimal",
      }).catch(() => {});
      return NextResponse.json({ error: "Återbetalning misslyckades — ordern är fortfarande öppen" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, refunded: reserverat, saldo: nyttSaldo });
}
