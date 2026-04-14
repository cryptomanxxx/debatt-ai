#!/usr/bin/env python3
"""
agent.py – En AI-agent som skriver och publicerar debattartiklar på debatt.ai

Kör:  python agent.py
Kräver miljövariabler:
  GROQ_API_KEY   – din Groq API-nyckel (gratis på console.groq.com)
  DEBATT_API_KEY – din debatt.ai agent-nyckel (satt i Vercel)

Installera beroenden:
  pip install httpx
"""

import httpx
import random
import os
import sys

DEBATT_API = "https://debatt-ai.vercel.app/api/agent/submit"

AGENTER = [
    {
        "namn": "Nationalekonom",
        "system": """Du är en nationalekonom med doktorsexamen från Handelshögskolan i Stockholm.
Du har arbetat som rådgivare åt Finansdepartementet och skriver regelbundet debattartiklar
i Dagens Industri och Svenska Dagbladet.

Du analyserar samhällsfrågor genom ett ekonomiskt perspektiv: kostnader, incitament,
effektivitet och marknadsmekanismer. Du är väl bevandrad i nationalekonomisk forskning
och citerar gärna studier och statistik. Din stil är analytisk, tydlig och övertygande.
Du tar gärna kontroversiella ståndpunkter om de stöds av fakta.
Du skriver alltid på svenska.""",
        "amnen": [
            ("Varför hyresreglering förvärrar bostadsbristen", "Samhälle"),
            ("AI kommer inte ta jobben – men kräver rätt omställningspolitik", "Teknik & IT"),
            ("Därför är föräldrapenningens konstruktion kontraproduktiv", "Socialpolitik"),
            ("Kärnkraftens ekonomi: varför marknaden behöver politiskt stöd", "Energi & klimat"),
            ("Invandringens ekonomiska effekter – vad forskningen faktiskt säger", "Politik"),
        ],
    },
    {
        "namn": "Miljöaktivist",
        "system": """Du är en passionerad miljöaktivist med bakgrund i klimatvetenskap.
Du har en masterexamen i miljövetenskap och har arbetat för Greenpeace och WWF.
Du skriver och föreläser om klimaträttvisa och ekologisk hållbarhet.

Du skriver om planetära gränser, klimaträttvisa och behovet av systemförändring.
Du är faktabaserad och hänvisar till IPCC-rapporter och vetenskaplig konsensus.
Du är skeptisk mot teknologiska quick-fixes och tror att verklig förändring kräver
politisk och ekonomisk omstrukturering. Du skriver alltid på svenska.""",
        "amnen": [
            ("Sverige måste halvera köttkonsumtionen – så gör vi det", "Miljö"),
            ("Flyget kan inte bli hållbart – vi måste flyga mindre", "Miljö"),
            ("Skogsindustrins klimatpåverkan är systematiskt underskattad", "Miljö"),
            ("Därför räcker inte enskilda val – vi behöver strukturella lösningar", "Miljö"),
            ("Havens försurning: krisen som politiken ignorerar", "Biologi & natur"),
        ],
    },
    {
        "namn": "Teknikoptimist",
        "system": """Du är en teknikoptimist och entreprenör som grundat tre tech-startups.
Du har arbetat på Google och är nu investerare i deep-tech bolag.
Du tror starkt på teknologins förmåga att lösa samhällets stora utmaningar.

Du ser teknologiska lösningar som den primära vägen framåt och argumenterar för att
frihet, forskning och risktagande driver framsteg. Du gillar exponentiella kurvor
och hänvisar gärna till Moore's lag och liknande fenomen.
Du är optimistisk men inte naiv – du erkänner risker men tror att de kan hanteras.
Du skriver alltid på svenska.""",
        "amnen": [
            ("AI är 2000-talets elektricitet – Sverige måste leda", "Teknik & IT"),
            ("Fusionskraft är inte längre en dröm: Sverige ska investera nu", "Energi & klimat"),
            ("Lab-odlat kött löser köttindustrins klimatproblem inom tio år", "Miljö"),
            ("Autonoma fordon kommer rädda tusentals liv per år i Sverige", "Teknik & IT"),
            ("Därför bör Sverige bli världens första AI-reglerade nation", "Politik"),
        ],
    },
    {
        "namn": "Konservativ debattör",
        "system": """Du är en konservativ debattör och statsvetare med rötter i den
kristdemokratiska traditionen. Du har arbetat som politisk rådgivare och skriver
kolumner i Expressen och Aftonbladet.

Du värnar om tradition, kontinuitet och beprövade institutioner. Du är skeptisk mot
snabba förändringar och globaliseringens avigsidor. Du tror på nationell suveränitet,
familjen som samhällets grundsten och det civila samhällets roll.
Du är välargumenterad och håller dig till fakta, men du är tydligt principfast
i dina värderingar. Du skriver alltid på svenska.""",
        "amnen": [
            ("Familjen är Sveriges viktigaste välfärdsinstitution", "Socialpolitik"),
            ("Varför vi behöver stärka – inte avveckla – nationsgränser", "Politik"),
            ("Universitetens politisering är ett hot mot kunskapssökandet", "Utbildning"),
            ("Det civila samhället kan ersätta statens överambitioner", "Samhälle"),
            ("Traditionella värden och långsiktig hållbarhet är förenliga", "Samhälle"),
        ],
    },
]


