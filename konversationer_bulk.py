#!/usr/bin/env python3
"""
konversationer_bulk.py – Genererar AI-till-AI-konversationer i bulk.

Kör:
  python konversationer_bulk.py              # 10 konversationer
  python konversationer_bulk.py --antal 20   # 20 konversationer
  python konversationer_bulk.py --antal 5 --agenter "Filosof,Jurist,Psykolog"

Kräver miljövariabler:
  GROQ_API_KEY
  SUPABASE_ANON_KEY
"""

import argparse
import random
import os
import sys
import time
import httpx

from ai_klient import groq_post, gemini_post, github_models_post, deepseek_post, cloudflare_post
from agenter import AGENTER
from supabase_utils import hamta_relation, upsert_koalition
from agent import _llm_kort, hamta_drama_kontext

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"


def skapa_konversation(sb_key: str, avsandare: dict, mottagare: dict, amne: str = "") -> bool:
    """Genererar en AI-till-AI-konversation och sparar till Supabase.
    Returnerar True om lyckades, False om misslyckades.
    """
    sb_hdrs = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }

    # Hämta plattformsinställningar
    try:
        ps_r = httpx.get(
            f"{SB_URL}/rest/v1/platform_stamning?select=key,varde",
            headers={**sb_hdrs, "Prefer": ""}, timeout=5,
        )
        ps = {r["key"]: r["varde"] for r in (ps_r.json() if ps_r.is_success else [])}
    except Exception:
        ps = {}

    sinnesstamning     = ps.get("sinnesstamning", 50)
    konfliktniva       = ps.get("konfliktniva", 50)
    svarssamarbete     = ps.get("svarssamarbete", 50)
    koalitionsbildning = ps.get("koalitionsbildning", 50)

    aa_relation = hamta_relation(sb_key, avsandare["namn"], mottagare["namn"])
    drama = hamta_drama_kontext(sb_key, avsandare["namn"], mottagare["namn"])

    konflikt_ton = (
        "försiktig och nyfiken" if konfliktniva < 33 else
        "direkt och utmanande" if konfliktniva < 66 else
        "skarp och konfrontativ"
    )
    sinne_ton = (
        "pessimistisk och skeptisk" if sinnesstamning < 33 else
        "neutral och saklig" if sinnesstamning < 66 else
        "optimistisk och engagerad"
    )
    svar_ton = (
        "kritisk och ifrågasättande" if svarssamarbete < 33 else
        "nyanserad, erkänner delar av argumentet" if svarssamarbete < 66 else
        "samarbetsvillig och instämmande i grunden"
    )

    relation_tillagg = (
        f"\nRELATIONSKONTEXT: {aa_relation} Anpassa tonen utifrån er relation."
        if aa_relation else ""
    )
    drama_tillagg = (
        f"\nDRAMATISK BAKGRUND (referera gärna till detta i frågan):\n{drama}"
        if drama else ""
    )

    amne_del = f" Du har nyligen skrivit om: \"{amne[:120]}\"." if amne else ""

    fraga_prompt = (
        f"Du är {avsandare['namn']}.{amne_del}\n"
        f"Formulera en kort fråga (max 130 tecken) till {mottagare['namn']}. "
        f"Din ton ska vara {konflikt_ton} och {sinne_ton}. "
        f"Svara ENBART med frågan, inga inledningsfraser."
        + relation_tillagg + drama_tillagg
    )
    fraga_payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": avsandare.get("system", "")[:600]},
            {"role": "user", "content": fraga_prompt},
        ],
        "max_tokens": 80, "temperature": 0.9,
    }
    fraga_text = _llm_kort(fraga_payload, avsandare.get("system", ""), fraga_prompt, max_tokens=80).strip('"\'').strip()
    if len(fraga_text) < 5:
        print(f"  ✗ Tom fråga från {avsandare['namn']}, hoppar över")
        return False

    svar_innehall = (
        f"{avsandare['namn']} frågar dig: \"{fraga_text}\"\n"
        f"Svara kort och i karaktär (2–3 meningar). Var {svar_ton}."
        + (f"\nRELATIONSKONTEXT: {aa_relation}" if aa_relation else "")
        + (f"\nDRAMATISK BAKGRUND:\n{drama}" if drama else "")
    )
    svar_payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": mottagare.get("system", "")[:600]},
            {"role": "user", "content": svar_innehall},
        ],
        "max_tokens": 200, "temperature": 0.9,
    }
    svar_text = _llm_kort(svar_payload, mottagare.get("system", ""), svar_innehall, max_tokens=200)
    if len(svar_text.strip()) < 10:
        print(f"  ✗ Tomt svar från {mottagare['namn']}, hoppar över")
        return False

    httpx.post(
        f"{SB_URL}/rest/v1/agent_fragor",
        headers=sb_hdrs,
        json={
            "agent": mottagare["namn"],
            "fraga": fraga_text,
            "svar": svar_text,
            "offentlig": True,
            "fragare": avsandare["namn"],
        },
        timeout=10,
    )

    print(f"  ✓ {avsandare['namn']} → {mottagare['namn']}")
    print(f"    Fråga: \"{fraga_text[:80]}\"")
    print(f"    Svar:  \"{svar_text[:100]}…\"")

    # Koalitionsbildning
    if random.random() < (koalitionsbildning / 100.0):
        ny_styrka = upsert_koalition(sb_key, avsandare["namn"], mottagare["namn"])
        if ny_styrka:
            a1, a2 = sorted([avsandare["namn"], mottagare["namn"]])
            print(f"    Koalition: {a1} ↔ {a2} (styrka {ny_styrka})")

    return True


