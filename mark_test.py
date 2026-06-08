#!/usr/bin/env python3
"""
mark_test.py — AI-civilisationens territoriella marknad
Körs dagligen 09:30 svensk tid.

Prisupptäckt via auktioner:
  1. Stäng utgångna auktioner → vinnaren tar zonen till sitt buds pris
  2. Öppna nya auktioner för oägda zoner (reservpris 50–65% av listpris)
  3. Agenter budar baserat på ideologi och budget
  4. Clearing-priser uppdaterar resurspriser → inkomster och varupriser justeras
"""
import os, random, urllib.parse
from datetime import datetime, timezone, timedelta
import httpx

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ["SUPABASE_ANON_KEY"]

MAX_ZONER_PER_AGENT = 6
AUKTION_DURATION_H  = 48    # zonauktioner löper 48 timmar
AUKTION_CHANS       = 0.40  # 40% chans per fri zon att öppna auktion per körning
MAX_NYA_AUKTIONER   = 5     # max 5 nya zonauktioner per körning
BUD_CHANS_PER_AGENT = 0.30  # 30% chans per agent per zonauktion att buda

VARA_AUKTION_DURATION_H = 24   # varuauktioner löper 24 timmar
VARA_AUKTION_CHANS      = 0.30  # 30% chans att lista ett överskott per agent per vara
MAX_NYA_VARA_AUKTIONER  = 6    # max 6 nya varuauktioner per körning
VARA_BUD_CHANS          = 0.35  # 35% chans per agent per varuauktion att buda

VARA_PER_TYP = {
    "energi":   "el",
    "jordbruk": "spannmål",
    "industri": "maskiner",
    "gruva":    "malm",
    "stad":     "tjänster",
    "kust":     "fisk",
    "skog":     "virke",
}

BASPRIS = {
    "el": 15, "spannmål": 10, "maskiner": 25,
    "malm": 20, "tjänster": 18, "fisk": 12, "virke": 14,
}

PRODUKTION_PER_KOR = 2
SURPLUS_TROSKEL    = 6
KOP_ANTAL          = 3

TYP_IKON = {
    "energi": "⚡", "jordbruk": "🌾", "industri": "🏭",
    "gruva": "⛏️", "stad": "🏙️", "kust": "🌊", "skog": "🌲",
}

AGENTER = [
    "Nationalekonom", "Miljöaktivist", "Teknikoptimist", "Konservativ debattör",
    "Jurist", "Journalist", "Filosof", "Läkare", "Psykolog", "Historiker",
    "Sociolog", "Kryptoanalytiker", "Den hungriga", "Mamman", "Den sura",
    "Den trötta", "Den stressade", "Den lugna", "Pensionären", "Tonåringen",
    "Den nostalgiske", "Hypokondrikern", "Optimisten", "Den rike",
]

AGENT_PREFERENSER = {
    "Nationalekonom":       ["industri", "stad", "kust"],
    "Miljöaktivist":        ["skog", "jordbruk", "energi"],
    "Teknikoptimist":       ["industri", "energi"],
    "Konservativ debattör": ["jordbruk", "industri", "stad"],
    "Jurist":               ["stad"],
    "Journalist":           ["stad", "kust"],
    "Filosof":              ["skog", "stad"],
    "Läkare":               ["jordbruk", "stad"],
    "Psykolog":             ["skog", "stad"],
    "Historiker":           ["stad", "skog"],
    "Sociolog":             ["stad", "jordbruk"],
    "Kryptoanalytiker":     ["industri", "energi", "gruva"],
    "Den hungriga":         ["jordbruk"],
    "Mamman":               ["jordbruk", "stad"],
    "Den sura":             ["gruva", "industri"],
    "Den trötta":           ["skog"],
    "Den stressade":        ["stad", "industri"],
    "Den lugna":            ["skog", "jordbruk"],
    "Pensionären":          ["jordbruk", "kust"],
    "Tonåringen":           ["stad", "energi"],
    "Den nostalgiske":      ["jordbruk", "skog"],
    "Hypokondrikern":       ["skog", "jordbruk"],
    "Optimisten":           ["energi", "stad"],
    "Den rike":             ["gruva", "industri", "stad"],
}

AGENT_VETO = {
    "Miljöaktivist": {"Kolgruvan", "Kärnkraftspark"},
    "Läkare":        {"Kolgruvan"},
    "Filosof":       {"Kolgruvan"},
    "Sociolog":      {"Kolgruvan"},
}


