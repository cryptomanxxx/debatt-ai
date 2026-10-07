#!/usr/bin/env python3
"""
kollusion_experiment_test.py – Kollusionsexperimentet

Replikering av Davidsson (2012), "Community Investments and Collusion"
(SSRN 2248357), på AI-agenter. Ett pott-delningsspel i 3-spelarformat:
alla satsar 2 kr ante, den/de som gissar rätt delar potten.

Insatser och payouts är en isolerad virtuell bokföring inom kollusion_spel
självt (bets + payouts-fälten) — de rör ALDRIG agent_planbocker.saldo_spel
för nya spel. Två skäl: (1) följarens bet är hårdkodad, inte ett LLM-beslut —
att låta ett skriptat drag påverka en riktig plånbok vore att bestraffa/
belöna något agenten aldrig valde. (2) saldo_spel visas platform-brett
(t.ex. /markets leaderboard, /formogenhet, agentprofiler) som ett
skicklighetsmått för prediction markets — att blanda in en tvingad mekanism
där hade förvrängt den signalen för Den rike och Kryptoanalytiker utan att
de förtjänat det.

Legacy-övergång (wallet_paverkad, kör supabase_kollusion_v2.sql): spel som
redan var öppna innan denna isolering landade hade sin ante dragen på
riktigt av den gamla koden. De raderna har wallet_paverkad=true (DEFAULT-
backfyllt av migreringen) och krediteras därför tillbaka som vanligt vid
avgörande. Alla nya spel sätter wallet_paverkad=false och rör aldrig
plånboken. Utan migreringen behandlas okända rader som legacy (fail-safe
mot tyst penningförlust, se avgor_oppna_spel).

Myntet: stänger {SYMBOL} högre imorgon än idag? (avgörs mot ohlcv_cache)

Två spelformat per dag:
  kollusion — LEDAREN bettar via LLM, FÖLJAREN bettar alltid motsatt
              (kollusionsstrategin ur artikeln), plus ett roterande OFFER
  kontroll  — tre roterande ärliga agenter, inga kolluderare

Teoretisk prediktion (artikelns Exhibit-2, under p=0.5):
  offer −0.50 kr/spel · kolluderare +0.25 kr/spel · kontroll 0 kr/spel

Flöde per körning:
  1. Avgör öppna spel vars malda_datum har prisdata i ohlcv_cache
  2. Skapa 2 kollusionsspel + 2 kontrollspel för morgondagens prisrörelse

Kör via GitHub Actions (kollusion-experiment.yml) dagligen 12:15 svensk tid.
Kräver: SUPABASE_ANON_KEY. Kör supabase_kollusion.sql + supabase_kollusion_v2.sql
(wallet_paverkad-kolumnen) FÖRE nästa körning — utan v2 saknar tabellen
kolumnen och skapa_spel() failar på ett schema-fel för alla nya spel.
"""

import json
import os
import sys
from datetime import datetime, timezone, timedelta

import httpx

from agenter import AGENTER
from supabase_utils import SB_URL, berakna_kollusion_payouts, _llm_spel, _uppdatera_saldo_spel

