"""
foretag_test.py — AI-företag: grundande, anstallning, intakter och konkurs

Daglig körning (10:30 svensk tid):
1. Beräkna och kreditera dagliga intäkter (media/handel/konsult/investering)
2. Betala dagslön (veckolön / 7) per anstallda — dras från kassadragning
3. Konkurscheck: kassa < -100 kr → lägg ner, sparka anstallda
4. Grundande: ~2% per analytiker per körning, saldo > 600 kr
5. Anstallningserbjudanden: ~15% per företag om lediga platser finns
"""

import os, sys, json, random
from datetime import datetime, timezone, timedelta
from urllib.parse import quote

import httpx

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"

# Råvaror — speglar mark_test.py
VARA_PER_TYP = {
    "energi": "el", "jordbruk": "spannmål", "industri": "maskiner",
    "gruva": "malm", "stad": "tjänster", "kust": "fisk", "skog": "virke",
}
BASPRIS = {
    "el": 15, "spannmål": 10, "maskiner": 25,
    "malm": 20, "tjänster": 18, "fisk": 12, "virke": 14,
    "mjöl": 15, "stål": 36,
}
VARA_IKON = {
    "el": "⚡", "spannmål": "🌾", "maskiner": "🏭", "malm": "⛏️",
    "tjänster": "🏙️", "fisk": "🌊", "virke": "🌲", "mjöl": "🍞", "stål": "🔩",
}
SURPLUS_TROSKEL  = 6
KOP_ANTAL        = 3
HANDELS_MARGINAL = 0.12  # 12% handelsmarginal

ANALYTIKER = [
    "Nationalekonom", "Miljöaktivist", "Teknikoptimist", "Konservativ debattör",
    "Jurist", "Journalist", "Filosof", "Läkare", "Psykolog",
    "Historiker", "Sociolog", "Kryptoanalytiker",
]
ALLA_AGENTER = ANALYTIKER + [
    "Den hungriga", "Mamman", "Den sura", "Den trötta", "Den stressade",
    "Den lugna", "Pensionären", "Tonåringen", "Den nostalgiske",
    "Hypokondrikern", "Optimisten", "Den rike",
]

SEKTOR_GRUNDARE = {
    "media":       ["Journalist", "Filosof", "Historiker", "Sociolog", "Psykolog", "Konservativ debattör", "Teknikoptimist"],
    "handel":      ["Kryptoanalytiker", "Nationalekonom", "Teknikoptimist"],
    "konsult":     ["Jurist", "Nationalekonom", "Konservativ debattör", "Filosof"],
    "investering": ["Kryptoanalytiker", "Nationalekonom", "Teknikoptimist", "Läkare"],
    "advokatbyra": ["Jurist", "Filosof", "Historiker"],
    "lobbybolag":  ["Konservativ debattör", "Journalist", "Nationalekonom", "Jurist"],
}

SEKTOR_ROLLER = {
    "media":       ["journalist", "redaktör", "krönikör"],
    "handel":      ["handlare", "mäklare"],
    "konsult":     ["rådgivare", "lobbyist", "strateg"],
    "investering": ["portföljförvaltare", "riskanalytiker"],
    "advokatbyra": ["försvarsadvokat", "biträdande jurist"],
    "lobbybolag":  ["lobbyist", "politisk rådgivare", "parlamentsanalytiker"],
}

SEKTOR_MAX_ANSTALLDA = {
    "media": 3, "handel": 2, "konsult": 3,
    "investering": 2, "advokatbyra": 2, "lobbybolag": 2,
}

STARTKAPITAL           = 300.0
VECKOLON               = 35.0
DAGLIG_GRUNDNING_CHANS = 0.02
DAGLIG_ANSTALLNING_CHANS = 0.15
KONKURS_TROSKEL        = -100.0


# ── LLM-hjälpfunktion ────────────────────────────────────────────────────────

def _llm(system: str, prompt: str, max_tokens: int = 120) -> str:
    try:
        from ai_klient import groq_post, deepseek_post, github_models_post
    except ImportError:
        return ""
    payload = {
        "model": "llama-3.3-70b-versatile",
        "max_tokens": max_tokens,
        "temperature": 0.7,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": prompt},
        ],
    }
    for fn in [lambda: groq_post(payload),
               lambda: deepseek_post(payload),
               lambda: github_models_post({**payload, "model": "Llama-3.3-70B-Instruct"})]:
        try:
            return fn().json()["choices"][0]["message"]["content"].strip()
        except Exception:
            pass
    return ""