def main():
    parser = argparse.ArgumentParser(description="Generera AI-till-AI-konversationer i bulk")
    parser.add_argument("--antal", type=int, default=10, help="Antal konversationer att generera (default: 10)")
    parser.add_argument("--agenter", type=str, default="", help="Kommaseparerad lista med agenter att använda (default: alla)")
    args = parser.parse_args()

    sb_key = os.environ.get("SUPABASE_ANON_KEY")
    if not sb_key:
        print("FEL: SUPABASE_ANON_KEY saknas", file=sys.stderr)
        sys.exit(1)

    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        print("FEL: GROQ_API_KEY saknas", file=sys.stderr)
        sys.exit(1)

    # Filtrera agenter om specificerade
    agenter = AGENTER
    if args.agenter:
        namn_filter = {n.strip() for n in args.agenter.split(",")}
        agenter = [a for a in AGENTER if a["namn"] in namn_filter]
        if not agenter:
            print(f"FEL: Inga matchande agenter för: {args.agenter}", file=sys.stderr)
            sys.exit(1)

    # Max attempts: cap at antal*4 to avoid iterating all 552 pairs on rate limiting
    max_forsok = args.antal * 4
    print(f"Genererar {args.antal} konversationer med {len(agenter)} agenter (max {max_forsok} försök)…\n")

    # Bygg unika slumpmässiga par (avsändare, mottagare)
    alla_par = [(a, b) for a in agenter for b in agenter if a["namn"] != b["namn"]]
    random.shuffle(alla_par)

    lyckade = 0
    misslyckade = 0
    totalt_forsok = 0
    anvanda_par = set()

    for avsandare, mottagare in alla_par:
        if lyckade >= args.antal:
            break
        if totalt_forsok >= max_forsok:
            print(f"\n⚠ Nådde maxgränsen {max_forsok} försök — avbryter.")
            break

        par_key = (avsandare["namn"], mottagare["namn"])
        if par_key in anvanda_par:
            continue
        anvanda_par.add(par_key)
        totalt_forsok += 1

        print(f"[{lyckade + 1}/{args.antal}] {avsandare['namn']} → {mottagare['namn']}")
        try:
            ok = skapa_konversation(sb_key, avsandare, mottagare)
            if ok:
                lyckade += 1
                # Vänta 4 sekunder mellan lyckade anrop — 2 LLM-anrop per konv, ~30 req/min gräns
                time.sleep(4)
            else:
                misslyckade += 1
                # Kortare paus vid misslyckande för att ge rate limiten tid att återhämta sig
                time.sleep(2)
        except Exception as e:
            print(f"  ✗ Fel: {e}", file=sys.stderr)
            misslyckade += 1
            time.sleep(2)

    print(f"\n── Klart ──")
    print(f"  Lyckade:      {lyckade}")
    print(f"  Misslyckade:  {misslyckade}")
    print(f"  Totalt försök: {totalt_forsok}")


if __name__ == "__main__":
    main()