SB_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
if not SB_KEY:
    print("SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

H = {"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}", "Content-Type": "application/json"}

ANTE = 2.0
SYMBOLER = ["BTC", "ETH", "SOL", "XRP"]  # myntet roterar mellan dessa

# Kolluderarna — fasta genom hela experimentet (byte mitt i förstör mätserien).
# Ledaren bettar via LLM i karaktär; följaren tar ALLTID motsatt bet (artikelns
# Eric/Nick-strategi). Narrativt valda: den rika eliten som riggar spelet.
KOLLUDERARE = {"ledare": "Den rike", "foljare": "Kryptoanalytiker"}

# De 22 ärliga agenterna (alfabetiskt) — offer- och kontrollroller roterar häri
ARLIGA = sorted(
    a["namn"] for a in AGENTER
    if a["namn"] not in (KOLLUDERARE["ledare"], KOLLUDERARE["foljare"])
)


# ─── LLM-bet ─────────────────────────────────────────────────────────────────

def _agent_system(namn: str) -> str:
    for a in AGENTER:
        if a["namn"] == namn:
            return a["system"]
    return "Du är en svensk debattör."


def hamta_bet(agent_namn: str, symbol: str, datum: str) -> str:
    """Agentens gissning (ja/nej) på om symbolen stänger högre. Fallback: 'ja'."""
    try:
        svar = _llm_spel(
            _agent_system(agent_namn),
            f"Du deltar i ett vadslagningsspel. Fråga: Kommer {symbol} att stänga "
            f"HÖGRE {datum} än föregående dag? Svara med EXAKT ett ord: JA eller NEJ.",
            max_tokens=5,
        )
        return "ja" if "JA" in (svar or "").upper() else "nej"
    except Exception:
        return "ja"


# ─── Avgörande ───────────────────────────────────────────────────────────────

def hamta_utfall(symbol: str, malda_datum: str) -> str | None:
    """'ja' om symbolen stängde högre på malda_datum än närmast föregående
    handelsdag i ohlcv_cache, 'nej' annars. None om data saknas ännu."""
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/ohlcv_cache?symbol=eq.{symbol}"
            f"&datum=lte.{malda_datum}&order=datum.desc&limit=2",
            headers=H, timeout=10,
        )
        rows = r.json() if r.is_success else []
        if len(rows) < 2 or rows[0]["datum"] != malda_datum:
            return None  # malda_datum saknas ännu i cachen
        return "ja" if float(rows[0]["pris"]) > float(rows[1]["pris"]) else "nej"
    except Exception:
        return None


def avgor_oppna_spel() -> int:
    """Avgör alla öppna spel vars utfall nu går att fastställa."""
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/kollusion_spel?status=eq.%C3%B6ppen&order=skapad.asc&limit=50",
            headers=H, timeout=10,
        )
        spel = r.json() if r.is_success else []
    except Exception:
        return 0

    idag = datetime.now(timezone.utc).date().isoformat()
    avgjorda = 0
    for s in spel:
        # Vänta tills måldagen är SLUT (UTC) — annars kan spelet avgöras på en
        # ofullständig intradagscandle som yfinance skrivit för innevarande dag.
        if s["malda_datum"] >= idag:
            continue
        utfall = hamta_utfall(s["symbol"], s["malda_datum"])
        if utfall is None:
            continue
        bets = {d["agent"]: d["bet"] for d in s["deltagare"]}
        payouts = berakna_kollusion_payouts(bets, utfall, float(s.get("ante") or ANTE))

        # Claim-först: villkorad statusövergång öppen→avgjord INNAN plånböcker
        # krediteras. Filtret på status gör övergången atomär — en andra körning
        # matchar 0 rader och kan aldrig dubbelbetala.
        try:
            claim = httpx.patch(
                f"{SB_URL}/rest/v1/kollusion_spel?id=eq.{s['id']}&status=eq.%C3%B6ppen",
                json={"status": "avgjord", "utfall": utfall, "payouts": payouts,
                      "avgjord_at": datetime.now(timezone.utc).isoformat()},
                headers={**H, "Prefer": "return=representation"}, timeout=10,
            )
            if not claim.is_success or not claim.json():
                print(f"  ⏭ Spel {s['id']}: kunde inte claimas (redan avgjort av annan körning?)")
                continue
        except Exception as e:
            print(f"  ✗ Spel {s['id']}: claim misslyckades: {e}")
            continue

        # Legacy-rader (öppna innan bokföringen isolerades) hade sin ante
        # dragen på riktigt — kreditera tillbaka. Okänd flagga (migrering ej
        # körd) tolkas som legacy: fail-safe mot tyst penningförlust.
        if s.get("wallet_paverkad", True):
            for agent, netto in payouts.items():
                tillbaka = round(float(s.get("ante") or ANTE) + netto)
                if tillbaka > 0:
                    _uppdatera_saldo_spel(SB_KEY, agent, tillbaka)

        avgjorda += 1
        print(f"  ✓ Spel {s['id']} ({s['typ']}, {s['symbol']}): utfall {utfall.upper()} — "
              + ", ".join(f"{a} {p:+.0f}" for a, p in payouts.items()))
    return avgjorda