# ── Supabase-hjälpfunktioner ─────────────────────────────────────────────────

def sb_get(h, path):
    try:
        r = httpx.get(f"{SB_URL}/rest/v1/{path}", headers={**h, "Prefer": ""}, timeout=10)
        return r.json() if r.is_success else []
    except Exception:
        return []

def sb_post(h, table, data):
    """Returns True on success (2xx), False otherwise."""
    try:
        r = httpx.post(f"{SB_URL}/rest/v1/{table}", headers=h, json=data, timeout=8)
        return r.is_success
    except Exception:
        return False

def sb_patch(h, table, filter_str, data):
    try:
        httpx.patch(f"{SB_URL}/rest/v1/{table}?{filter_str}", headers=h, json=data, timeout=8)
    except Exception:
        pass

def sb_upsert(h, table, data, on_conflict):
    try:
        url = f"{SB_URL}/rest/v1/{table}?on_conflict={on_conflict}"
        r = httpx.post(url, headers={**h, "Prefer": "resolution=merge-duplicates"}, json=data, timeout=8)
        return r.is_success
    except Exception:
        return False


# ── Intäkter ─────────────────────────────────────────────────────────────────

def berakna_intakt_media(h, anstallda_agenter):
    """Artiklar publicerade i senaste 24h av anstallda × 5 kr + lasningar × 0.15 kr."""
    if not anstallda_agenter:
        return 0.0, ""
    grans = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    agenter_str = ",".join(f'"{a}"' for a in anstallda_agenter)
    rader = sb_get(h, f"artiklar?select=forfattare,lasningar&skapad=gte.{grans}&forfattare=in.({agenter_str})&kalla=eq.ai")
    if not rader:
        return 0.0, "Inga nya artiklar publicerade"
    intakt = sum(5.0 + float(r.get("lasningar") or 0) * 0.15 for r in rader)
    return round(intakt, 2), f"{len(rader)} nya artiklar, {sum(int(r.get('lasningar') or 0) for r in rader)} läsningar"

def handel_for_foretag(h, foretag, lager, saldon, mult_dict):
    """Handelsbolaget köper råvaror från agenter med överskott och säljer direkt vidare.

    Returnerar (net_vinst_kr, beskrivning). Kassauppdatering i DB sköts av main().
    Agenternas saldon och lager uppdateras direkt.
    """
    running_kassa = float(foretag["kassa"])
    net_vinst = 0.0
    affarer = []

    for _ in range(3):  # max 3 affärer per körning
        vara = random.choice(list(BASPRIS.keys()))
        typ = next((t for t, v in VARA_PER_TYP.items() if v == vara), None)
        mult = mult_dict.get(typ, 1.0) if typ else 1.0
        kop_pu  = round(BASPRIS[vara] * mult, 2)
        salj_pu = round(kop_pu * (1 + HANDELS_MARGINAL), 2)
        kop_tot  = round(kop_pu  * KOP_ANTAL, 2)
        salj_tot = round(salj_pu * KOP_ANTAL, 2)
        vinst    = round(salj_tot - kop_tot, 2)

        if running_kassa < kop_tot:
            continue

        sellers = [a for a in ALLA_AGENTER if lager.get(a, {}).get(vara, 0) >= SURPLUS_TROSKEL]
        if not sellers:
            continue
        saljare = random.choice(sellers)

        buyers = [a for a in ALLA_AGENTER if a != saljare and lager.get(a, {}).get(vara, 0) == 0]
        if not buyers:
            continue
        kopare = random.choice(buyers)

        if saldon.get(kopare, 0) < salj_tot:
            continue

        # Köp: bolag betalar säljaren
        ny_sl = max(0, lager.get(saljare, {}).get(vara, 0) - KOP_ANTAL)
        sb_upsert(h, "mark_lager", {"agent": saljare, "vara": vara, "antal": ny_sl, "uppdaterad": "now()"}, "agent,vara")
        lager.setdefault(saljare, {})[vara] = ny_sl
        saldon[saljare] = round(saldon.get(saljare, 0) + kop_tot, 2)
        sb_patch(h, "agent_planbocker", f"agent=eq.{quote(saljare)}", {"saldo": saldon[saljare], "uppdaterad": "now()"})
        running_kassa = round(running_kassa - kop_tot, 2)
        sb_post(h, "mark_handel_log", {"kop_agent": foretag["namn"], "salj_agent": saljare,
                                        "vara": vara, "antal": KOP_ANTAL, "pris_per_enhet": kop_pu, "totalt": kop_tot})

        # Sälj: bolag säljer till köparen
        ny_kl = lager.get(kopare, {}).get(vara, 0) + KOP_ANTAL
        sb_upsert(h, "mark_lager", {"agent": kopare, "vara": vara, "antal": ny_kl, "uppdaterad": "now()"}, "agent,vara")
        lager.setdefault(kopare, {})[vara] = ny_kl
        saldon[kopare] = round(saldon.get(kopare, 0) - salj_tot, 2)
        sb_patch(h, "agent_planbocker", f"agent=eq.{quote(kopare)}", {"saldo": saldon[kopare], "uppdaterad": "now()"})
        running_kassa = round(running_kassa + salj_tot, 2)
        sb_post(h, "mark_handel_log", {"kop_agent": kopare, "salj_agent": foretag["namn"],
                                        "vara": vara, "antal": KOP_ANTAL, "pris_per_enhet": salj_pu, "totalt": salj_tot})

        net_vinst = round(net_vinst + vinst, 2)
        affarer.append(f"{KOP_ANTAL}×{vara}")
        ikon = VARA_IKON.get(vara, "📦")
        print(f"  {ikon} {foretag['namn']}: {KOP_ANTAL}×{vara} {saljare}→{kopare} | +{vinst:.1f} kr | kassa: {running_kassa:.0f} kr")

    if not affarer:
        return 0.0, "Ingen handel möjlig"

    foretag["kassa"] = running_kassa  # main() skriver till DB
    return net_vinst, f"{len(affarer)} varuaffärer: {', '.join(affarer)}"

