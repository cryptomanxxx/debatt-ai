/**
 * Startsidans widgetdata, hämtad på servern.
 *
 * Funktionerna låg tidigare i app/client.js och kördes i varje besökares
 * webbläsare: cirka 18 ocachade Supabase-anrop per startsidebesök, varav
 * ungefär 10 mot artiklar. Det var den största enskilda källan till
 * Supabase-loggdata (API Gateway). Nu körs de en gång per cachefönster i
 * /api/startsida och delas mellan alla besökare. Funktionerna är flyttade
 * oförändrade, förutom att ett HTTP-fel nu kastar istället för att ge en tom
 * lista, så att ett misslyckat anrop aldrig cachas som "inga data".
 */

const SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function sbCount() {
  // Hämta bara count-headern, inte ett id för varje artikel.
  const res = await fetch(`${SB_URL}/rest/v1/artiklar?select=id&limit=1`, {
    method: "HEAD",
    headers: {
      "apikey": SB_KEY,
      "Authorization": `Bearer ${SB_KEY}`,
      "Prefer": "count=exact",
    },
  });
  if (!res.ok) throw new Error("Artikelräknaren kunde inte hämtas");
  const total = res.headers.get("content-range")?.split("/")[1];
  if (!/^\d+$/.test(total || "")) throw new Error("Artikelantal saknas");
  return Number(total);
}