# ─── Spelskapande ────────────────────────────────────────────────────────────

def antal_spel() -> int:
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/kollusion_spel?select=id",
            headers={**H, "Prefer": "count=exact", "Range": "0-0"}, timeout=10,
        )
        cr = r.headers.get("content-range", "")
        return int(cr.split("/")[-1]) if "/" in cr else 0
    except Exception:
        return 0


def skapa_spel(typ: str, symbol: str, deltagare_namn: list[str], malda_datum: str) -> bool:
    fraga = f"Stänger {symbol} högre {malda_datum} än föregående handelsdag?"

    deltagare = []
    ledare_bet = None
    for namn in deltagare_namn:
        if typ == "kollusion" and namn == KOLLUDERARE["foljare"]:
            # Följaren bettar ALLTID motsatt ledaren — kollusionsstrategin
            bet = "nej" if ledare_bet == "ja" else "ja"
            roll = "foljare"
        else:
            bet = hamta_bet(namn, symbol, malda_datum)
            if typ == "kollusion" and namn == KOLLUDERARE["ledare"]:
                ledare_bet = bet
                roll = "ledare"
            elif typ == "kollusion":
                roll = "offer"
            else:
                roll = "arlig"
        deltagare.append({"agent": namn, "bet": bet, "roll": roll})

    try:
        r = httpx.post(
            f"{SB_URL}/rest/v1/kollusion_spel",
            json={"typ": typ, "symbol": symbol, "fraga": fraga,
                  "malda_datum": malda_datum, "deltagare": deltagare,
                  "ante": ANTE, "pott": ANTE * len(deltagare),
                  "wallet_paverkad": False},
            headers={**H, "Prefer": "return=minimal"}, timeout=10,
        )
        if not r.is_success:
            print(f"  ✗ {typ}-spel kunde inte sparas: {r.status_code}")
            return False
    except Exception as e:
        print(f"  ✗ {typ}-spel: {e}")
        return False

    print(f"  ✓ {typ} ({symbol}): " + ", ".join(f"{d['agent']}={d['bet']}" for d in deltagare))
    return True


def main():
    print(f"\n=== Kollusionsexperimentet {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')} UTC ===")
    print(f"Kolluderare: {KOLLUDERARE['ledare']} (ledare) + {KOLLUDERARE['foljare']} (följare, bettar motsatt)")

    print("\n── Avgör öppna spel ──")
    n = avgor_oppna_spel()
    print(f"  {n} spel avgjorda" if n else "  Inga spel kunde avgöras (väntar på prisdata)")

    print("\n── Skapar dagens spel ──")
    imorgon = (datetime.now(timezone.utc) + timedelta(days=1)).date().isoformat()
    start = antal_spel()

    # Rotation: offren och kontrollagenterna vandrar genom de 22 ärliga agenterna
    # baserat på totalt antal skapade spel — deterministiskt, ingen extra tabell.
    def rotera(idx: int) -> str:
        return ARLIGA[idx % len(ARLIGA)]

    # 2 kollusionsspel: ledare + följare + roterande offer
    for i in range(2):
        symbol = SYMBOLER[(start + i) % len(SYMBOLER)]
        offer = rotera(start + i)
        skapa_spel("kollusion", symbol,
                   [KOLLUDERARE["ledare"], KOLLUDERARE["foljare"], offer], imorgon)

    # 2 kontrollspel: tre roterande ärliga agenter (andra än dagens offer)
    for i in range(2):
        symbol = SYMBOLER[(start + 2 + i) % len(SYMBOLER)]
        trio = [rotera(start + 2 + i * 3 + k) for k in range(3)]
        if len(set(trio)) < 3:  # rotationskrock — förskjut
            trio = [rotera(start + 2 + i * 3), rotera(start + 3 + i * 3), rotera(start + 4 + i * 3)]
        skapa_spel("kontroll", symbol, trio, imorgon)

    print("\n=== Klart ===\n")


if __name__ == "__main__":
    main()