def berakna_intakt_flat(anstallda_agenter):
    """Konsult/investering: 4 kr per anstallda per dag."""
    if not anstallda_agenter:
        return 0.0, ""
    intakt = len(anstallda_agenter) * 4.0
    return intakt, f"{len(anstallda_agenter)} anstallda × 4 kr"


def berakna_intakt_advokatbyra(h, foretag, anstallda_agenter, saldon):
    """Advokatbyrån försvarar anklagade agenter i öppna domstolsärenden.

    Genererar ett försvartal via LLM, lagrar det i domstol_arenden.bevis.forsvar_tal
    så att domstol_test.py kan injicera det i domarnas prompts.
    Klienten (svarande) debiteras ARVODE om de har råd, annars pro bono.
    Returnerar (intäkt, beskrivning).
    """
    ARVODE = 50.0  # kr per försvarat ärende
    MAX_ARENDEN = 2  # max ärenden per körning

    oppna = sb_get(h, "domstol_arenden?status=eq.%C3%B6ppen&select=*")
    if not oppna:
        return 0.0, "Inga öppna domstolsärenden"

    # Filtrera bort ärenden som redan har ett försvartal från en advokatbyrå
    obehandlade = [
        a for a in oppna
        if not (a.get("bevis") or {}).get("forsvar_tal")
    ]
    if not obehandlade:
        return 0.0, "Alla öppna ärenden har redan försvartal"

    random.shuffle(obehandlade)
    kandidater = obehandlade[:MAX_ARENDEN]

    advokat = random.choice(anstallda_agenter) if anstallda_agenter else foretag["grundare"]
    forsvarade = 0
    pro_bono = 0
    intakt_total = 0.0

    for arende in kandidater:
        svarande   = arende.get("svarande", "")
        artikel_nr = arende.get("artikel_nr", 0)
        beskrivning = arende.get("beskrivning", "")
        arende_nr  = arende.get("arende_nr", "?")

        # Generera försvartal
        system = (
            f"Du är {advokat}, skicklig försvarsadvokat på {foretag['namn']}. "
            f"Skriv ett kortfattat men övertygande försvartal för din klient. "
            f"Svara på svenska, 3–5 meningar, juridiskt precis."
        )
        prompt = (
            f"Klient: {svarande}\n"
            f"Åtal (Konstitutionsartikel {artikel_nr}): {beskrivning[:400]}\n\n"
            f"Skriv ett försvartal. Ifrågasätt bevisen, kontextualisera handlingen "
            f"och argumentera för friande dom eller mildare bedömning."
        )
        forsvar_tal = _llm(system, prompt, max_tokens=220)
        if not forsvar_tal:
            print(f"  ⚠️  LLM returnerade tomt för ärende {arende_nr}")
            continue

        # Skriv in i bevis-fältet (bevarar befintliga bevis)
        bevis = dict(arende.get("bevis") or {})
        bevis["forsvar_tal"]  = forsvar_tal
        bevis["advokat_byra"] = foretag["namn"]
        bevis["advokat"]      = advokat

        sb_patch(h, "domstol_arenden", f"id=eq.{arende['id']}", {"bevis": bevis})

        # Debitera arvode från klienten om de har råd (> 100 kr efter avgiften)
        klient_saldo = float(saldon.get(svarande, 0))
        if klient_saldo >= ARVODE + 100:
            ny_klient_saldo = round(klient_saldo - ARVODE, 2)
            sb_patch(h, "agent_planbocker", f"agent=eq.{quote(svarande)}", {"saldo": ny_klient_saldo, "uppdaterad": "now()"})
            saldon[svarande] = ny_klient_saldo
            intakt_total = round(intakt_total + ARVODE, 2)
        else:
            pro_bono += 1

        forsvarade += 1
        print(f"  ⚖️  {foretag['namn']} ({advokat}) försvarar {svarande} — ärende {arende_nr}"
              + (" [pro bono]" if klient_saldo < ARVODE + 100 else f" | arvode {int(ARVODE)} kr"))

    if forsvarade == 0:
        return 0.0, "Inga försvarstal förberedda"

    beskr_delar = [f"{forsvarade} ärenden försvarat"]
    if pro_bono:
        beskr_delar.append(f"{pro_bono} pro bono")
    return intakt_total, ", ".join(beskr_delar)


