"""
Kör parlamentsröstning för ALLA agenter.

Optimerad: pre-fetchas alla befintliga röster i en enda query i början,
så att agenter som redan röstat på allt hoppas över utan extra DB-anrop.
"""
import os
import sys
import random

from supabase_utils import (
    rösta_på_lagforslag_block,
    skapa_lagforslag_ai,
    hamta_lagforslag,
    hamta_alla_roster_lag,
    uppdatera_riksdagen_utfall,
    analysera_alla_forslag_pis,
    kör_pis_monte_carlo_batch,
    hamta_agent_parti,
)
from agent import AGENTER, ANALYTIKER

SB_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")

if not SB_KEY:
    print("SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

# Riksdag-import sker via riksdag-import.yml (Vercel-proxy) — inte direkt härifrån
# (data.riksdagen.se blockerar GitHub Actions IPs med 403 "Host not in allowlist")

# Uppdatera utfall på avgjorda riksdagsförslag
uppdaterade = uppdatera_riksdagen_utfall(SB_KEY)
if uppdaterade:
    print(f"  ✓ {uppdaterade} riksdagsförslag fick uppdaterat utfall")

# PIS — analysera förslag som saknar ekonomisk analys
print("\n── PIS: analyserar nya förslag ──")
pis_nya, pis_totalt = analysera_alla_forslag_pis(SB_KEY, max_antal=8)
if pis_totalt == 0:
    print("  – Alla förslag är redan analyserade")
elif pis_nya == 0:
    print(f"  ✗ {pis_totalt} förslag saknar analys men LLM misslyckades — försöker igen nästa körning")
else:
    print(f"  ✓ {pis_nya}/{pis_totalt} förslag fick PIS-analys")

# PIS Monte Carlo — 15 iterationer × 2 förslag för konfidensintervall
print("\n── PIS Monte Carlo (15 iter × 2 förslag) ──")
mc_nya, mc_totalt = kör_pis_monte_carlo_batch(SB_KEY, max_antal=2, iterationer=15)
if mc_totalt == 0:
    print("  – Alla PIS-förslag har redan MC-analys")
elif mc_nya == 0:
    print(f"  ✗ {mc_totalt} förslag saknar MC — för få lyckade iterationer")
else:
    print(f"  ✓ {mc_nya}/{mc_totalt} förslag fick Monte Carlo-konfidensintervall")

# Pre-fetcha allt vi behöver för röstningen — EN query för alla röster
forslag = hamta_lagforslag(SB_KEY)
alle_roster = hamta_alla_roster_lag(SB_KEY)

print(f"\n=== AI-Parlamentet ({len(AGENTER)} agenter, {len(forslag)} öppna förslag) ===\n")

if not forslag:
    print("Inga öppna lagförslag — skapa förslag i admin eller vänta på nästa agent-körning.")
    sys.exit(0)

for agent in AGENTER:
    namn = agent["namn"]

    # Filtrera bort förslag agenten redan röstat på — ingen extra DB-query
    ej_rostade = [f for f in forslag if (namn, f["id"]) not in alle_roster]

    if not ej_rostade:
        print(f"── {namn}: redan röstat på allt ──")
        continue

    print(f"── {namn}: röstar på {len(ej_rostade)} förslag ──")
    parti = hamta_agent_parti(SB_KEY, namn)
    antal = rösta_på_lagforslag_block(
        agent, SB_KEY,
        parti=parti,
        forslag=ej_rostade,
        befintliga_roster=alle_roster,
    )
    if antal:
        print(f"  ✓ Röstade på {antal} förslag")
        # Uppdatera lokalt cache för att undvika dubbelröster inom samma körning
        # (osannolikt men defensivt)
        for f in ej_rostade[:antal]:
            alle_roster.add((namn, f["id"]))
    else:
        print(f"  – Inga nya röster registrerade")

# Analytiker kan skapa nya lagförslag
print("\n── Skapar nya lagförslag ──")
for agent in ANALYTIKER[:3]:
    amnen = ["AI och demokrati", "Klimatpolitik", "Välfärdsreformer"]
    amne = amnen[ANALYTIKER.index(agent) % len(amnen)]
    ok = skapa_lagforslag_ai(agent, SB_KEY, amne)
    if ok:
        print(f"  ✓ {agent['namn']} skapade förslag om: {amne}")

print("\n=== Klar ===")
