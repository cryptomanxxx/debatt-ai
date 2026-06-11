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

const GILTIGA_VAROR = ["el", "spannmål", "maskiner", "malm", "tjänster", "fisk", "virke", "mjöl", "stål"];

export async function POST(req) {
  const { vara, antal, reservpris, besokare_id, display_name } = await req.json();

  if (!vara || !antal || !reservpris || !besokare_id || !display_name) {
    return NextResponse.json({ error: "Saknade fält" }, { status: 400 });
  }
  if (!display_name.startsWith("Besökare-")) {
    return NextResponse.json({ error: "Ogiltigt besökarnamn" }, { status: 400 });
  }
  if (!GILTIGA_VAROR.includes(vara)) {
    return NextResponse.json({ error: "Okänd vara" }, { status: 400 });
  }
  if (!Number.isInteger(antal) || antal < 1) {
    return NextResponse.json({ error: "Antal måste vara minst 1" }, { status: 400 });
  }
  if (!Number.isInteger(reservpris) || reservpris < 5) {
    return NextResponse.json({ error: "Reservpriset måste vara minst 5 kr" }, { status: 400 });
  }

  // Verifiera att besokare_id matchar display_name
  const walletR = await sb(`visitor_wallets?id=eq.${besokare_id}&display_name=eq.${encodeURIComponent(display_name)}&select=id`);
  const walletRows = walletR.ok ? await walletR.json() : [];
  if (!walletRows.length) {
    return NextResponse.json({ error: "Ogiltig identitet" }, { status: 403 });
  }

  // Verifiera att besökaren har tillräckligt med varan i lagret
  const lagerR = await sb(`mark_lager?agent=eq.${encodeURIComponent(display_name)}&vara=eq.${encodeURIComponent(vara)}&select=antal`);
  const lagerRows = lagerR.ok ? await lagerR.json() : [];
  const harAntal = lagerRows[0]?.antal || 0;
  if (harAntal < antal) {
    return NextResponse.json({ error: `Du har bara ${harAntal} ${vara} i lager` }, { status: 400 });
  }

  // Kontrollera att ingen öppen auktion redan finns för samma säljare + vara
  const cr = await sb('mark_vara_auktioner', {
  method: 'POST',
  body: JSON.stringify({
    saljare: display_name,
    vara,
    antal,
    reservpris,
    nuv_bud: null,
    hogst_budgivare: null,
    stanger_at: stanger,
    status: 'öppen',
  }),
  prefer: 'return=minimal',
  headers: {
    'X-Insert-If-Not-Exists': 'saljare,vara'
  }
});
  const exist = existR.ok ? await existR.json() : [];
  if (exist.length) {
    return NextResponse.json({ error: `Du har redan en öppen auktion för ${vara}` }, { status: 409 });
  }

  // Skapa 24h-auktion — hämta tillbaka id för att kunna hantera race conditions
  const stanger = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  const cr = await sb("mark_vara_auktioner", {
    method: "POST",
    body: JSON.stringify({
      saljare: display_name,
      vara,
      antal,
      reservpris,
      nuv_bud: null,
      hogst_budgivare: null,
      stanger_at: stanger,
      status: "öppen",
    }),
  });
  if (!cr.ok) {
    const err = await cr.text();
    console.error("salj-vara insert error:", err);
    return NextResponse.json({ error: "Kunde inte skapa auktion" }, { status: 500 });
  }
  const inserted = await cr.json();
  const newId = (Array.isArray(inserted) ? inserted[0] : inserted)?.id;

  // Race condition-skydd: om en parallell request smet in och skapade en auktion samtidigt
  // (t.ex. dubbel-submit från två flikar) — behåll den med lägst id, cancel vår om vi förlorade.
  if (newId) {
    const dupeR = await sb(
      `mark_vara_auktioner?saljare=eq.${encodeURIComponent(display_name)}&vara=eq.${encodeURIComponent(vara)}&status=eq.%C3%B6ppen&select=id&order=id.asc&limit=2`
    );
    const dupes = dupeR.ok ? await dupeR.json() : [];
    if (dupes.length > 1 && dupes[0].id !== newId) {
      await sb(`mark_vara_auktioner?id=eq.${newId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "inställd" }),
        prefer: "return=minimal",
      });
      return NextResponse.json({ error: `Du har redan en öppen auktion för ${vara}` }, { status: 409 });
    }
  }

  return NextResponse.json({ ok: true, vara, antal, reservpris, stanger_at: stanger });
}