def _uppdatera_lagforslag_raknare(h, fid, gammal_rod, ny_rod):
    """Synkar ai_*_roster på lagforslag efter ett röstbyte."""
    rader = sb_get(h, f"lagforslag?id=eq.{fid}&select=ai_ja_roster,ai_nej_roster,ai_avstar_roster")
    if not rader:
        return
    rad = rader[0]
    data = {}
    if gammal_rod in ("ja", "nej", "avstar"):
        gamla_key = f"ai_{gammal_rod}_roster"
        data[gamla_key] = max(0, int(rad.get(gamla_key) or 0) - 1)
    if ny_rod in ("ja", "nej", "avstar"):
        nya_key = f"ai_{ny_rod}_roster"
        nuv = data.get(nya_key, int(rad.get(nya_key) or 0))
        data[nya_key] = nuv + 1
    if data:
        sb_patch(h, "lagforslag", f"id=eq.{fid}", data)


def berakna_intakt_lobbybolag(h, foretag, anstallda_agenter, saldon):
    """Lobbybolaget lobbyr i klientagenters ställe mot betalning.

    Värdeproposition vs. solo-lobbying:
    - Högre budget (55 kr vs 20–50 kr) → bättre incitament för mottagaren
    - Professionella argument från specialiserade lobbyister

    Intäktsmodell:
    - AVGIFT = 40 kr upfront per uppdrag (klienten betalar alltid)
    - LOBBYING_BELOPP = 55 kr erbjuds motpart (från company kassa) om framgång
    - Netto per framgång: 40 − 55 = −15 kr (kassa)
    - Netto per misslyckande: +40 kr (motpart tackade nej → inget utbetalt)
    - Förväntat ≈50 % success-rate: net +12.5 kr/uppdrag

    Kopplar till lobbying_log (klienten = lobbying_agent i loggen).
    """
    AVGIFT           = 40.0   # alltid, win or lose
    LOBBYING_BELOPP  = 55     # erbjuds motpart — dras från company kassa vid framgång
    MAX_UPPDRAG      = 2

    oppna = sb_get(h, "lagforslag?status=eq.omrostning&select=id,titel")
    if not oppna:
        return 0.0, "Inga öppna motioner"

    ids_str = ",".join(str(f["id"]) for f in oppna)
    roster  = sb_get(h, f"agent_roster_lag?lagforslag_id=in.({ids_str})&select=lagforslag_id,agent,rod")

    # Klientkandidater: ja-röstare med råd och minst en motpart som röstat nej
    nej_per_forslag: dict[int, list[str]] = {}
    for r in roster:
        if r["rod"] == "nej":
            nej_per_forslag.setdefault(r["lagforslag_id"], []).append(r["agent"])

    kandidater = []
    for r in roster:
        if r["rod"] != "ja":
            continue
        klient = r["agent"]
        if klient == foretag["grundare"]:
            continue
        if float(saldon.get(klient, 0)) < AVGIFT + 100:
            continue
        motparter = [a for a in nej_per_forslag.get(r["lagforslag_id"], []) if a != klient]
        if not motparter:
            continue
        titel = next((f["titel"] for f in oppna if f["id"] == r["lagforslag_id"]), "")
        kandidater.append((r["lagforslag_id"], klient, motparter, titel))

    if not kandidater:
        return 0.0, "Inga klienter med råd och motpart"

    random.shuffle(kandidater)
    uppdrag = kandidater[:MAX_UPPDRAG]

    lobbyist      = random.choice(anstallda_agenter) if anstallda_agenter else foretag["grundare"]
    running_kassa = float(foretag["kassa"])
    intakt_total  = 0.0
    utforda       = 0

    for fid, klient, motparter, titel in uppdrag:
        mal = random.choice(motparter)

        # Debitera klienten upfront
        k_saldo = float(saldon.get(klient, 0))
        ny_k = round(k_saldo - AVGIFT, 2)
        sb_patch(h, "agent_planbocker", f"agent=eq.{quote(klient)}",
                 {"saldo": ny_k, "uppdaterad": "now()"})
        saldon[klient] = ny_k
        running_kassa  = round(running_kassa + AVGIFT, 2)
        intakt_total   = round(intakt_total + AVGIFT, 2)

        # Generera professionellt lobbyingargument
        system = (
            f"Du är {lobbyist}, erfaren lobbyist på {foretag['namn']}. "
            f"Skriv ett professionellt, konkret lobbyingargument på svenska i 2 meningar."
        )
        prompt = (
            f"Motion: \"{titel[:200]}\"\n"
            f"Klient: {klient} (stödjer motionen, anlitar dig för att övertala {mal}).\n"
            f"Erbjudande: {LOBBYING_BELOPP} kr i direktbetalning till {mal}.\n"
            f"Skriv ett argument som talar till {mal}s specifika intressen."
        )
        argument = _llm(system, prompt, max_tokens=150)
        if not argument:
            print(f"  ⚠️  {foretag['namn']}: kunde inte generera argument för {klient} → refunderar avgift")
            sb_patch(h, "agent_planbocker", f"agent=eq.{quote(klient)}",
                     {"saldo": k_saldo, "uppdaterad": "now()"})
            saldon[klient] = k_saldo
            running_kassa  = round(running_kassa - AVGIFT, 2)
            intakt_total   = round(intakt_total - AVGIFT, 2)
            continue

        # Hämta motpartens saldo och nuvarande röst
        mal_rader = sb_get(h, f"agent_planbocker?agent=eq.{quote(mal)}&select=saldo")
        mal_saldo = float(mal_rader[0]["saldo"]) if mal_rader else 0.0
        rod_rader = sb_get(h, f"agent_roster_lag?lagforslag_id=eq.{fid}&agent=eq.{quote(mal)}&select=rod")
        rod_fore  = rod_rader[0]["rod"] if rod_rader else "ej röstat"

        # Motparten beslutar
        mal_system = "Du fattar politiska beslut."
        mal_prompt = (
            f"Professionellt lobbyingföretag {foretag['namn']} (representerar {klient}) erbjuder dig "
            f"{LOBBYING_BELOPP} kr för att rösta JA på:\n\"{titel[:200]}\"\n\n"
            f"Argument: \"{argument}\"\n"
            f"Din nuvarande ståndpunkt: {rod_fore}. Ditt saldo: {mal_saldo:.0f} kr.\n\n"
            f"Svara EXAKT:\nBESLUT: accepterar eller avvisar\nMOTIVERING: [1 mening]"
        )
        mal_svar = _llm(mal_system, mal_prompt, max_tokens=80)

        resultat   = "avvisat"
        motivering = ""
        for rad in (mal_svar or "").strip().splitlines():
            if "BESLUT:" in rad.upper() and "accepterar" in rad.lower():
                resultat = "accepterat"
            elif "MOTIVERING:" in rad.upper():
                motivering = rad.split(":", 1)[1].strip()

        rod_efter = rod_fore
        if resultat == "accepterat":
            # Uppdatera röst
            sb_upsert(h, "agent_roster_lag",
                      {"lagforslag_id": fid, "agent": mal, "rod": "ja",
                       "motivering": f"[Lobbad via {foretag['namn']} för {klient}] {motivering}"[:300]},
                      "lagforslag_id,agent")
            rod_efter = "ja"
            # Synka röstkolumnerna på lagforslag (nej→ja, eller ej röstat→ja)
            _uppdatera_lagforslag_raknare(h, fid, rod_fore, "ja")
            # Betala motparten — dras från company kassa
            ny_mal = round(mal_saldo + LOBBYING_BELOPP, 2)
            sb_patch(h, "agent_planbocker", f"agent=eq.{quote(mal)}",
                     {"saldo": ny_mal, "uppdaterad": "now()"})
            saldon[mal]    = ny_mal
            running_kassa  = round(running_kassa - LOBBYING_BELOPP, 2)

        # Logga i lobbying_log (klient = lobbying_agent, de gynnas av röständringen)
        sb_post(h, "lobbying_log", {
            "lagforslag_id": fid,
            "lobbying_agent": klient,
            "mal_agent":      mal,
            "belopp":         LOBBYING_BELOPP,
            "argument":       argument[:300],
            "resultat":       resultat,
            "rod_fore":       rod_fore,
            "rod_efter":      rod_efter,
        })

        if resultat == "accepterat":
            sb_post(h, "civilisations_minne", {
                "typ":         "triumf",
                "rubrik":      f"{foretag['namn']} vann lobbying för {klient}",
                "beskrivning": f"{lobbyist} på {foretag['namn']} övertygade {mal} att rösta JA på "
                               f"\"{titel[:60]}\" med {LOBBYING_BELOPP} kr. Klient: {klient}.",
                "agenter":     [klient, mal, lobbyist],
                "relaterat_typ": "lobbying_log",
            })

        emoji = "✓" if resultat == "accepterat" else "✗"
        print(f"  {emoji} {foretag['namn']} ({lobbyist}): lobbying för {klient} → {mal} "
              f"({LOBBYING_BELOPP} kr) — {resultat}")

        utforda += 1

    foretag["kassa"] = running_kassa  # main() skriver till DB
    if utforda == 0:
        return 0.0, "Inga uppdrag genomförda"
    return intakt_total, f"{utforda} lobbyinguppdrag à {int(AVGIFT)} kr"


