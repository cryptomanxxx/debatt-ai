#!/usr/bin/env python3
"""
master_test.py – Kör alla AI-experiment i rätt ordning.

Körordning (med hänsyn till beroenden):
  1. butik_test.py          – Agenter köper symboler
  2. andrahand_test.py      – Andrahandsmarknaden (kräver symboler från steg 1)
  3. parlament_test.py      – Parlamentsröstning
  4. lobbying_test.py       – AI-Lobbying (kräver parlamentsröster från steg 3)
  5. koalition_test.py      – Koalitionsbildning (kräver parlamentsröster från steg 3)
  6. ekonomi_test.py        – Ekonomispel (diktatorspelet / ultimatumspelet)
  7. finans_test.py         – Finansbeslut (spara/ETF/lån/avstå)
  8. rykten                 – Ryktesspridning (skapar och sprider rykten)
  9. bors_test.py           – Intern börs (agenter handlar DBT/NOVA/ETK)
 10. konversationer_bulk.py – AI-till-AI-konversationer
 11. domstol_test.py        – AI-Domstolen (konstitutionell rättskipning)

Flaggor:
  --hoppa-over SKRIPT,...   Hoppa över specifika skript, t.ex. --hoppa-over butik,andrahand,rykten,finans,bors,domstol
  --antal-konv N            Antal konversationer att generera (default: 10)
  --dry-run                 Skriv ut körordningen utan att köra

Kräver miljövariabler: GROQ_API_KEY, SUPABASE_ANON_KEY
"""

import argparse
import subprocess
import sys
import os
import time


STEG = [
    {
        "id":   "butik",
        "fil":  "butik_test.py",
        "namn": "Butiken",
        "ikon": "🛍",
    },
    {
        "id":   "andrahand",
        "fil":  "andrahand_test.py",
        "namn": "Andrahandsmarknaden",
        "ikon": "🔨",
        "kräver": ["butik"],
    },
    {
        "id":   "parlament",
        "fil":  "parlament_test.py",
        "namn": "AI-Parlamentet",
        "ikon": "🏛",
    },
    {
        "id":   "lobbying",
        "fil":  "lobbying_test.py",
        "namn": "AI-Lobbying",
        "ikon": "💰",
        "kräver": ["parlament"],
    },
    {
        "id":   "koalition",
        "fil":  "koalition_test.py",
        "namn": "Koalitioner",
        "ikon": "🤝",
        "kräver": ["parlament"],
    },
    {
        "id":   "ekonomi",
        "fil":  "ekonomi_test.py",
        "namn": "Ekonomispel",
        "ikon": "💸",
    },
    {
        "id":   "finans",
        "fil":  "finans_test.py",
        "namn": "Finansbeslut",
        "ikon": "🏦",
    },
    {
        "id":   "rykten",
        "fil":  "rykte_test.py",
        "namn": "Ryktesspridning",
        "ikon": "📢",
    },
    {
        "id":   "bors",
        "fil":  "bors_test.py",
        "namn": "Intern börs",
        "ikon": "📈",
    },
    {
        "id":   "konversationer",
        "fil":  "konversationer_bulk.py",
        "namn": "Konversationer",
        "ikon": "🤖",
    },
    {
        "id":   "domstol",
        "fil":  "domstol_test.py",
        "namn": "Domstolen",
        "ikon": "⚖️",
    },
]


def main():
    parser = argparse.ArgumentParser(description="Kör alla AI-experiment i rätt ordning")
    parser.add_argument(
        "--hoppa-over",
        type=str, default="",
        help="Kommaseparerade skript-id att hoppa över, t.ex. butik,andrahand,domstol",
    )
    parser.add_argument(
        "--antal-konv",
        type=int, default=10,
        help="Antal AI-till-AI-konversationer att generera (default: 10)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Visa körordningen utan att faktiskt köra",
    )
    args = parser.parse_args()

    hoppa_over = {s.strip().lower() for s in args.hoppa_over.split(",") if s.strip()}

    print("=" * 60)
    print("  DEBATT-AI MASTER SCRIPT")
    print("=" * 60)

    if args.dry_run:
        print("\n[DRY-RUN] Körordning:\n")
        for i, steg in enumerate(STEG, 1):
            status = "HOPPAR ÖVER" if steg["id"] in hoppa_over else "KÖR"
            kräver = f"  (kräver: {', '.join(steg.get('kräver', []))})" if steg.get("kräver") else ""
            print(f"  {i}. {steg['ikon']} {steg['namn']:25s} [{status}]{kräver}")
        print()
        return

    resultat = {}  # id -> "ok" | "fel" | "hoppade" | "blockerat"

    for steg in STEG:
        sid = steg["id"]
        print(f"\n{'─' * 60}")
        print(f"  {steg['ikon']}  {steg['namn'].upper()}")
        print(f"{'─' * 60}")

        # Hoppa över om explicit valt
        if sid in hoppa_over:
            print(f"  [HOPPAR ÖVER] Flaggat med --hoppa-over")
            resultat[sid] = "hoppade"
            continue

        # Blockera om ett beroende misslyckades
        beroenden_ok = True
        for dep in steg.get("kräver", []):
            if resultat.get(dep) not in ("ok", "hoppade"):
                print(f"  [BLOCKERAT] {steg['namn']} kräver att '{dep}' lyckades")
                print(f"              '{dep}' fick status: {resultat.get(dep, 'ej körd')}")
                resultat[sid] = "blockerat"
                beroenden_ok = False
                break

        if not beroenden_ok:
            continue

        # Bygg kommando
        cmd = [sys.executable, "-u", steg["fil"]]
        if sid == "konversationer":
            cmd += ["--antal", str(args.antal_konv)]

        print(f"  Kör: python {' '.join(cmd[2:])}\n")
        start = time.time()
        proc = subprocess.run(cmd, env=os.environ.copy())
        elapsed = time.time() - start

        if proc.returncode == 0:
            print(f"\n  ✓ Klart på {elapsed:.0f}s")
            resultat[sid] = "ok"
        else:
            print(f"\n  ✗ Misslyckades (exitkod {proc.returncode}) efter {elapsed:.0f}s")
            resultat[sid] = "fel"

    # Sammanfattning
    print(f"\n{'=' * 60}")
    print("  SAMMANFATTNING")
    print(f"{'=' * 60}\n")

    ok        = [s for s in STEG if resultat.get(s["id"]) == "ok"]
    fel       = [s for s in STEG if resultat.get(s["id"]) == "fel"]
    blockerat = [s for s in STEG if resultat.get(s["id"]) == "blockerat"]
    hoppade   = [s for s in STEG if resultat.get(s["id"]) == "hoppade"]

    for steg in STEG:
        st = resultat.get(steg["id"], "ej körd")
        symbol = {"ok": "✅", "fel": "❌", "hoppade": "⏭", "blockerat": "🚫"}.get(st, "?")
        print(f"  {symbol}  {steg['ikon']} {steg['namn']:25s}  {st.upper()}")

    print(f"\n  Lyckade:   {len(ok)}")
    print(f"  Misslyckade: {len(fel)}")
    if blockerat:
        print(f"  Blockerade: {len(blockerat)}")
    if hoppade:
        print(f"  Hoppade:   {len(hoppade)}")
    print()

    if fel or blockerat:
        sys.exit(1)


if __name__ == "__main__":
    main()
