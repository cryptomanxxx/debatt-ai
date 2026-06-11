import { NextResponse } from "next/server";

const SB_URL  = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY  = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

export async function POST(req) {
  const { zon_id, besokare_id, display_name } = await req.json();

  if (!zon_id || !besokare_id || !display_name) {
    return NextResponse.json({ error: "Saknade fält" }, { status: 400 });
  }
  if (!display_name.startsWith("Besökare-")) {
    return NextResponse.json({ error: "Ogiltigt besökarnamn" }, { status: 400 });
  }

  // Hämta zon
  const zr = await sb(`mark_zoner?id=eq.${zon_id}&select=id,namn,koppris`);
  if (!zr.ok) return NextResponse.json({ error: "Databasfel" }, { status: 500 });
  const zoner = await zr.json();
  if (!zoner.length) return NextResponse.json({ error: "Zon hittades inte" }, { status: 404 });
  const zon = zoner[0];

  // Kontrollera att zonen inte är ägd
  const ar = await sb(`mark_agare?zon_id=eq.${zon_id}&select=id`);
  const agare = ar.ok ? await ar.json() : [];
  if (agare.length) return NextResponse.json({ error: "Zonen är redan ägd" }, { status: 409 });

  // Kontrollera att zonen inte är i aktiv auktion
  const auktR = await sb(`mark_auktioner?zon_id=eq.${zon_id}&status=eq.%C3%B6ppen&select=id`);
  const aktiva = auktR.ok ? await auktR.json() : [];
  if (aktiva.length) {
    return NextResponse.json(
      { error: "Zonen är i aktiv auktion — lägg ett bud istället" },
      { status: 409 },
    );
  }

  // Hämta/skapa plånbok
  const wallet = await getOrCreateWallet(besokare_id, display_name);
  if (!wallet) return NextResponse.json({ error: "Kunde inte hämta plånbok" }, { status: 500 });
  if (wallet.saldo < zon.koppris) {
    return NextResponse.json(
      { error: `Otillräckligt saldo — du har ${wallet.saldo} kr, zonen kostar ${zon.koppris} kr` },
      { status: 400 },
    );
  }

  // Skapa ägarpost (kan misslyckas vid race condition — UNIQUE(zon_id))
  const buyR = await sb("mark_agare", {
    method: "POST",
    body: JSON.stringify({ zon_id, agent: display_name, kopt_pris: zon.koppris }),
    prefer: "return=minimal",
  });
  if (!buyR.ok) {
    const err = await buyR.text();
    if (err.includes("duplicate") || err.includes("unique") || err.includes("23505")) {
      return NextResponse.json({ error: "Zonen köptes just av någon annan" }, { status: 409 });
    }
    return NextResponse.json({ error: "Köp misslyckades" }, { status: 500 });
  }

  // Dra saldo
  const nyttSaldo = wallet.saldo - zon.koppris;
  await sb(`visitor_wallets?id=eq.${besokare_id}`, {
    method: "PATCH",
    body: JSON.stringify({ saldo: nyttSaldo, senast_aktiv: new Date().toISOString() }),
    prefer: "return=minimal",
  });

  // Logga transaktion
  await sb("mark_transaktioner", {
    method: "POST",
    body: JSON.stringify({ zon_id, zon_namn: zon.namn, kop_agent: display_name, salj_agent: null, pris: zon.koppris }),
    prefer: "return=minimal",
  });

  return NextResponse.json({ saldo: nyttSaldo, zon_namn: zon.namn, pris: zon.koppris });
}
