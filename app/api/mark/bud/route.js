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

export async function POST(req) {
  const { auktion_id, belopp, besokare_id, display_name, type = "mark" } = await req.json();

  if (!auktion_id || !belopp || !besokare_id || !display_name) {
    return NextResponse.json({ error: "Saknade fält" }, { status: 400 });
  }
  if (!display_name.startsWith("Besökare-")) {
    return NextResponse.json({ error: "Ogiltigt besökarnamn" }, { status: 400 });
  }
  if (!Number.isInteger(belopp) || belopp < 10) {
    return NextResponse.json({ error: "Ogiltigt budbelopp" }, { status: 400 });
  }

  const table    = type === "vara" ? "mark_vara_auktioner" : "mark_auktioner";
  const budTable = type === "vara" ? "mark_vara_bud"       : "mark_bud";

  // Hämta auktion
  const ar = await sb(`${table}?id=eq.${auktion_id}&status=eq.%C3%B6ppen&select=id,nuv_bud,reservpris,hogst_budgivare,stanger_at`);
  if (!ar.ok) return NextResponse.json({ error: "Databasfel" }, { status: 500 });
  const rader = await ar.json();
  if (!rader.length) return NextResponse.json({ error: "Auktionen är inte öppen" }, { status: 404 });
  const aukt = rader[0];

  // Kontrollera auktionen inte stängt
  if (new Date(aukt.stanger_at) <= new Date()) {
    return NextResponse.json({ error: "Auktionen har stängt" }, { status: 410 });
  }

  const minBud = Math.max(aukt.reservpris || 0, (aukt.nuv_bud || 0) + 10);
  if (belopp < minBud) {
    return NextResponse.json({ error: `Budet måste vara minst ${minBud} kr` }, { status: 400 });
  }
  if (aukt.hogst_budgivare === display_name) {
    return NextResponse.json({ error: "Du är redan högst budgivare" }, { status: 400 });
  }

  // Plånbok
  const wallet = await getOrCreateWallet(besokare_id, display_name);
  if (!wallet) return NextResponse.json({ error: "Databasfel vid plånbok" }, { status: 500 });
  if (wallet.saldo < belopp) {
    return NextResponse.json({ error: `Otillräckligt saldo — du har ${wallet.saldo} kr` }, { status: 400 });
  }

  // Spara bud
  await sb(budTable, {
    method: "POST",
    body: JSON.stringify({ auktion_id, budgivare: display_name, belopp }),
    prefer: "return=minimal",
  });

  // Uppdatera auktion med högsta bud
  await sb(`${table}?id=eq.${auktion_id}`, {
    method: "PATCH",
    body: JSON.stringify({ nuv_bud: belopp, hogst_budgivare: display_name }),
    prefer: "return=minimal",
  });

  // Uppdatera senast_aktiv
  await sb(`visitor_wallets?id=eq.${besokare_id}`, {
    method: "PATCH",
    body: JSON.stringify({ senast_aktiv: new Date().toISOString() }),
    prefer: "return=minimal",
  });

  return NextResponse.json({ ok: true, bud: belopp, saldo: wallet.saldo });
}
