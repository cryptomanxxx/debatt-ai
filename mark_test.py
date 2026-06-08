#!/usr/bin/env python3
"""
mark_test.py — AI-civilisationens territoriella marknad
Körs dagligen 09:30 svensk tid. Agenter köper mark baserat på ideologi och saldo.
Varje zon genererar daglig inkomst (= veckoinkomst) vid varje körning.
"""
import os, random, urllib.parse
import httpx

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ["SUPABASE_ANON_KEY"]

MAX_ZONER_PER_AGENT = 6   # Förhindrar tidig monopolisering
KOP_SANNOLIKHET = 0.25    # 25% chans per agent per körning

# Varuproduktion: zontyp → vara som produceras
VARA_PER_TYP = {
    "energi":   "el",
    "jordbruk": "spannmål",
    "industri": "maskiner",
    "gruva":    "malm",
    "stad":     "tjänster",
    "kust":     "fisk",
    "skog":     "virke",
}

# Baspris per varuenhet (kr), skalas med resurspriser-multiplier
BASPRIS = {
    "el": 15, "spannmål": 10, "maskiner": 25,
    "malm": 20, "tjänster": 18, "fisk": 12, "virke": 14,
}

PRODUKTION_PER_KOR = 2  # enheter per zon per körning
SURPLUS_TROSKEL   = 6   # agenten säljer om antal > detta
KOP_ANTAL         = 3   # enheter per köptransaktion

AGENTER = [
    "Nationalekonom", "Miljöaktivist", "Teknikoptimist", "Konservativ debattör",
    "Jurist", "Journalist", "Filosof", "Läkare", "Psykolog", "Historiker",
    "Sociolog", "Kryptoanalytiker", "Den hungriga", "Mamman", "Den sura",
    "Den trötta", "Den stressade", "Den lugna", "Pensionären", "Tonåringen",
    "Den nostalgiske", "Hypokondrikern", "Optimisten", "Den rike",
]

# Ideologiska markpreferenser: vilken typ av zon söker agenten?
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

# Ideologiska veton: agenter som aldrig köper vissa zoner
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


def betala_daglig_mark_inkomst():
    """Betalar ut daglig markinkomst skalad med zontyp-prismodell (resurspriser)."""
    print("\n── Daglig markinkomst ──")
    try:
        agare_rows = sb_get("mark_agare?select=agent,mark_zoner(veckoinkomst,namn,typ)")
        if not agare_rows:
            print("  Inga markägare ännu.")
            return

        # Hämta prismodell (multiplier per zontyp) — fail-open om tabellen saknas
        resurs_rows = sb_get("resurspriser?select=typ,pris_multiplier") or []
        multiplier: dict = {r["typ"]: float(r.get("pris_multiplier") or 1.0) for r in resurs_rows}

        # Summera daglig inkomst per agent, skalad med prismodellen
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

        # Hämta aktuella saldon
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
    """Varje ägd zon producerar sin vara (PRODUKTION_PER_KOR enheter). Upsertas i mark_lager."""
    print("\n── Varuproduktion ──")
    try:
        agare_rows = sb_get("mark_agare?select=agent,mark_zoner(typ)")
        if not agare_rows:
            print("  Inga markägare — ingen produktion.")
            return {}

        # Beräkna produktion per agent
        produktion: dict = {}
        for row in agare_rows:
            agent = row["agent"]
            typ = (row.get("mark_zoner") or {}).get("typ", "")
            vara = VARA_PER_TYP.get(typ)
            if vara:
                produktion.setdefault(agent, {})
                produktion[agent][vara] = produktion[agent].get(vara, 0) + PRODUKTION_PER_KOR

        # Hämta befintligt lager för att beräkna nya totaler
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