async function fetchSenasteChattDebatt() {
  const res = await fetch(
    `${SB_URL}/rest/v1/chatt_debatter?select=id,amne,agenter,summering,skapad&order=skapad.desc&limit=1`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  if (!res.ok) throw new Error("Supabase " + res.status);
  const data = await res.json();
  return data?.[0] || null;
}

async function fetchSenasteNyhet() {
  const res = await fetch(
    `${SB_URL}/rest/v1/artiklar?select=id,rubrik,forfattare,artikel,kalla,taggar,nyhetskalla,skapad&nyhetskalla=not.is.null&rubrik=not.like.Replik%3A*&order=skapad.desc&limit=4`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  if (!res.ok) throw new Error("Supabase " + res.status);
  return await res.json();
}

// Filtrerar på det dedikerade filmrecension-fältet (✅123, uppföljning) —
// inte på forfattare="Filmrecensenten", som bara identifierar AI-agentens
// egna recensioner. Sedan besökare kan skicka in filmrecensioner manuellt
// via /skicka-in under sitt eget namn (✅123-uppföljning, PR #1482) räcker
// forfattare inte längre som signal. Separat widget, egen SENASTE-sektion
// — samma princip som SENASTE NYHETERNA/DEBATTERNA.
async function fetchSenasteFilmrecension() {
  const res = await fetch(
    `${SB_URL}/rest/v1/artiklar?select=id,rubrik,forfattare,artikel,kalla,taggar,arg,ori,rel,tro,skapad&filmrecension=eq.true&order=skapad.desc&limit=4`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  if (!res.ok) throw new Error("Supabase " + res.status);
  return await res.json();
}

async function fetchAllaRoster() {
  const res = await fetch(`${SB_URL}/rest/v1/roster?select=artikel_id,rod`, {
    headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` },
  });
  if (!res.ok) throw new Error("Supabase " + res.status);
  return res.json();
}

async function fetchAllaKommentarer() {
  const res = await fetch(`${SB_URL}/rest/v1/kommentarer?select=artikel_id`, {
    headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` },
  });
  if (!res.ok) throw new Error("Supabase " + res.status);
  return res.json();
}

async function fetchCivilisationDrift() {
  const res = await fetch(
    `${SB_URL}/rest/v1/oligarki_historik?select=datum,oligarki_risk,gini,mobilitet&order=datum.desc&limit=2`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  if (!res.ok) throw new Error("Supabase " + res.status);
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows;
}

async function fetchSenasteAgentKonversationer() {
  const res = await fetch(
    `${SB_URL}/rest/v1/agent_fragor?offentlig=eq.true&order=skapad.desc&limit=6&select=agent,fraga,svar,fragare,skapad`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  if (!res.ok) throw new Error("Supabase " + res.status);
  return res.json();
}

async function fetchSenasteUtmaningar() {
  const res = await fetch(
    `${SB_URL}/rest/v1/agent_utmaningar?order=skapad.desc&limit=3&select=agent,tes,motargument,skapad`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  if (!res.ok) throw new Error("Supabase " + res.status);
  return res.json();
}

async function fetchSenasteReplik() {
  const res = await fetch(
    `${SB_URL}/rest/v1/artiklar?rubrik=like.Replik%3A*&order=skapad.desc&limit=1&select=id,rubrik,forfattare,skapad`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  if (!res.ok) throw new Error("Supabase " + res.status);
  const data = await res.json();
  if (!data?.[0]) return null;
  const replik = data[0];
  const originalRubrik = replik.rubrik.replace(/^(Replik: )+/, "");
  const res2 = await fetch(
    `${SB_URL}/rest/v1/artiklar?rubrik=eq.${encodeURIComponent(originalRubrik)}&select=forfattare&limit=1`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  if (!res2.ok) throw new Error("Supabase " + res2.status);
  const orig = await res2.json();
  return { ...replik, originalForfattare: orig[0]?.forfattare || null };
}

async function fetchLatestArtikel() {
  // Sedan ✅133 visar denna bara genuina eget-ämne-debattartiklar — repliker
  // har fått en egen "SENASTE REPLIKERNA"-widget (fetchSenasteRepliker()).
  // nyhetskalla=is.null räcker ensamt för att identifiera "varken nyhet
  // eller replik": agent.py sätter nyhetskalla på BÅDA nyhetsartiklar
  // (riktig källa) och repliker (replik_kalla-pekaren, se ✅17) — bara
  // eget-ämne-grenen lämnar den null. Filmrecensioner (✅123) sätter av
  // samma skäl inte nyhetskalla och matchade därför tidigare felaktigt
  // denna gren — de har sin egen "SENASTE FILMRECENSIONERNA"-sektion.
  // Filtrerar på det dedikerade filmrecension-fältet, inte forfattare —
  // en manuellt inskickad filmrecension (✅123-uppföljning) har inte
  // forfattare="Filmrecensenten" men ska ändå uteslutas härifrån.
  const res = await fetch(`${SB_URL}/rest/v1/artiklar?select=*&nyhetskalla=is.null&filmrecension=eq.false&order=skapad.desc&limit=4`, {
    headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` },
  });
  if (!res.ok) throw new Error("Supabase " + res.status);
  return await res.json();
}

// ✅133: egen widget för repliker, utbruten ur fetchLatestArtikel() på
// uttrycklig begäran — gör det synligt att repliker faktiskt publiceras
// (tidigare konkurrerade de med eget-ämne-artiklar om samma 4 platser i
// "SENASTE DEBATTERNA", vilket kunde dölja hur många repliker som gått ut
// en given dag). parent_id är den enda pålitliga signalen — repliker sätter
// den alltid, oavsett vad nyhetskalla innehåller.
async function fetchSenasteRepliker() {
  const res = await fetch(`${SB_URL}/rest/v1/artiklar?select=*&parent_id=not.is.null&filmrecension=eq.false&order=skapad.desc&limit=4`, {
    headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` },
  });
  if (!res.ok) throw new Error("Supabase " + res.status);
  return await res.json();
}

async function fetchTrending() {
  const sjuDagarSen = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `${SB_URL}/rest/v1/artiklar?select=id,rubrik,forfattare,kalla,lasningar,nyhetskalla,filmrecension,parent_id&lasningar=gte.1&skapad=gte.${encodeURIComponent(sjuDagarSen)}&order=lasningar.desc&limit=3`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  if (!res.ok) throw new Error("Supabase " + res.status);
  return res.json();
}

async function fetchTrendingTopics() {
  const sjuttioTvaTimmarSen = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `${SB_URL}/rest/v1/artiklar?select=id,taggar,lasningar&skapad=gte.${encodeURIComponent(sjuttioTvaTimmarSen)}&order=skapad.desc&limit=120`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  if (!res.ok) throw new Error("Supabase " + res.status);
  const artiklar = await res.json();
  if (!artiklar.length) return [];

  // Fetch reply counts for these articles
  const ids = artiklar.map(a => a.id).join(",");
  const svarRes = await fetch(
    `${SB_URL}/rest/v1/artiklar?select=parent_id&parent_id=in.(${ids})`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  if (!svarRes.ok) throw new Error("Supabase " + svarRes.status);
  const svarData = await svarRes.json();
  const svarCount = {};
  svarData.forEach(s => { svarCount[s.parent_id] = (svarCount[s.parent_id] || 0) + 1; });

  // Aggregate by tag: score = lasningar + svar × 5
  const tagMap = {};
  for (const art of artiklar) {
    const tags = Array.isArray(art.taggar) ? art.taggar : [];
    const las = art.lasningar || 0;
    const svar = svarCount[art.id] || 0;
    for (const tag of tags) {
      if (!tag) continue;
      if (!tagMap[tag]) tagMap[tag] = { tag, antal: 0, score: 0, lasningar: 0, svar: 0 };
      tagMap[tag].antal++;
      tagMap[tag].lasningar += las;
      tagMap[tag].svar += svar;
      tagMap[tag].score += las + svar * 5;
    }
  }

  return Object.values(tagMap)
    .filter(t => t.antal >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);
}

async function fetchTopDebattrad() {
  const res = await fetch(
    `${SB_URL}/rest/v1/artiklar?select=id,rubrik,parent_id&order=skapad.desc&limit=100&parent_id=not.is.null`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  if (!res.ok) throw new Error("Supabase " + res.status);
  const repliker = await res.json();
  if (!repliker.length) return null;
  const counts = {};
  repliker.forEach(r => {
    const root = r.parent_id;
    counts[root] = (counts[root] || 0) + 1;
  });
  const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!topId) return null;
  const res2 = await fetch(
    `${SB_URL}/rest/v1/artiklar?select=id,rubrik,forfattare&id=eq.${topId}`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  if (!res2.ok) throw new Error("Supabase " + res2.status);
  const [art] = await res2.json();
  if (!art) return null;
  return { ...art, antalRepliker: counts[topId] };
}

async function fetchSenasteKommentarer() {
  const res = await fetch(
    `${SB_URL}/rest/v1/kommentarer?select=id,artikel_id,namn,text,skapad&publicerad=eq.true&order=skapad.desc&limit=5`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  if (!res.ok) throw new Error("Supabase " + res.status);
  return res.json();
}

async function getVisitors() {
  const res = await fetch(`${SB_URL}/rest/v1/besokare?select=antal`, {
    headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` },
  });
  if (!res.ok) throw new Error("Supabase " + res.status);
  const data = await res.json();
  return data?.[0]?.antal || 0;
}

async function fetchSenasteDagbok() {
  const res = await fetch(
    `${SB_URL}/rest/v1/agent_dagbok?select=id,agent,rubrik,reflektion,ar_replik,skapad&order=skapad.desc&limit=5`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  if (!res.ok) throw new Error("agent_dagbok");
  const d = await res.json();
  return Array.isArray(d) ? d : [];
}

async function fetchAgentKoalitioner() {
  const res = await fetch(
    `${SB_URL}/rest/v1/agent_koalitioner?select=agent_a,agent_b,styrka,antal_utbyten&order=styrka.desc&limit=5`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  if (!res.ok) throw new Error("agent_koalitioner");
  const d = await res.json();
  return Array.isArray(d) ? d : [];
}

// Agent-symboler för att visa ikoner på artikelkort: max 3 ikoner per agent.
async function fetchAgentSymboler() {
  const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
  const [symRes, varorRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/agent_symboler?select=agent,vara_id,pris_betalt&order=pris_betalt.desc`, { headers }),
    fetch(`${SB_URL}/rest/v1/butik_varor?select=id,ikon`, { headers }),
  ]);
  if (!symRes.ok || !varorRes.ok) throw new Error("agent_symboler");
  const rows = await symRes.json();
  const varor = await varorRes.json();
  if (!Array.isArray(rows)) throw new Error("agent_symboler");
  const ikonMap = Object.fromEntries((varor || []).map(v => [v.id, v.ikon]));
  const map = {};
  for (const r of rows) {
    if (!map[r.agent]) map[r.agent] = [];
    if (map[r.agent].length < 3) map[r.agent].push(ikonMap[r.vara_id] || "");
  }
  return map;
}

function raknaRoster(data) {
  const counts = {};
  let total = 0;
  data.forEach(r => {
    if (!counts[r.artikel_id]) counts[r.artikel_id] = { ja: 0, nej: 0 };
    if (r.rod === "ja") counts[r.artikel_id].ja++;
    else counts[r.artikel_id].nej++;
    total++;
  });
  return { voteCounts: counts, totalRoster: total };
}

function raknaKommentarer(data) {
  const counts = {};
  data.forEach(r => { counts[r.artikel_id] = (counts[r.artikel_id] || 0) + 1; });
  return { commentCounts: counts, totalKommentarer: data.length };
}

/**
 * Hämtar alla widgets parallellt. Ett fält som misslyckas blir null och
 * räknas i `ofullstandig`, så att routen kan låta bli att cacha ett
 * ofullständigt svar. Klienten behåller sitt standardvärde för null-fält.
 */
export async function hamtaStartsidaData() {
  const kallor = {
    articleCount: sbCount,
    heroArtikel: fetchLatestArtikel,
    visitors: getVisitors,
    roster: () => fetchAllaRoster().then(raknaRoster),
    kommentarer: () => fetchAllaKommentarer().then(raknaKommentarer),
    senasteReplik: fetchSenasteReplik,
    senasteChattDebatt: fetchSenasteChattDebatt,
    senasteNyhet: fetchSenasteNyhet,
    senasteFilmrecension: fetchSenasteFilmrecension,
    senasteRepliker: fetchSenasteRepliker,
    trending: fetchTrending,
    trendingTopics: fetchTrendingTopics,
    senasteKommentarer: fetchSenasteKommentarer,
    topDebattrad: fetchTopDebattrad,
    civilisationDrift: fetchCivilisationDrift,
    agentKonversationer: fetchSenasteAgentKonversationer,
    dagbok: fetchSenasteDagbok,
    agentUtmaningar: fetchSenasteUtmaningar,
    agentSymboler: fetchAgentSymboler,
    agentKoalitioner: fetchAgentKoalitioner,
  };
  const nycklar = Object.keys(kallor);
  const resultat = await Promise.allSettled(nycklar.map(k => kallor[k]()));
  const data = {};
  let ofullstandig = 0;
  resultat.forEach((r, i) => {
    if (r.status === "fulfilled") data[nycklar[i]] = r.value;
    else { data[nycklar[i]] = null; ofullstandig++; }
  });
  return { data, ofullstandig };
}