# ── Grundande ────────────────────────────────────────────────────────────────

def grundar_foretag(h, agent_namn, saldo, befintliga_grundare):
    # Kolla alla grundare (aktiva + inaktiva) för att respektera UNIQUE(grundare)
    alla_grundare = set(befintliga_grundare)
    try:
        alla = sb_get(h, f"foretag?grundare=eq.{quote(agent_namn)}&aktiv=eq.false&select=grundare")
        if alla:
            alla_grundare.add(agent_namn)
    except Exception:
        pass
    if agent_namn in alla_grundare:
        return False
    kandidat_sektorer = [s for s, lst in SEKTOR_GRUNDARE.items() if agent_namn in lst]
    if not kandidat_sektorer:
        return False
    sektor = random.choice(kandidat_sektorer)
    print(f"  🏢 {agent_namn} grundar ett {sektor}bolag...")
    system = f"Du är {agent_namn}. Svara alltid i giltig JSON utan kommentarer."
    om_linje = " och en redaktionell linje (1 mening)" if sektor == "media" else ""
    svar = _llm(system,
        f"Ge ett passande namn på ditt {sektor}bolag{om_linje}. "
        f"JSON: {{\"namn\": \"...\", \"editorial_line\": \"...\"}} "
        f"(editorial_line är null om sektor inte är media)", 80)
    try:
        data = json.loads(svar)
        namn = data.get("namn", f"{agent_namn}s {sektor.capitalize()}bolag")[:80]
        editorial_line = data.get("editorial_line") if sektor == "media" else None
    except Exception:
        namn = f"{agent_namn}s {sektor.capitalize()}bolag"
        editorial_line = None

    ok = sb_post(h, "foretag", {
        "namn": namn,
        "grundare": agent_namn,
        "sektor": sektor,
        "editorial_line": editorial_line,
        "kassa": STARTKAPITAL,
        "startkapital": STARTKAPITAL,
        "aktiv": True,
    })
    if not ok:
        print(f"  ✗ INSERT foretag misslyckades — saldo oförändrat")
        return False
    ny_saldo = round(float(saldo) - STARTKAPITAL, 2)
    sb_patch(h, "agent_planbocker", f"agent=eq.{quote(agent_namn)}", {"saldo": ny_saldo, "uppdaterad": "now()"})
    # Logga grundandet
    sb_post(h, "civilisations_minne", {
        "typ": "triumf",
        "rubrik": f"{namn} grundat",
        "beskrivning": f"{agent_namn} grundade {namn} ({sektor}) med {int(STARTKAPITAL)} kr startkapital.",
        "agenter": [agent_namn],
        "relaterat_typ": "foretag",
    })
    print(f"  ✓ {namn} ({sektor}) grundat av {agent_namn}")
    return True