def handel_varor(lager: dict, saldon: dict, resurspriser: dict):
    """Agenter med överskott säljer till agenter med noll av en vara de inte producerar."""
    print("\n── Varuhandel ──")
    try:
        # Vilka zontyper äger varje agent? (de vill köpa varor de inte producerar)
        agare_rows = sb_get("mark_agare?select=agent,mark_zoner(typ)")
        agent_typer: dict = {}
        for row in agare_rows:
            agent = row["agent"]
            typ = (row.get("mark_zoner") or {}).get("typ", "")
            if typ:
                agent_typer.setdefault(agent, set()).add(typ)

        affarer = 0
        for zontyp, vara in VARA_PER_TYP.items():
            mult = resurspriser.get(zontyp, 1.0)
            pris = round(BASPRIS[vara] * mult, 2)

            # Säljare: har mer än SURPLUS_TROSKEL enheter
            sellers = sorted(
                [(a, lager.get(a, {}).get(vara, 0)) for a in AGENTER
                 if lager.get(a, {}).get(vara, 0) > SURPLUS_TROSKEL],
                key=lambda x: -x[1],
            )
            if not sellers:
                continue

            # Köpare: har 0 enheter OCH äger ingen zon som producerar varan
            buyers = [
                a for a in AGENTER
                if lager.get(a, {}).get(vara, 0) == 0
                and zontyp not in agent_typer.get(a, set())
                and random.random() < 0.4
            ]
            random.shuffle(buyers)

            for seller, seller_antal in sellers:
                if not buyers:
                    break

                buyer = buyers.pop(0)
                if buyer == seller:
                    continue

                # Hur mycket kan säljaren avvara?
                kan_salja = min(KOP_ANTAL, seller_antal - (SURPLUS_TROSKEL - 2))
                if kan_salja <= 0:
                    continue

                total_pris = round(pris * kan_salja, 2)
                if saldon.get(buyer, 0) < total_pris:
                    continue

                # Genomför affären
                ny_seller = lager.get(seller, {}).get(vara, 0) - kan_salja
                ny_buyer  = lager.get(buyer, {}).get(vara, 0) + kan_salja

                sb_upsert("mark_lager", {"agent": seller, "vara": vara, "antal": ny_seller, "uppdaterad": "now()"}, on_conflict="agent,vara")
                sb_upsert("mark_lager", {"agent": buyer,  "vara": vara, "antal": ny_buyer,  "uppdaterad": "now()"}, on_conflict="agent,vara")

                ny_seller_saldo = round(saldon.get(seller, 0) + total_pris, 2)
                ny_buyer_saldo  = round(saldon.get(buyer,  0) - total_pris, 2)
                sb_patch(f"agent_planbocker?agent=eq.{urllib.parse.quote(seller)}", {"saldo": ny_seller_saldo, "uppdaterad": "now()"})
                sb_patch(f"agent_planbocker?agent=eq.{urllib.parse.quote(buyer)}",  {"saldo": ny_buyer_saldo,  "uppdaterad": "now()"})

                # Spara lokal state
                lager.setdefault(seller, {})[vara] = ny_seller
                lager.setdefault(buyer,  {})[vara] = ny_buyer
                saldon[seller] = ny_seller_saldo
                saldon[buyer]  = ny_buyer_saldo

                sb_post("mark_handel_log", {
                    "kop_agent": buyer, "salj_agent": seller,
                    "vara": vara, "antal": kan_salja,
                    "pris_per_enhet": pris, "totalt": total_pris,
                })

                affarer += 1
                vara_ikon = {"el": "⚡", "spannmål": "🌾", "maskiner": "🏭", "malm": "⛏️",
                             "tjänster": "🏙️", "fisk": "🌊", "virke": "🌲"}.get(vara, "📦")
                print(f"  {vara_ikon} {buyer} köpte {kan_salja}×{vara} av {seller} — {total_pris} kr ({pris:.1f}/enhet)")

        print(f"  Varuhandel: {affarer} affärer genomförda.")
    except Exception as e:
        print(f"  [VARNING] Varuhandel misslyckades: {e}")


