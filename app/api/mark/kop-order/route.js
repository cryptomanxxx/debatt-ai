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

async function getOrCreateWallet(id, display_name) {
  const r = await sb(`visitor_wallets?id=eq.${id}&select=id,saldo`);
  if (!r.ok) return null;
  const rows = await r.json();
  if (rows.length) return rows[0];
  const cr = await sb("visitor_wallets", {
    method: "POST",
    body: JSON.stringify({ id, display_name, saldo: 2000 }),
  });
  if (!cr.ok) return null;
  const d = await cr.json();
  return Array.isArray(d) ? d[0] : d;
}

const VALID_VAROR = ["el", "spannmål", "maskiner", "malm", "tjänster", "fisk", "virke"];
const BASPRIS = { el: 15, spannmål: 10, maskiner: 25, malm: 20, tjänster: 18, fisk: 12, virke: 14 };

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 }); }

  const { besokare_id, display_name, vara, antal, max_pris_per_enhet } = body;

  if (!besokare_id || !display_name)
    return NextResponse.json({ error: "Saknade identitetsuppgifter" }, { status: 400 });
  if (!display_name.startsWith("Besökare-"))
    return NextResponse.json({ error: "Ogiltigt besökarnamn" }, { status: 400 });
  if (!VALID_VAROR.includes(vara))
    return NextResponse.json({ error: "Ogiltig vara" }, { status: 400 });
  if (!Number.isInteger(antal) || antal < 1 || antal > 20)
    return NextResponse.json({ error: "Ogiltigt antal (1–20)" }, { status: 400 });

  const maxPris = Number(max_pris_per_enhet);
  const minAcceptabelt = Math.ceil(BASPRIS[vara] * 0.5);
  if (!maxPris || maxPris < minAcceptabelt)
    return NextResponse.json({ error: `Max pris måste vara minst ${minAcceptabelt} kr/enhet` }, { status: 400 });

  // Verifiera att besokare_id matchar display_name om plånboken redan existerar
  const idCheckR = await sb(`visitor_wallets?id=eq.${besokare_id}&select=id,display_name`);
  const idRows = idCheckR.ok ? await idCheckR.json() : [];
  if (idRows.length && idRows[0].display_name !== display_name)
    return NextResponse.json({ error: "Ogiltig identitet" }, { status: 403 });

  const reserverat_kr = Math.ceil(antal * maxPris);

  // Hämta eller skapa plånbok
  const wallet = await getOrCreateWallet(besokare_id, display_name);
  if (!wallet) return NextResponse.json({ error: "Databasfel vid plånbok" }, { status: 500 });
  if (wallet.saldo < reserverat_kr)
    return NextResponse.json({ error: `Otillräckligt saldo — du har ${wallet.saldo} kr, behöver ${reserverat_kr} kr` }, { status: 400 });

  // Kolla om det redan finns en öppen order på samma vara
  const existR = await sb(
    `mark_kop_ordrar?kop_agent=eq.${encodeURIComponent(display_name)}&vara=eq.${encodeURIComponent(vara)}&status=eq.%C3%B6ppen&select=id&limit=1`
  );
  const existRows = existR.ok ? await existR.json() : [];
  if (existRows.length)
    return NextResponse.json({ error: `Du har redan en öppen köporder på ${vara}` }, { status: 400 });

  // Reservera belopp från plånbok — optimistic locking via saldo=eq.${wallet.saldo}:
  // om ett parallellt anrop ändrat saldo sedan vi läste det träffar filtret 0 rader
  // → klienten uppmanas försöka igen (ingen double-spend möjlig).
  const nyttSaldo = wallet.saldo - reserverat_kr;
  const updateR = await sb(`visitor_wallets?id=eq.${besokare_id}&saldo=eq.${wallet.saldo}`, {
    method: "PATCH",
    body: JSON.stringify({ saldo: nyttSaldo, senast_aktiv: new Date().toISOString() }),
    prefer: "return=representation",
  });
  if (!updateR.ok) return NextResponse.json({ error: "Kunde inte uppdatera saldo" }, { status: 500 });
  const updatedWallets = await updateR.json();
  if (!Array.isArray(updatedWallets) || updatedWallets.length === 0)
    return NextResponse.json({ error: "Saldot ändrades — försök igen" }, { status: 409 });

  // Skapa köporder
  const orderR = await sb("mark_kop_ordrar", {
    method: "POST",
    body: JSON.stringify({ kop_agent: display_name, kop_typ: "besokare", vara, antal, max_pris_per_enhet: maxPris, status: "öppen", reserverat_kr }),
  });

  if (!orderR.ok) {
    // Återställ saldo vid fel
    await sb(`visitor_wallets?id=eq.${besokare_id}`, {
      method: "PATCH",
      body: JSON.stringify({ saldo: wallet.saldo }),
      prefer: "return=minimal",
    }).catch(() => {});
    return NextResponse.json({ error: "Kunde inte skapa köporder" }, { status: 500 });
  }

  const orderData = await orderR.json();
  const order = Array.isArray(orderData) ? orderData[0] : orderData;

  return NextResponse.json({ ok: true, order_id: order?.id, saldo: nyttSaldo, reserverat_kr });
}