# ── Anstallning ───────────────────────────────────────────────────────────────

def erbjud_anstallning(h, foretag, befintliga_anstallda_agenter, alla_saldons):
    sektor = foretag["sektor"]
    max_anst = SEKTOR_MAX_ANSTALLDA.get(sektor, 2)
    nuv_antal = sum(1 for a in befintliga_anstallda_agenter if a["foretag_id"] == foretag["id"] and a["aktiv"])
    if nuv_antal >= max_anst:
        return
    anstallda_namn = {a["agent"] for a in befintliga_anstallda_agenter if a["aktiv"]}
    anstallda_namn.add(foretag["grundare"])  # grundaren är alltid "anstallda"
    kandidater = [a for a in ALLA_AGENTER if a not in anstallda_namn]
    if not kandidater:
        return
    mottagare = random.choice(kandidater)
    roll = random.choice(SEKTOR_ROLLER.get(sektor, ["medarbetare"]))
    print(f"  📋 {foretag['namn']} erbjuder {mottagare} rollen {roll} ({int(VECKOLON)} kr/vecka)...")
    system = f"Du är {mottagare}. Svara i giltig JSON."
    svar = _llm(system,
        f"{foretag['namn']} ({sektor}) erbjuder dig rollen som {roll} med {int(VECKOLON)} kr/vecka. "
        f"Tackar du ja? JSON: {{\"svar\": \"accepterar\" | \"avvisar\", \"motivering\": \"...\"}}",
        80)
    try:
        data = json.loads(svar)
        accepterar = "accept" in data.get("svar", "").lower()
    except Exception:
        accepterar = random.random() < 0.6
    if accepterar:
        sb_post(h, "foretag_anstallda", {
            "foretag_id": foretag["id"],
            "agent": mottagare,
            "roll": roll,
            "veckolon": VECKOLON,
            "aktiv": True,
        })
        print(f"  ✓ {mottagare} anstalldes som {roll} på {foretag['namn']}")
    else:
        print(f"  ✗ {mottagare} tackade nej till {foretag['namn']}")


