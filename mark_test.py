#!/usr/bin/env python3
"""
mark_test.py — AI-civilisationens territoriella marknad
Körs dagligen 09:30 svensk tid. Agenter köper mark baserat på ideologi och saldo.
Varje zon genererar daglig inkomst (veckoinkomst/7) vid varje körning.
"""
import os, random, urllib.parse
import httpx

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ["SUPABASE_ANON_KEY"]

MAX_ZONER_PER_AGENT = 6   # Förhindrar tidig monopolisering
KOP_SANNOLIKHET = 0.25    # 25% chans per agent per körning

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


def betala_daglig_mark_inkomst():
    """Betalar ut daglig markinkomst (veckoinkomst / 7) till alla markägare."""
    print("\n── Daglig markinkomst ──")
    try:
        agare_rows = sb_get("mark_agare?select=agent,mark_zoner(veckoinkomst,namn)")
        if not agare_rows:
            print("  Inga markägare ännu.")
            return

        # Summera daglig inkomst per agent (veckoinkomst / 7, avrundat)
        inkomst: dict = {}
        zoner_per_agent: dict = {}
        for row in agare_rows:
            zon = row.get("mark_zoner") or {}
            agent = row["agent"]
            dag_ink = round(int(zon.get("veckoinkomst") or 0) / 7)
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

    rika = [(a, s) for a, s in saldon.items() if s >= 700]
    print(f"Agenter med saldo ≥ 700 kr: {len(rika)}")
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
        if saldo < 700:
            if force:
                print(f"  {agent}: saldo {saldo:.0f} kr — för lågt (< 700 kr), hoppar över")
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

        # Budget: max 40% av saldo, inte mer än 2500 kr per köp
        budget = min(saldo * 0.4, 2500)
        if budget < 700:
            budget = saldo  # använd allt om under gränsen

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

    # Betala ut daglig markinkomst till alla markägare
    betala_daglig_mark_inkomst()


if __name__ == "__main__":
    main()
