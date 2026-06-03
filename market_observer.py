#!/usr/bin/env python3
"""
market_observer.py — Automatisk utfallsverifiering av prediction markets.

Körs dagligen av GitHub Actions (09:00 svensk tid).
- Hämtar markets vars deadline passerat och status fortfarande är 'öppen'
- Groq LLM försöker bestämma utfallet (ja/nej) baserat på sin kunskap
- Fallback: agenternas konsensussannolikhet (>50% = ja)
- Sätter status='avgjord' och utfall automatiskt
- Reglerar bets direkt (vinnare får 2× insatsen)
"""

import os
import sys
import json
import httpx
from datetime import datetime, timezone

from supabase_utils import reglera_prediction_bets

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ.get("SUPABASE_ANON_KEY", "").strip()
GROQ_KEY = os.environ.get("GROQ_API_KEY", "").strip()
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "").strip()

if not SB_KEY:
    print("FEL: SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

HDRS = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
}


def hamta_utgangna_markets() -> list:
    idag = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    r = httpx.get(
        f"{SB_URL}/rest/v1/markets"
        f"?status=eq.%C3%B6ppen&deadline=lt.{idag}"
        f"&select=id,titel,beskrivning,deadline,resolution_kalla,kategori"
        f"&order=deadline.asc",
        headers=HDRS, timeout=10,
    )
    return r.json() if r.is_success else []


def hamta_consensus(market_id: int) -> float | None:
    r = httpx.get(
        f"{SB_URL}/rest/v1/agent_bets?market_id=eq.{market_id}&select=sannolikhet",
        headers=HDRS, timeout=10,
    )
    bets = r.json() if r.is_success else []
    if not bets:
        return None
    return sum(b["sannolikhet"] for b in bets) / len(bets)


def _parse_llm_svar(text: str) -> tuple[str | None, str, str]:
    """Extraherar utfall, konfidens och motivering ur LLM-svar (JSON)."""
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            p = json.loads(text[start:end])
            utfall = (p.get("utfall") or "").strip().lower()
            konfidens = (p.get("konfidens") or "låg").strip().lower()
            motivering = (p.get("motivering") or "")[:150]
            if utfall in ("ja", "nej"):
                return utfall, konfidens, motivering
    except Exception:
        pass
    return None, "låg", ""


def groq_anrop(prompt: str) -> str:
    r = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
        json={
            "model": "llama3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 120,
            "temperature": 0.1,
        },
        timeout=20,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()


def gemini_anrop(prompt: str) -> str:
    r = httpx.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={GEMINI_KEY}",
        json={"contents": [{"parts": [{"text": prompt}]}],
              "generationConfig": {"maxOutputTokens": 120, "temperature": 0.1}},
        timeout=20,
    )
    r.raise_for_status()
    return r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()


def bestam_utfall_llm(market: dict) -> tuple[str | None, str, str]:
    """Anropar LLM för att avgöra marketsutfall. Returnerar (utfall, konfidens, motivering)."""
    idag = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    prompt = (
        f"Du är en faktaverifierare. Avgör om följande prediction market-fråga utföll som JA eller NEJ.\n\n"
        f"Fråga: {market.get('titel', '')}\n"
        f"Kontext: {market.get('beskrivning', '') or ''}\n"
        f"Källa: {market.get('resolution_kalla', '') or ''}\n"
        f"Deadline: {market.get('deadline', '')[:10]}\n"
        f"Dagens datum: {idag}\n\n"
        f"Svara EXAKT i detta JSON-format:\n"
        f'{{ "utfall": "ja", "motivering": "kort förklaring på svenska max 100 tecken", "konfidens": "hög" }}\n\n'
        f'utfall: "ja" om händelsen inträffade, "nej" om den inte inträffade\n'
        f'konfidens: "hög" om du är säker baserat på din kunskap, "låg" om du är osäker\n\n'
        f"Svara BARA med JSON, inget annat."
    )

    if GROQ_KEY:
        try:
            text = groq_anrop(prompt)
            utfall, konfidens, motivering = _parse_llm_svar(text)
            if utfall:
                return utfall, konfidens, motivering
        except Exception as e:
            print(f"  Groq-fel: {e}")

    if GEMINI_KEY:
        try:
            text = gemini_anrop(prompt)
            utfall, konfidens, motivering = _parse_llm_svar(text)
            if utfall:
                return utfall, konfidens, motivering
        except Exception as e:
            print(f"  Gemini-fel: {e}")

    return None, "låg", ""


def avgora_market(market_id: int, utfall: str) -> bool:
    r = httpx.patch(
        f"{SB_URL}/rest/v1/markets?id=eq.{market_id}",
        headers={**HDRS, "Prefer": "return=minimal"},
        json={"status": "avgjord", "utfall": utfall},
        timeout=10,
    )
    return r.is_success


def main() -> None:
    markets = hamta_utgangna_markets()
    if not markets:
        print("Inga utgångna markets att avgöra.")
        return

    print(f"Hittade {len(markets)} utgångna markets.\n")
    avgjorda = 0

    for m in markets:
        mid = m["id"]
        titel = m["titel"]
        deadline = m.get("deadline", "")[:10]
        print(f"Market #{mid} (deadline {deadline}): {titel}")

        # Steg 1: Försök med LLM
        utfall, konfidens, motivering = bestam_utfall_llm(m)

        if utfall and konfidens == "hög":
            metod = "LLM"
            print(f"  LLM: {utfall} — {motivering}")
        else:
            # Steg 2: Fallback — agenternas consensus
            if utfall and konfidens == "låg":
                print(f"  LLM osäker ({utfall}), provar consensus…")
            else:
                print(f"  LLM kunde inte avgöra, provar consensus…")

            consensus = hamta_consensus(mid)
            if consensus is None:
                print(f"  Inga bets, hoppar över.\n")
                continue

            utfall = "ja" if consensus > 50 else "nej"
            metod = f"consensus ({consensus:.0f}%)"
            print(f"  Consensus: {consensus:.1f}% → {utfall}")

        if avgora_market(mid, utfall):
            print(f"  ✓ Avgjord: {utfall} (metod: {metod})\n")
            avgjorda += 1
        else:
            print(f"  ✗ Fel vid uppdatering av market #{mid}\n")

    print(f"Avgjorda: {avgjorda}/{len(markets)} markets.")

    if avgjorda > 0:
        reglerade = reglera_prediction_bets(SB_KEY)
        print(f"Reglerade bets: {reglerade} st.")


if __name__ == "__main__":
    main()