# ── Konkurs ───────────────────────────────────────────────────────────────────

def kolla_konkurs(h, foretag, anstallda):
    if float(foretag["kassa"]) >= KONKURS_TROSKEL:
        return
    print(f"  💀 KONKURS: {foretag['namn']} (kassa: {foretag['kassa']} kr)")
    sb_patch(h, "foretag", f"id=eq.{foretag['id']}", {"aktiv": False, "uppdaterad": "now()"})
    for emp in anstallda:
        if emp["foretag_id"] == foretag["id"] and emp["aktiv"]:
            sb_patch(h, "foretag_anstallda", f"id=eq.{emp['id']}", {"aktiv": False})
    sb_post(h, "civilisations_minne", {
        "typ": "marknadskrasch",
        "rubrik": f"{foretag['namn']} försätts i konkurs",
        "beskrivning": f"{foretag['namn']} ({foretag['sektor']}) grundat av {foretag['grundare']} "
                       f"gick i konkurs med kassa {foretag['kassa']} kr.",
        "agenter": [foretag["grundare"]],
        "relaterat_typ": "foretag",
    })


# ── Dagslöner ─────────────────────────────────────────────────────────────────

def betala_dagsloner(h, foretag, anstallda, saldon):
    dagslon = round(VECKOLON / 7, 2)
    for emp in anstallda:
        if emp["foretag_id"] != foretag["id"] or not emp["aktiv"]:
            continue
        kassa_ny = round(float(foretag["kassa"]) - dagslon, 2)
        foretag["kassa"] = kassa_ny
        sb_patch(h, "foretag", f"id=eq.{foretag['id']}", {"kassa": kassa_ny, "uppdaterad": "now()"})
        agent = emp["agent"]
        gammal = float(saldon.get(agent, 0))
        sb_patch(h, "agent_planbocker", f"agent=eq.{quote(agent)}", {"saldo": round(gammal + dagslon, 2), "uppdaterad": "now()"})
    return foretag


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    sb_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
    if not sb_key:
        print("Saknar Supabase-nyckel.", file=sys.stderr)
        sys.exit(1)

    h = {
        "apikey": sb_key,
        "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    foretag_lista  = sb_get(h, "foretag?aktiv=eq.true&select=*&order=kassa.desc")
    anstallda      = sb_get(h, "foretag_anstallda?aktiv=eq.true&select=*")
    saldon_rader   = sb_get(h, "agent_planbocker?select=agent,saldo&agent=neq.Statskassa")
    saldon         = {r["agent"]: float(r["saldo"]) for r in saldon_rader}

    # Råvarulager och resurspriser (behövs av handelsbolag)
    lager_rader = sb_get(h, "mark_lager?select=agent,vara,antal")
    lager: dict = {}
    for r in lager_rader:
        lager.setdefault(r["agent"], {})[r["vara"]] = int(r.get("antal") or 0)
    mult_rader = sb_get(h, "resurspriser?select=typ,pris_multiplier")
    mult_dict  = {r["typ"]: float(r.get("pris_multiplier") or 1.0) for r in mult_rader}

    befintliga_grundare        = {f["grundare"] for f in foretag_lista}
    befintliga_anstallda_agenter = {a["agent"] for a in anstallda if a["aktiv"]}

    print(f"── Företag: {len(foretag_lista)} aktiva, {len(anstallda)} anstallda ──")

    # ── 1. Intäkter + dagslöner + konkurscheck per företag ───────────────────
    for foretag in foretag_lista:
        fid = foretag["id"]
        emp_agenter = [a["agent"] for a in anstallda if a["foretag_id"] == fid and a["aktiv"]]

        # Intäkter
        sektor = foretag["sektor"]
        if sektor == "media":
            intakt, beskr = berakna_intakt_media(h, emp_agenter)
        elif sektor == "handel":
            # handel_for_foretag uppdaterar foretag["kassa"] internt; main() skriver till DB
            intakt, beskr = handel_for_foretag(h, foretag, lager, saldon, mult_dict)
        elif sektor == "advokatbyra":
            intakt, beskr = berakna_intakt_advokatbyra(h, foretag, emp_agenter, saldon)
        elif sektor == "lobbybolag":
            intakt, beskr = berakna_intakt_lobbybolag(h, foretag, emp_agenter, saldon)
        else:
            intakt, beskr = berakna_intakt_flat(emp_agenter)

        if intakt > 0:
            if sektor in ("handel", "lobbybolag"):
                # kassa redan uppdaterad internt — skriv bara till DB
                sb_patch(h, "foretag", f"id=eq.{fid}", {"kassa": foretag["kassa"], "uppdaterad": "now()"})
            else:
                ny_kassa = round(float(foretag["kassa"]) + intakt, 2)
                foretag["kassa"] = ny_kassa
                sb_patch(h, "foretag", f"id=eq.{fid}", {"kassa": ny_kassa, "uppdaterad": "now()"})
            sb_post(h, "foretag_intakter", {"foretag_id": fid, "typ": sektor, "belopp": intakt, "beskrivning": beskr})
            print(f"  💰 {foretag['namn']}: +{intakt} kr ({beskr})")

        # Dagslöner
        foretag = betala_dagsloner(h, foretag, anstallda, saldon)

        # Konkurs
        kolla_konkurs(h, foretag, anstallda)

    # ── 2. Grundande ─────────────────────────────────────────────────────────
    print("\n── Grundande ──")
    random.shuffle(ANALYTIKER)
    for agent_namn in ANALYTIKER:
        if random.random() > DAGLIG_GRUNDNING_CHANS:
            continue
        saldo = saldon.get(agent_namn, 0)
        if saldo <= STARTKAPITAL + 50:
            continue
        grundar_foretag(h, agent_namn, saldo, befintliga_grundare)
        befintliga_grundare.add(agent_namn)

    # ── 3. Anstallningserbjudanden ────────────────────────────────────────────
    print("\n── Anstallningserbjudanden ──")
    foretag_lista = sb_get(h, "foretag?aktiv=eq.true&select=*")
    anstallda     = sb_get(h, "foretag_anstallda?aktiv=eq.true&select=*")
    for foretag in foretag_lista:
        if random.random() > DAGLIG_ANSTALLNING_CHANS:
            continue
        erbjud_anstallning(h, foretag, anstallda, saldon)

    # ── Resurspriser: uppdatera foretag-sektor i resurspriser om tabellen stöder det ─
    print("\n✓ Företagscykeln klar.")


if __name__ == "__main__":
    main()