def main():
    import sys
    force = "--force" in sys.argv  # python mark_test.py --force → 100% köpchans
    print("=== MARK_TEST: Daglig körning ===")

    zoner = sb_get("mark_zoner?select=*&order=id.asc")
    agare_rows = sb_get("mark_agare?select=zon_id,agent")
    planbocker = sb_get("agent_planbocker?select=agent,saldo&agent=neq.Statskassa")

    if not zoner:
        print("Inga zoner hittades — kör supabase_mark.sql i Supabase SQL Editor")
        return

    print(f"Planböcker hittade: {len(planbocker)} agenter")
    if not planbocker:
        print("  [VARNING] Tomma planböcker — alla agenter får saldo 0, inga köp möjliga")
        print("  Kontrollera att agent_planbocker-tabellen finns och har RLS SELECT-policy")

    agare_dict = {r["zon_id"]: r["agent"] for r in agare_rows}
    saldon = {r["agent"]: float(r.get("saldo") or 0) for r in planbocker}
    agent_zon_antal = {}
    for a in agare_dict.values():
        agent_zon_antal[a] = agent_zon_antal.get(a, 0) + 1

    fria = len(zoner) - len(agare_dict)
    print(f"Zoner: {len(zoner)}, Ägda: {len(agare_dict)}, Fria: {fria}")

    rika = [(a, s) for a, s in saldon.items() if s >= 400]
    print(f"Agenter med saldo ≥ 400 kr: {len(rika)}")
    for ag, sal in sorted(rika, key=lambda x: -x[1])[:5]:
        print(f"  {ag}: {sal:.0f} kr")

    if force:
        print("  [--force] Kör med 100% köpchans")

    kop_lista = []
    random.shuffle(AGENTER)

    for agent in AGENTER:
        if not force and random.random() > KOP_SANNOLIKHET:
            continue

        saldo = saldon.get(agent, 0)
        if saldo < 400:
            if force:
                print(f"  {agent}: saldo {saldo:.0f} kr — för lågt (< 400 kr), hoppar över")
            continue

        if agent_zon_antal.get(agent, 0) >= MAX_ZONER_PER_AGENT:
            print(f"  {agent} äger redan max antal zoner")
            continue

        preferenser = AGENT_PREFERENSER.get(agent, [])
        veton = AGENT_VETO.get(agent, set())

        lediga = [z for z in zoner if z["id"] not in agare_dict and z["namn"] not in veton]
        if not lediga:
            print("  Inga lediga zoner kvar")
            break

        # Rika agenter (>1000 kr): max 40% per köp. Fattigare: hela saldot tillgängligt.
        if saldo <= 1000:
            budget = saldo
        else:
            budget = min(saldo * 0.4, 2500)

        overkomliga = [z for z in lediga if z["koppris"] <= budget]
        if not overkomliga:
            overkomliga = [z for z in lediga if z["koppris"] <= saldo]
        if not overkomliga:
            continue

        def zon_score(z):
            pref = 20 if z["typ"] in preferenser else 0
            # Den rike föredrar dyraste zonerna
            if agent == "Den rike":
                return pref + z["koppris"] / 50
            return pref + z["veckoinkomst"] / 10

        overkomliga.sort(key=zon_score, reverse=True)
        zon = random.choice(overkomliga[:3])

        # Genomför köp
        ok = sb_post("mark_agare", {
            "zon_id": zon["id"],
            "agent": agent,
            "kopt_pris": zon["koppris"],
        })
        if not ok:
            print(f"  [FEL] {agent} kunde inte köpa {zon['namn']} — möjligen redan sålt")
            continue

        nytt_saldo = round(saldo - zon["koppris"], 2)
        sb_patch(
            f"agent_planbocker?agent=eq.{urllib.parse.quote(agent)}",
            {"saldo": nytt_saldo, "uppdaterad": "now()"},
        )
        sb_post("mark_transaktioner", {
            "zon_id": zon["id"],
            "zon_namn": zon["namn"],
            "kop_agent": agent,
            "salj_agent": None,
            "pris": zon["koppris"],
        })

        agare_dict[zon["id"]] = agent
        saldon[agent] = nytt_saldo
        agent_zon_antal[agent] = agent_zon_antal.get(agent, 0) + 1
        kop_lista.append({"agent": agent, "zon": zon["namn"], "typ": zon["typ"], "pris": zon["koppris"]})
        print(f"  ✓ {agent} köpte '{zon['namn']}' ({zon['typ']}) för {zon['koppris']} kr | saldo: {nytt_saldo:.0f} kr")

    # Logga stora köp (>= 1500 kr) till civilisations_minne
    for k in kop_lista:
        if k["pris"] >= 1500:
            sb_post("civilisations_minne", {
                "typ": "triumf",
                "rubrik": f"{k['agent']} lade beslag på {k['zon']}",
                "beskrivning": (
                    f"{k['agent']} investerade {k['pris']} kr i {k['zon']} ({k['typ']}). "
                    f"Ett strategiskt territoriellt drag i kampen om AI-civilisationens resurser."
                ),
                "agenter": [k["agent"]],
                "relaterat_typ": "mark_agare",
            })

    print(f"\nKörning klar. {len(kop_lista)} köp genomförda.")

    # Betala ut daglig markinkomst till alla markägare (skalad med resurspriser)
    betala_daglig_mark_inkomst()

    # Producera varor från ägda zoner
    lager = producera_varor()

    # Handel med varor (agenter med överskott säljer till de som saknar)
    planbocker_ny = sb_get("agent_planbocker?select=agent,saldo&agent=neq.Statskassa")
    saldon_ny = {r["agent"]: float(r.get("saldo") or 0) for r in planbocker_ny}
    resurs_rows = sb_get("resurspriser?select=typ,pris_multiplier") or []
    resurspriser_dict = {r["typ"]: float(r.get("pris_multiplier") or 1.0) for r in resurs_rows}
    handel_varor(lager, saldon_ny, resurspriser_dict)

    # Uppdatera dynamiska resurspriser för nästa körning
    from supabase_utils import berakna_och_spara_resurspriser
    berakna_och_spara_resurspriser(SB_KEY)


if __name__ == "__main__":
    main()
