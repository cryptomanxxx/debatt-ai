import { NextResponse } from "next/server";

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const AI_AGENTER = new Set([
  "Nationalekonom","Miljöaktivist","Teknikoptimist","Konservativ debattör","Jurist",
  "Journalist","Filosof","Läkare","Psykolog","Historiker","Sociolog","Kryptoanalytiker",
  "Den hungriga","Mamman","Den sura","Den trötta","Den stressade","Den lugna",
  "Pensionären","Tonåringen","Den nostalgiske","Hypokondrikern","Optimisten","Den rike",
  "Civilisationshistorikern",
]);

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

export async function PATCH(req) {
  const { besokare_id, old_name, new_suffix } = await req.json();

  if (!besokare_id || !old_name || !new_suffix) {
    return NextResponse.json({ error: "Saknade fält" }, { status: 400 });
  }

  const suffix = new_suffix.trim();
  if (suffix.length < 2 || suffix.length > 20) {
    return NextResponse.json({ error: "Namnet måste vara 2–20 tecken" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9åäöÅÄÖ\-_ ]+$/.test(suffix)) {
    return NextResponse.json({ error: "Endast bokstäver, siffror, bindestreck och mellanslag" }, { status: 400 });
  }

  const new_name = `Besökare-${suffix}`;

  if (AI_AGENTER.has(new_name) || AI_AGENTER.has(suffix)) {
    return NextResponse.json({ error: "Ogiltigt namn" }, { status: 400 });
  }

  // Kolla att new_name inte är taget
  const dupeR = await sb(`visitor_wallets?display_name=eq.${encodeURIComponent(new_name)}&select=id`);
  if (dupeR.ok) {
    const dupes = await dupeR.json();
    if (dupes.length) return NextResponse.json({ error: "Namnet är redan taget" }, { status: 409 });
  }

  // Hämta eller skapa plånbok
  const walletR = await sb(`visitor_wallets?id=eq.${besokare_id}&select=id,display_name,saldo`);
  if (!walletR.ok) return NextResponse.json({ error: "Databasfel" }, { status: 500 });
  const wallets = await walletR.json();

  let currentSaldo = 2000;
  if (wallets.length === 0) {
    // Ny besökare utan plånbok — skapa direkt med det önskade namnet
    const createR = await sb("visitor_wallets", {
      method: "POST",
      body: JSON.stringify({ id: besokare_id, display_name: new_name, saldo: 2000 }),
    });
    if (!createR.ok) return NextResponse.json({ error: "Kunde inte skapa plånbok" }, { status: 500 });
    return NextResponse.json({ ok: true, new_name, saldo: 2000 });
  }

  if (wallets[0].display_name !== old_name) {
    return NextResponse.json({ error: "Identitetsfel" }, { status: 403 });
  }
  currentSaldo = wallets[0].saldo;

  // Uppdatera visitor_wallets
  const updateR = await sb(`visitor_wallets?id=eq.${besokare_id}`, {
    method: "PATCH",
    body: JSON.stringify({ display_name: new_name }),
    prefer: "return=minimal",
  });
  if (!updateR.ok) return NextResponse.json({ error: "Namnbyte misslyckades" }, { status: 500 });

  // Uppdatera mark_agare (visitor kan äga zoner)
  await sb(`mark_agare?agent=eq.${encodeURIComponent(old_name)}`, {
    method: "PATCH",
    body: JSON.stringify({ agent: new_name }),
    prefer: "return=minimal",
  });

  // Uppdatera mark_auktioner (säljare / budgivare)
  await sb(`mark_auktioner?saljare=eq.${encodeURIComponent(old_name)}`, {
    method: "PATCH",
    body: JSON.stringify({ saljare: new_name }),
    prefer: "return=minimal",
  });
  await sb(`mark_auktioner?hogst_budgivare=eq.${encodeURIComponent(old_name)}`, {
    method: "PATCH",
    body: JSON.stringify({ hogst_budgivare: new_name }),
    prefer: "return=minimal",
  });
  await sb(`mark_vara_auktioner?saljare=eq.${encodeURIComponent(old_name)}`, {
    method: "PATCH",
    body: JSON.stringify({ saljare: new_name }),
    prefer: "return=minimal",
  });
  await sb(`mark_vara_auktioner?hogst_budgivare=eq.${encodeURIComponent(old_name)}`, {
    method: "PATCH",
    body: JSON.stringify({ hogst_budgivare: new_name }),
    prefer: "return=minimal",
  });

  // Uppdatera mark_lager (varuinnehav knutet till agentnamn)
  await sb(`mark_lager?agent=eq.${encodeURIComponent(old_name)}`, {
    method: "PATCH",
    body: JSON.stringify({ agent: new_name }),
    prefer: "return=minimal",
  });

  return NextResponse.json({ ok: true, new_name, saldo: currentSaldo });
}
