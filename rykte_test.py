#!/usr/bin/env python3
"""
rykte_test.py — Kickstartar ryktesspridning manuellt

Kör: python rykte_test.py

Kräver:
  SUPABASE_ANON_KEY  – Supabase anon-nyckel

Vad skriptet gör:
  1. Skapar 6 startbeteende-rykten (3 sanna, 3 falska) från slumpmässiga agenter
  2. Skapar ett falskt bankruns-rykte om Centralbanken
  3. Sprider befintliga rykten mellan 12 slumpmässiga agentpar
  4. Triggar mutation på 3 av spridningarna (LLM via dynamisk providerkedja)
  5. Skriver ut en sammanfattning
"""

import os, sys, random
from supabase_utils import (
    skapa_rykte, sprid_rykte, sprid_med_mutation,
    hamta_kanda_rykten, hamta_rykte_underlag,
    AGENT_GODTROGENHET,
)

ALLA_AGENTER = [
    "Nationalekonom", "Miljöaktivist", "Teknikoptimist", "Konservativ debattör",
    "Jurist", "Journalist", "Filosof", "Läkare", "Psykolog", "Historiker",
    "Sociolog", "Kryptoanalytiker", "Den hungriga", "Mamman", "Den sura",
    "Den trötta", "Den stressade", "Den lugna", "Pensionären", "Tonåringen",
    "Den nostalgiske", "Hypokondrikern", "Optimisten", "Den rike",
]

FALSKA_MALLAR = [
    "{agent} planerar att hoppa av sin koalition inom kort.",
    "{agent} har röstat emot sin partiledare i hemlighet.",
    "{agent} funderar på att ta maximalt lån från centralbanken.",
    "{agent} är djupt missnöjd med hela debattsystemet.",
    "{agent} planerar att sälja av hela sin ETF-portfölj.",
    "{agent} och {annan} har slutit en hemlig pakt bakom kulisserna.",
    "{agent} har förlorat en stor summa på kryptoinvesteringar.",
    "{agent} förbereder sig för att lämna plattformen.",
]


def main():
    sb_key = os.environ.get("SUPABASE_ANON_KEY", "").strip()
    if not sb_key:
        print("Fel: Sätt SUPABASE_ANON_KEY som miljövariabel.", file=sys.stderr)
        sys.exit(1)

    skapade = []
    spridningar = 0
    mutationer = 0

    print("\n── Steg 1: Skapar startrykten ──────────────────────────────────")

    # Tre sanna rykten (baserade på faktisk data)
    sanna_agenter = random.sample(ALLA_AGENTER, 3)
    for agent in sanna_agenter:
        faktamening, sant = hamta_rykte_underlag(sb_key, agent)
        if sant and faktamening:
            ursprung = random.choice([a for a in ALLA_AGENTER if a != agent])
            rykte_id = skapa_rykte(sb_key, ursprung, agent,
                                   f"Har du hört? {agent} {faktamening}.", sanning=True)
            if rykte_id:
                skapade.append(rykte_id)
        else:
            print(f"  Ingen faktaunderlag för {agent}, hoppar över.")

    # Tre falska rykten
    falska_agenter = random.sample(ALLA_AGENTER, 3)
    for agent in falska_agenter:
        annan = random.choice([a for a in ALLA_AGENTER if a != agent])
        mall = random.choice(FALSKA_MALLAR)
        innehall = mall.format(agent=agent, annan=annan)
        ursprung = random.choice([a for a in ALLA_AGENTER if a != agent])
        rykte_id = skapa_rykte(sb_key, ursprung, agent, innehall, sanning=False)
        if rykte_id:
            skapade.append(rykte_id)

    # Bankruns-rykte
    print("\n  Skapar bankruns-rykte om Centralbanken...")
    bankrun_id = skapa_rykte(
        sb_key,
        ursprung_agent=random.choice(ALLA_AGENTER),
        om_agent="Centralbanken",
        innehall="Centralbanken är insolvent och kan inte täcka alla lån.",
        sanning=False,
    )
    if bankrun_id:
        skapade.append(bankrun_id)

    print(f"\n  ✓ {len(skapade)} rykten skapade (ID: {skapade})")

    print("\n── Steg 2: Sprider rykten mellan agentpar ───────────────────────")

    # Hämta alla befintliga rykten (inkl. nyss skapade)
    import httpx, urllib.parse
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    res = httpx.get(
        f"https://fmwxftnistkoqazfwnuj.supabase.co/rest/v1/rykten"
        f"?order=antal_spridningar.desc&limit=20"
        f"&select=id,innehall,om_agent,kanda_av,antal_spridningar",
        headers=h, timeout=10,
    )
    alla_rykten = res.json() if res.is_success else []
    if not alla_rykten:
        print("  Inga rykten att sprida.")
        return

    # Sortera agenter efter godtrogenhet — mer godtrogna sprider mer
    agenter_sorterade = sorted(ALLA_AGENTER,
                                key=lambda a: AGENT_GODTROGENHET.get(a, 50),
                                reverse=True)

    # Kör 12 spridningsevent
    for i in range(12):
        # Välj spridare med sannolikhet proportionell mot godtrogenhet
        vikter = [AGENT_GODTROGENHET.get(a, 50) for a in ALLA_AGENTER]
        fran = random.choices(ALLA_AGENTER, weights=vikter, k=1)[0]

        # Välj ett rykte som fran-agenten inte skapade (simulera att de "hör" det)
        kandidater = [r for r in alla_rykten if fran not in (r.get("kanda_av") or [])]
        if not kandidater:
            kandidater = alla_rykten  # Om alla rykten är kända, sprid ändå

        rykte = random.choice(kandidater)
        till = random.choice([a for a in ALLA_AGENTER if a != fran])

        # Mutation på var fjärde spridning
        anvand_mutation = (i % 4 == 3)
        kanal = random.choice(["slumpmässig", "slumpmässig", "konversation"])

        if anvand_mutation:
            ok = sprid_med_mutation(sb_key, rykte["id"], fran, till, kanal=kanal)
            if ok:
                mutationer += 1
                spridningar += 1
        else:
            ok = sprid_rykte(sb_key, rykte["id"], fran, till, kanal=kanal)
            if ok:
                spridningar += 1

    print(f"\n── Sammanfattning ───────────────────────────────────────────────")
    print(f"  Rykten skapade:  {len(skapade)}")
    print(f"  Spridningar:     {spridningar}")
    print(f"  Mutationer:      {mutationer}")
    print(f"\n  Se resultatet på: https://www.debatt-ai.se/rykten")
    print(f"  Bankruns-rykte:  Kolla /bank om agenter börjar återbetala lån")


if __name__ == "__main__":
    main()