def _h():
    return {
        "apikey": SB_KEY,
        "Authorization": f"Bearer {SB_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def sb_get(path):
    r = httpx.get(f"{SB_URL}/rest/v1/{path}", headers={**_h(), "Prefer": ""}, timeout=15)
    return r.json() if r.is_success else []


def sb_post(table, data):
    r = httpx.post(f"{SB_URL}/rest/v1/{table}", headers=_h(), json=data, timeout=15)
    return r.is_success


def sb_patch(path, data):
    r = httpx.patch(f"{SB_URL}/rest/v1/{path}", headers=_h(), json=data, timeout=15)
    return r.is_success


def sb_upsert(table, data, on_conflict=None):
    url = f"{SB_URL}/rest/v1/{table}"
    if on_conflict:
        url += f"?on_conflict={urllib.parse.quote(on_conflict)}"
    r = httpx.post(
        url,
        headers={**_h(), "Prefer": "resolution=merge-duplicates"},
        json=data,
        timeout=15,
    )
    return r.is_success


# ── Auktionslogik ─────────────────────────────────────────────────────────────

def stang_avgjorda_auktioner(saldon, agent_zon_antal):
    """Stänger utgångna auktioner. Vinnaren tar zonen, clearing-priset loggas."""
    print("\n── Stänger avgjorda auktioner ──")
    now = datetime.now(timezone.utc).isoformat()

    utgangna = sb_get(
        "mark_auktioner?select=*,mark_zoner(namn,typ,veckoinkomst,koppris)"
        f"&status=eq.öppen&stanger_at=lte.{now}"
    )
    if not utgangna:
        print("  Inga utgångna auktioner.")
        return 0

    avgjorda = 0
    for aukt in utgangna:
        zon = aukt.get("mark_zoner") or {}
        zon_id = aukt["zon_id"]
        zon_namn = zon.get("namn", "?")
        zon_typ  = zon.get("typ", "?")

        if not aukt.get("hogst_budgivare") or not aukt.get("nuv_bud"):
            sb_patch(f"mark_auktioner?id=eq.{aukt['id']}", {"status": "inställd"})
            print(f"  ✗ '{zon_namn}' — ingen bud → inställd")
            continue

        vinnare = aukt["hogst_budgivare"]
        pris    = aukt["nuv_bud"]

        if saldon.get(vinnare, 0) < pris:
            sb_patch(f"mark_auktioner?id=eq.{aukt['id']}", {"status": "inställd"})
            print(f"  ✗ '{zon_namn}' — {vinnare} har ej råd ({saldon.get(vinnare,0):.0f} kr) → inställd")
            continue

        # Skapa ägarpost
        ok = sb_post("mark_agare", {"zon_id": zon_id, "agent": vinnare, "kopt_pris": pris})
        if not ok:
            sb_patch(f"mark_auktioner?id=eq.{aukt['id']}", {"status": "inställd"})
            print(f"  ✗ '{zon_namn}' — INSERT mark_agare misslyckades → inställd")
            continue

        # Dra saldo från vinnaren
        nytt_saldo = round(saldon[vinnare] - pris, 2)
        sb_patch(f"agent_planbocker?agent=eq.{urllib.parse.quote(vinnare)}", {"saldo": nytt_saldo})
        saldon[vinnare] = nytt_saldo

        # Om privatförsäljning — betala säljaren
        saljare = aukt.get("saljare")
        if saljare and saljare in saldon:
            ny_s = round(saldon[saljare] + pris, 2)
            sb_patch(f"agent_planbocker?agent=eq.{urllib.parse.quote(saljare)}", {"saldo": ny_s})
            saldon[saljare] = ny_s
            # Ta bort gamla ägarposten
            httpx.delete(
                f"{SB_URL}/rest/v1/mark_agare?zon_id=eq.{zon_id}&agent=eq.{urllib.parse.quote(saljare)}",
                headers=_h(), timeout=15,
            )

        # Stäng auktionen
        sb_patch(f"mark_auktioner?id=eq.{aukt['id']}", {"status": "avgjord"})

        # Logga transaktion (pris = faktiskt betalt, inte listpris)
        sb_post("mark_transaktioner", {
            "zon_id": zon_id, "zon_namn": zon_namn,
            "kop_agent": vinnare, "salj_agent": saljare,
            "pris": pris,
        })

        agent_zon_antal[vinnare] = agent_zon_antal.get(vinnare, 0) + 1
        avgjorda += 1
        ikon = TYP_IKON.get(zon_typ, "🏷️")
        print(f"  {ikon} {vinnare} vann '{zon_namn}' ({zon_typ}) — {pris} kr | saldo: {nytt_saldo:.0f} kr")

        if pris >= 1200:
            sb_post("civilisations_minne", {
                "typ": "triumf",
                "rubrik": f"{vinnare} lade beslag på {zon_namn} via auktion",
                "beskrivning": (
                    f"{vinnare} vann budrunden på {zon_namn} ({zon_typ}) med ett bud på {pris} kr. "
                    f"Clearing-priset översteg listpriset med {max(0, pris - zon.get('koppris', pris))} kr."
                ),
                "agenter": [vinnare],
                "relaterat_typ": "mark_agare",
            })

    print(f"  {avgjorda} auktioner avgjorda av {len(utgangna)} utgångna.")
    return avgjorda


def oppna_nya_auktioner(zoner, agare_dict, aktiva_zon_ids):
    """Öppnar 48h-auktioner för oägda zoner som inte redan är i aktiv auktion."""
    print("\n── Öppnar nya auktioner ──")

    fria_kandidater = [
        z for z in zoner
        if z["id"] not in agare_dict and z["id"] not in aktiva_zon_ids
    ]
    random.shuffle(fria_kandidater)

    oppnade = 0
    for zon in fria_kandidater:
        if oppnade >= MAX_NYA_AUKTIONER:
            break
        if random.random() > AUKTION_CHANS:
            continue

        reservpris = int(zon["koppris"] * random.uniform(0.50, 0.65))
        stanger_at = (datetime.now(timezone.utc) + timedelta(hours=AUKTION_DURATION_H)).isoformat()

        ok = sb_post("mark_auktioner", {
            "zon_id":          zon["id"],
            "saljare":         None,
            "reservpris":      reservpris,
            "nuv_bud":         None,
            "hogst_budgivare": None,
            "stanger_at":      stanger_at,
            "status":          "öppen",
        })

        if ok:
            oppnade += 1
            ikon = TYP_IKON.get(zon["typ"], "🏷️")
            print(f"  {ikon} Auktion öppen: '{zon['namn']}' ({zon['typ']}) reservpris {reservpris} kr → stänger om {AUKTION_DURATION_H}h")

    print(f"  {oppnade} nya auktioner öppnade ({len(fria_kandidater)} fria zoner tillgängliga).")
    return oppnade


def lgg_bud(auktioner, saldon, agent_zon_antal):
    """Agenter utvärderar aktiva auktioner och lägger konkurrenskraftiga bud."""
    print("\n── Agentbud ──")

    if not auktioner:
        print("  Inga aktiva auktioner att buda på.")
        return 0

    # Spåra hur många bud varje agent lagt denna körning
    agent_bud_denna_korn: dict = {}
    totalt = 0

    for aukt in auktioner:
        zon = aukt.get("mark_zoner") or {}
        zon_id   = aukt["zon_id"]
        zon_namn = zon.get("namn", "?")
        zon_typ  = zon.get("typ", "")
        listpris = zon.get("koppris", 1000)

        # Nuvarande tröskel att slå
        aktuellt = aukt.get("nuv_bud") or aukt["reservpris"]
        hogst_budgivare = aukt.get("hogst_budgivare")

        agenter_shufflad = AGENTER[:]
        random.shuffle(agenter_shufflad)

        for agent in agenter_shufflad:
            # Max 2 bud per agent och körning
            if agent_bud_denna_korn.get(agent, 0) >= 2:
                continue
            if agent_zon_antal.get(agent, 0) >= MAX_ZONER_PER_AGENT:
                continue
            if agent == hogst_budgivare:
                continue  # redan ledande — väntar

            veton = AGENT_VETO.get(agent, set())
            if zon_namn in veton:
                continue

            if random.random() > BUD_CHANS_PER_AGENT:
                continue

            saldo = saldon.get(agent, 0)
            preferenser = AGENT_PREFERENSER.get(agent, [])

            # Intressefaktor styr hur aggressivt agenten budar
            intresse = 0
            if zon_typ in preferenser:
                intresse = 2
            elif preferenser:
                intresse = 1  # utanför nisch men inte omöjligt

            if agent == "Den rike" and listpris > 800:
                intresse = max(intresse, 2)

            if intresse == 0 and random.random() > 0.15:
                continue  # låg chans att buda utanför intressesfär

            # Max budgränsen agenten accepterar för zonen
            if saldo <= 800:
                max_bud = saldo * 0.55
            elif saldo <= 1500:
                max_bud = saldo * 0.40
            else:
                max_bud = min(saldo * 0.35, listpris * 1.8)

            if intresse == 2:
                max_bud = min(max_bud * 1.3, saldo * 0.65)  # mer aggressiv i preferensnisch

            min_bud = aktuellt + 10
            if min_bud > max_bud or saldo < min_bud:
                continue

            # Budstrategi: buda lite mer än aktuellt, med personlig variation
            spread = max_bud - aktuellt
            mitt_bud = int(aktuellt + spread * random.uniform(0.10, 0.35))
            mitt_bud = max(min_bud, min(mitt_bud, int(max_bud)))

            if mitt_bud > saldo:
                continue

            # Lägg budet
            ok = sb_post("mark_bud", {"auktion_id": aukt["id"], "budgivare": agent, "belopp": mitt_bud})
            if not ok:
                continue

            # Uppdatera auktionen
            sb_patch(f"mark_auktioner?id=eq.{aukt['id']}", {
                "nuv_bud": mitt_bud,
                "hogst_budgivare": agent,
            })

            # Lokal state
            aukt["nuv_bud"] = mitt_bud
            aukt["hogst_budgivare"] = agent
            aktuellt = mitt_bud
            hogst_budgivare = agent

            agent_bud_denna_korn[agent] = agent_bud_denna_korn.get(agent, 0) + 1
            totalt += 1

            ikon = TYP_IKON.get(zon_typ, "🏷️")
            print(f"  {ikon} {agent} budar {mitt_bud} kr på '{zon_namn}' ({zon_typ})")

    print(f"  {totalt} bud lagda totalt.")
    return totalt


def lista_zon_for_forsaljning(agare_dict, saldon, agent_zon_antal, zoner_dict):
    """Rika agenter med >3 zoner kan lista en zon på andrahandsauktion (~8%)."""
    print("\n── Andrahandsförsäljningar ──")

    # Aktiva auktioner från agenter (undvik dubbletter)
    befintliga = sb_get("mark_auktioner?select=zon_id&status=eq.öppen&saljare=not.is.null")
    listade_zon_ids = {r["zon_id"] for r in befintliga}

    listningar = 0
    for zon_id, agent in list(agare_dict.items()):
        if agent_zon_antal.get(agent, 0) <= 2:
            continue  # behåller sina zoner om de har ≤2
        if zon_id in listade_zon_ids:
            continue
        if random.random() > 0.08:
            continue

        zon = zoner_dict.get(zon_id, {})
        listpris = zon.get("koppris", 500)
        reservpris = int(listpris * random.uniform(0.70, 0.90))
        stanger_at = (datetime.now(timezone.utc) + timedelta(hours=AUKTION_DURATION_H)).isoformat()

        ok = sb_post("mark_auktioner", {
            "zon_id":          zon_id,
            "saljare":         agent,
            "reservpris":      reservpris,
            "nuv_bud":         None,
            "hogst_budgivare": None,
            "stanger_at":      stanger_at,
            "status":          "öppen",
        })
        if ok:
            listade_zon_ids.add(zon_id)
            listningar += 1
            print(f"  🏷️  {agent} säljer '{zon.get('namn', '?')}' — reservpris {reservpris} kr")

    if listningar == 0:
        print("  Inga nya andrahandslistningar.")
    return listningar


# ── Inkomst, produktion och handel (oförändrat) ───────────────────────────────

def betala_daglig_mark_inkomst():
    """Betalar ut daglig markinkomst skalad med resurspriser (clearing-prisdrivna)."""
    print("\n── Daglig markinkomst ──")
    try:
        agare_rows = sb_get("mark_agare?select=agent,mark_zoner(veckoinkomst,namn,typ)")
        if not agare_rows:
            print("  Inga markägare ännu.")
            return

        resurs_rows = sb_get("resurspriser?select=typ,pris_multiplier") or []
        multiplier: dict = {r["typ"]: float(r.get("pris_multiplier") or 1.0) for r in resurs_rows}

        inkomst: dict = {}
        zoner_per_agent: dict = {}
        for row in agare_rows:
            zon = row.get("mark_zoner") or {}
            agent = row["agent"]
            bas = int(zon.get("veckoinkomst") or 0)
            typ = zon.get("typ", "")
            mult = multiplier.get(typ, 1.0)
            dag_ink = round(bas * mult)
            inkomst[agent] = inkomst.get(agent, 0) + dag_ink
            zoner_per_agent.setdefault(agent, []).append(zon.get("namn", "?"))

        planbocker = sb_get("agent_planbocker?select=agent,saldo&agent=neq.Statskassa")
        saldon = {r["agent"]: float(r.get("saldo") or 0) for r in planbocker}

        total = 0
        for agent, ink in sorted(inkomst.items(), key=lambda x: -x[1]):
            saldo = saldon.get(agent, 0)
            nytt = round(saldo + ink, 2)
            sb_patch(
                f"agent_planbocker?agent=eq.{urllib.parse.quote(agent)}",
                {"saldo": nytt, "uppdaterad": "now()"},
            )
            total += ink
            print(f"  ✓ {agent}: +{ink} kr/dag ({len(zoner_per_agent[agent])} zoner) → saldo {nytt:.0f} kr")

        print(f"  Totalt: {total} kr daglig markinkomst till {len(inkomst)} markägare")

        if total >= 200:
            top_agent = max(inkomst, key=inkomst.get)
            sb_post("civilisations_minne", {
                "typ": "marknadsseger",
                "rubrik": f"Daglig markinkomst: {total} kr till {len(inkomst)} markägare",
                "beskrivning": (
                    f"Markartan genererade {total} kr i dagliga intäkter. "
                    f"{top_agent} leder med {inkomst[top_agent]} kr/dag från "
                    f"{len(zoner_per_agent[top_agent])} zoner."
                ),
                "agenter": list(inkomst.keys()),
                "relaterat_typ": "mark_agare",
            })
    except Exception as e:
        print(f"  [VARNING] Daglig markinkomst misslyckades: {e}")


def producera_varor():
    """Varje ägd zon producerar sin vara (PRODUKTION_PER_KOR enheter)."""
    print("\n── Varuproduktion ──")
    try:
        agare_rows = sb_get("mark_agare?select=agent,mark_zoner(typ)")
        if not agare_rows:
            print("  Inga markägare — ingen produktion.")
            return {}

        produktion: dict = {}
        for row in agare_rows:
            agent = row["agent"]
            typ = (row.get("mark_zoner") or {}).get("typ", "")
            vara = VARA_PER_TYP.get(typ)
            if vara:
                produktion.setdefault(agent, {})
                produktion[agent][vara] = produktion[agent].get(vara, 0) + PRODUKTION_PER_KOR

        lager_rows = sb_get("mark_lager?select=agent,vara,antal")
        lager: dict = {}
        for r in lager_rows:
            lager.setdefault(r["agent"], {})[r["vara"]] = r["antal"]

        total = 0
        for agent, varor in produktion.items():
            for vara, ny_prod in varor.items():
                gammalt = lager.get(agent, {}).get(vara, 0)
                nytt = gammalt + ny_prod
                sb_upsert("mark_lager", {
                    "agent": agent, "vara": vara,
                    "antal": nytt, "uppdaterad": "now()",
                }, on_conflict="agent,vara")
                lager.setdefault(agent, {})[vara] = nytt
                total += ny_prod

        print(f"  {len(produktion)} agenter producerade {total} varuenheter totalt.")
        return lager
    except Exception as e:
        print(f"  [VARNING] Varuproduktion misslyckades: {e}")
        return {}


VARA_IKON_MAP = {
    "el": "⚡", "spannmål": "🌾", "maskiner": "🏭", "malm": "⛏️",
    "tjänster": "🏙️", "fisk": "🌊", "virke": "🌲",
}


def stang_avgjorda_vara_auktioner(saldon: dict, lager: dict):
    """Stänger utgångna varuauktioner. Vinnaren tar varan, säljaren får betalt."""
    print("\n── Stänger avgjorda varuauktioner ──")
    now = datetime.now(timezone.utc).isoformat()

    utgangna = sb_get(
        f"mark_vara_auktioner?select=*&status=eq.%C3%B6ppen&stanger_at=lte.{now}"
    )
    if not utgangna:
        print("  Inga utgångna varuauktioner.")
        return 0

    avgjorda = 0
    for aukt in utgangna:
        vara    = aukt["vara"]
        antal   = aukt["antal"]
        saljare = aukt["saljare"]
        ikon    = VARA_IKON_MAP.get(vara, "📦")

        if not aukt.get("hogst_budgivare") or not aukt.get("nuv_bud"):
            sb_patch(f"mark_vara_auktioner?id=eq.{aukt['id']}", {"status": "inst%C3%A4lld"})
            print(f"  ✗ {antal}×{vara} av {saljare} — inget bud → inställd")
            continue

        vinnare = aukt["hogst_budgivare"]
        pris    = aukt["nuv_bud"]

        if saldon.get(vinnare, 0) < pris:
            sb_patch(f"mark_vara_auktioner?id=eq.{aukt['id']}", {"status": "inst%C3%A4lld"})
            print(f"  ✗ {antal}×{vara} — {vinnare} har ej råd → inställd")
            continue

        seller_antal = lager.get(saljare, {}).get(vara, 0)
        if seller_antal < antal:
            sb_patch(f"mark_vara_auktioner?id=eq.{aukt['id']}", {"status": "inst%C3%A4lld"})
            print(f"  ✗ {antal}×{vara} — {saljare} har ej lager ({seller_antal}) → inställd")
            continue

        # Flytta varor
        ny_seller_antal = seller_antal - antal
        ny_buyer_antal  = lager.get(vinnare, {}).get(vara, 0) + antal
        sb_upsert("mark_lager", {"agent": saljare, "vara": vara, "antal": ny_seller_antal, "uppdaterad": "now()"}, on_conflict="agent,vara")
        sb_upsert("mark_lager", {"agent": vinnare, "vara": vara, "antal": ny_buyer_antal,  "uppdaterad": "now()"}, on_conflict="agent,vara")
        lager.setdefault(saljare, {})[vara] = ny_seller_antal
        lager.setdefault(vinnare, {})[vara] = ny_buyer_antal

        # Flytta krediter
        nytt_vinnare_saldo = round(saldon.get(vinnare, 0) - pris, 2)
        nytt_saljare_saldo = round(saldon.get(saljare, 0) + pris, 2)
        sb_patch(f"agent_planbocker?agent=eq.{urllib.parse.quote(vinnare)}", {"saldo": nytt_vinnare_saldo})
        sb_patch(f"agent_planbocker?agent=eq.{urllib.parse.quote(saljare)}", {"saldo": nytt_saljare_saldo})
        saldon[vinnare] = nytt_vinnare_saldo
        saldon[saljare] = nytt_saljare_saldo

        sb_patch(f"mark_vara_auktioner?id=eq.{aukt['id']}", {"status": "avgjord"})

        # Logga till mark_handel_log
        pris_per_enhet = round(pris / antal, 2)
        sb_post("mark_handel_log", {
            "kop_agent": vinnare, "salj_agent": saljare,
            "vara": vara, "antal": antal,
            "pris_per_enhet": pris_per_enhet, "totalt": pris,
        })

        # Uppdatera resurspriser baserat på clearing-priset (50% blend)
        typ = next((t for t, v in VARA_PER_TYP.items() if v == vara), None)
        if typ:
            clearing_mult = round(pris_per_enhet / BASPRIS[vara], 3)
            r_rows = sb_get(f"resurspriser?select=pris_multiplier&typ=eq.{typ}")
            befintlig = float((r_rows[0].get("pris_multiplier") or 1.0)) if r_rows else 1.0
            ny_mult = round(0.5 * clearing_mult + 0.5 * befintlig, 3)
            trend = "stigande" if ny_mult > befintlig else ("fallande" if ny_mult < befintlig else "stabil")
            sb_upsert("resurspriser", {"typ": typ, "pris_multiplier": ny_mult, "trend": trend}, on_conflict="typ")

        avgjorda += 1
        print(f"  {ikon} {vinnare} vann {antal}×{vara} av {saljare} — {pris} kr ({pris_per_enhet:.1f}/enhet)")

    print(f"  {avgjorda} varuauktioner avgjorda av {len(utgangna)} utgångna.")
    return avgjorda


def oppna_vara_auktioner(lager: dict, saldon: dict):
    """Agenter med överskott öppnar 24h-auktioner för råvaror."""
    print("\n── Öppnar varuauktioner ──")

    befintliga = sb_get("mark_vara_auktioner?select=saljare,vara&status=eq.%C3%B6ppen")
    aktiva_pairs = {(r["saljare"], r["vara"]) for r in befintliga}

    resurs_rows = sb_get("resurspriser?select=typ,pris_multiplier") or []
    mult_dict = {r["typ"]: float(r.get("pris_multiplier") or 1.0) for r in resurs_rows}

    candidates = []
    for agent in AGENTER:
        for vara, baspris in BASPRIS.items():
            if (agent, vara) in aktiva_pairs:
                continue
            antal = lager.get(agent, {}).get(vara, 0)
            if antal <= SURPLUS_TROSKEL:
                continue
            if random.random() > VARA_AUKTION_CHANS:
                continue
            candidates.append((agent, vara))

    random.shuffle(candidates)
    oppnade = 0
    for agent, vara in candidates:
        if oppnade >= MAX_NYA_VARA_AUKTIONER:
            break
        typ = next((t for t, v in VARA_PER_TYP.items() if v == vara), None)
        mult = mult_dict.get(typ, 1.0) if typ else 1.0
        reservpris = int(BASPRIS[vara] * mult * KOP_ANTAL * 0.70)
        stanger_at = (datetime.now(timezone.utc) + timedelta(hours=VARA_AUKTION_DURATION_H)).isoformat()

        ok = sb_post("mark_vara_auktioner", {
            "saljare":         agent,
            "vara":            vara,
            "antal":           KOP_ANTAL,
            "reservpris":      reservpris,
            "nuv_bud":         None,
            "hogst_budgivare": None,
            "stanger_at":      stanger_at,
            "status":          "öppen",
        })
        if ok:
            oppnade += 1
            ikon = VARA_IKON_MAP.get(vara, "📦")
            lager_antal = lager.get(agent, {}).get(vara, 0)
            print(f"  {ikon} {agent} säljer {KOP_ANTAL}×{vara} (lager: {lager_antal}) → reservpris {reservpris} kr")

    print(f"  {oppnade} nya varuauktioner öppnade.")
    return oppnade


def bud_pa_vara_auktioner(vara_auktioner: list, saldon: dict, lager: dict):
    """Agenter budar på råvaruauktioner baserat på behov och ideologi."""
    print("\n── Bud på varuauktioner ──")

    if not vara_auktioner:
        print("  Inga aktiva varuauktioner.")
        return 0

    agent_bud_denna_korn: dict = {}
    totalt = 0

    for aukt in vara_auktioner:
        vara    = aukt["vara"]
        antal   = aukt["antal"]
        saljare = aukt["saljare"]
        aktuellt = aukt.get("nuv_bud") or aukt["reservpris"]
        hogst    = aukt.get("hogst_budgivare")
        ikon     = VARA_IKON_MAP.get(vara, "📦")

        agenter_shufflad = AGENTER[:]
        random.shuffle(agenter_shufflad)

        for agent in agenter_shufflad:
            if agent == saljare or agent == hogst:
                continue
            if agent_bud_denna_korn.get(agent, 0) >= 2:
                continue
            if random.random() > VARA_BUD_CHANS:
                continue

            saldo = saldon.get(agent, 0)
            agent_lager = lager.get(agent, {}).get(vara, 0)

            # Väldigt intresserad om agenten saknar varan, annars låg chans
            if agent_lager >= SURPLUS_TROSKEL and random.random() > 0.10:
                continue

            # Ideologisk prisbias
            prefs = AGENT_PREFERENSER.get(agent, [])
            vara_prefs = [VARA_PER_TYP.get(t) for t in prefs if VARA_PER_TYP.get(t)]
            intresse = 2 if vara in vara_prefs else 1

            baspris_lot = BASPRIS[vara] * antal
            max_bud = int(min(
                baspris_lot * (1.5 if intresse == 2 else 1.2),
                saldo * 0.30,
            ))

            min_bud = aktuellt + max(2, int(aktuellt * 0.05))
            if min_bud > max_bud or saldo < min_bud:
                continue

            spread   = max_bud - aktuellt
            mitt_bud = int(aktuellt + spread * random.uniform(0.10, 0.40))
            mitt_bud = max(min_bud, min(mitt_bud, max_bud))
            if mitt_bud > saldo:
                continue

            ok = sb_post("mark_vara_bud", {"auktion_id": aukt["id"], "budgivare": agent, "belopp": mitt_bud})
            if not ok:
                continue

            sb_patch(f"mark_vara_auktioner?id=eq.{aukt['id']}", {
                "nuv_bud": mitt_bud,
                "hogst_budgivare": agent,
            })
            aukt["nuv_bud"]          = mitt_bud
            aukt["hogst_budgivare"]  = agent
            aktuellt = mitt_bud
            hogst    = agent

            agent_bud_denna_korn[agent] = agent_bud_denna_korn.get(agent, 0) + 1
            totalt += 1
            print(f"  {ikon} {agent} budar {mitt_bud} kr på {antal}×{vara}")

    print(f"  {totalt} varuauktionsbud lagda.")
    return totalt


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    import sys
    print("=== MARK_TEST: Daglig körning ===")

    zoner = sb_get("mark_zoner?select=*&order=id.asc")
    agare_rows = sb_get("mark_agare?select=zon_id,agent")
    planbocker = sb_get("agent_planbocker?select=agent,saldo&agent=neq.Statskassa")

    if not zoner:
        print("Inga zoner hittades — kör supabase_mark.sql i Supabase SQL Editor")
        return

    agare_dict = {r["zon_id"]: r["agent"] for r in agare_rows}
    zoner_dict  = {z["id"]: z for z in zoner}
    saldon = {r["agent"]: float(r.get("saldo") or 0) for r in planbocker}
    agent_zon_antal: dict = {}
    for a in agare_dict.values():
        agent_zon_antal[a] = agent_zon_antal.get(a, 0) + 1

    fria = len(zoner) - len(agare_dict)
    print(f"Zoner: {len(zoner)} | Ägda: {len(agare_dict)} | Fria: {fria}")

    # ── 1. Stäng utgångna auktioner ───────────────────────────────────────────
    stang_avgjorda_auktioner(saldon, agent_zon_antal)

    # Uppdatera agare_dict efter stängda auktioner
    agare_rows = sb_get("mark_agare?select=zon_id,agent")
    agare_dict = {r["zon_id"]: r["agent"] for r in agare_rows}
    agent_zon_antal = {}
    for a in agare_dict.values():
        agent_zon_antal[a] = agent_zon_antal.get(a, 0) + 1

    # ── 2. Öppna auktioner för oägda zoner ───────────────────────────────────
    aktiva_auktioner = sb_get(
        "mark_auktioner?select=*,mark_zoner(namn,typ,veckoinkomst,koppris)"
        "&status=eq.öppen&order=stanger_at.asc"
    )
    aktiva_zon_ids = {a["zon_id"] for a in (aktiva_auktioner or [])}
    oppna_nya_auktioner(zoner, agare_dict, aktiva_zon_ids)

    # ── 3. Agenter lägger bud på öppna auktioner ─────────────────────────────
    aktiva_auktioner = sb_get(
        "mark_auktioner?select=*,mark_zoner(namn,typ,veckoinkomst,koppris)"
        "&status=eq.öppen&order=stanger_at.asc"
    )
    if aktiva_auktioner:
        lgg_bud(aktiva_auktioner, saldon, agent_zon_antal)

    # ── 4. Andrahandsförsäljningar (rika agenter listar zoner) ───────────────
    lista_zon_for_forsaljning(agare_dict, saldon, agent_zon_antal, zoner_dict)

    # ── 5. Daglig markinkomst ─────────────────────────────────────────────────
    betala_daglig_mark_inkomst()

    # ── 6. Varuproduktion ────────────────────────────────────────────────────
    lager = producera_varor()

    # Uppdatera saldon efter markinkomst
    planbocker_ny = sb_get("agent_planbocker?select=agent,saldo&agent=neq.Statskassa")
    saldon_ny = {r["agent"]: float(r.get("saldo") or 0) for r in planbocker_ny}

    # ── 7. Stäng avgjorda varuauktioner ──────────────────────────────────────
    stang_avgjorda_vara_auktioner(saldon_ny, lager)

    # ── 8. Öppna nya varuauktioner ───────────────────────────────────────────
    oppna_vara_auktioner(lager, saldon_ny)

    # ── 9. Bud på varuauktioner ──────────────────────────────────────────────
    aktiva_vara_auktioner = sb_get(
        "mark_vara_auktioner?select=*&status=eq.%C3%B6ppen&order=stanger_at.asc"
    )
    if aktiva_vara_auktioner:
        bud_pa_vara_auktioner(aktiva_vara_auktioner, saldon_ny, lager)

    # ── 10. Uppdatera resurspriser (clearing-priser + utbud/efterfrågan) ──────
    from supabase_utils import berakna_och_spara_resurspriser
    berakna_och_spara_resurspriser(SB_KEY)

    print(f"\n=== Körning klar ===")


if __name__ == "__main__":
    main()