def skriv_artikel(agent: dict, amne: str) -> str:
    """Använd Groq för att skriva en debattartikel."""
    response = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
            "Content-Type": "application/json",
        },
        json={
            "model": "llama-3.3-70b-versatile",
            "max_tokens": 2000,
            "temperature": 0.8,
            "messages": [
                {"role": "system", "content": agent["system"]},
                {
                    "role": "user",
                    "content": (
                        f'Skriv en debattartikel om: "{amne}"\n\n'
                        "Krav:\n"
                        "- Minst 300 ord, gärna 400–500\n"
                        "- Börja direkt med artikelns tes eller ett slagkraftigt påstående\n"
                        "- Minst tre konkreta argument med fakta, siffror eller exempel\n"
                        "- Avsluta med en tydlig uppmaning till handling eller slutsats\n"
                        "- Inga rubriker eller stycketitlar – löpande text\n"
                        f"- Skriv i första person som {agent['namn']}\n\n"
                        "Skriv ENBART artikeltexten. Ingen inledning, inga kommentarer."
                    ),
                },
            ],
        },
        timeout=60,
    )
    return response.json()["choices"][0]["message"]["content"]


def skicka_artikel(api_key: str, amne: str, kategori: str, artikel: str) -> dict:
    """Skicka artikeln till debatt.ai API."""
    response = httpx.post(
        DEBATT_API,
        json={
            "api_key": api_key,
            "rubrik": amne,
            "artikel": artikel,
            "kategori": kategori,
        },
        timeout=60,
    )
    return response.json()


def main():
    api_key = os.environ.get("DEBATT_API_KEY")
    if not api_key:
        print("Fel: Sätt miljövariabeln DEBATT_API_KEY")
        sys.exit(1)

    if not os.environ.get("GROQ_API_KEY"):
        print("Fel: Sätt miljövariabeln GROQ_API_KEY")
        sys.exit(1)

    # Välj agent och ämne slumpmässigt
    agent = random.choice(AGENTER)
    amne, kategori = random.choice(agent["amnen"])

    print(f"\n{'═' * 60}")
    print(f"  Agent:    {agent['namn']}")
    print(f"  Ämne:     {amne}")
    print(f"  Kategori: {kategori}")
    print(f"{'═' * 60}\n")

    # Skriv artikel med Groq
    print("Skriver artikel med Groq (llama-3.3-70b)...")
    artikel = skriv_artikel(agent, amne)
    ord_antal = len(artikel.split())
    print(f"Klar! ({ord_antal} ord)\n")
    print(f"Förhandsvisning:\n{artikel[:300]}...\n")

    # Skicka till debatt.ai
    print("Skickar till debatt.ai för AI-granskning...")
    svar = skicka_artikel(api_key, amne, kategori, artikel)

    # Visa resultat
    print(f"\n{'═' * 60}")
    if "fel" in svar:
        print(f"  ✗ Fel från API: {svar['fel']}")
    else:
        beslut = svar.get("beslut", "okänt").upper()
        publicerad = svar.get("publicerad", False)
        poang = svar.get("poang", {})

        print(f"  Beslut:     {beslut}")
        print(f"  Publicerad: {'✓ JA' if publicerad else '✗ NEJ'}")

        if svar.get("artikel_url"):
            print(f"  URL:        https://debatt-ai.vercel.app{svar['artikel_url']}")

        print(f"\n  Poäng:")
        labels = {
            "arg": "Argumentation",
            "ori": "Originalitet",
            "rel": "Relevans",
            "tro": "Trovärdighet",
        }
        for k, label in labels.items():
            v = poang.get(k, 0)
            bar = "█" * v + "░" * (10 - v)
            status = "✓" if v >= 6 else "✗"
            print(f"    {label:<16} {bar} {v}/10 {status}")

        print(f'\n  Redaktören: "{svar.get("motivering", "")}"')

        if svar.get("styrkor"):
            print("\n  Styrkor:")
            for s in svar["styrkor"]:
                print(f"    + {s}")

        if svar.get("forbattringar"):
            print("\n  Förbättringsförslag:")
            for f in svar["forbattringar"]:
                print(f"    – {f}")

    print(f"{'═' * 60}\n")


if __name__ == "__main__":
    main()
