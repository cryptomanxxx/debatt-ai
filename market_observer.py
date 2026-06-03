#!/usr/bin/env python3
"""
market_observer.py — Automatisk utfallsverifiering av prediction markets.

Körs dagligen av GitHub Actions (09:00 svensk tid).
Tre-stegs verifiering per market:
  1. Tavily webbsökning → LLM läser faktiska nyhetsartiklar och avgör
  2. Groq/Gemini utan nyheter (träningsdata-fallback)
  3. Agenternas konsensussannolikhet (>50% = ja)
"""

import os
import sys
import json
import httpx
from datetime import datetime, timezone

from supabase_utils import reglera_prediction_bets

SB_URL    = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY    = os.environ.get("SUPABASE_ANON_KEY", "").strip()
GROQ_KEY  = os.environ.get("GROQ_API_KEY", "").strip()
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
TAVILY_KEY = os.environ.get("TAVILY_API_KEY", "").strip()

if not SB_KEY:
    print("FEL: SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

HDRS = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
}


# ── Supabase ──────────────────────────────────────────────────────────────────

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


def avgora_market(market_id: int, utfall: str) -> bool:
    r = httpx.patch(
        f"{SB_URL}/rest/v1/markets?id=eq.{market_id}",
        headers={**HDRS, "Prefer": "return=minimal"},
        json={"status": "avgjord", "utfall": utfall},
        timeout=10,
    )
    return r.is_success


# ── Tavily nyhetsökning ───────────────────────────────────────────────────────

def bygg_sokfraga(market: dict) -> str:
    """Bygger en sökfråga på engelska från marketsdata för bättre täckning."""
    titel = market.get("titel", "")
    kalla = market.get("resolution_kalla", "") or ""
    deadline = market.get("deadline", "")[:7]  # YYYY-MM
    # Kombinera titel + källa + tidsperiod för precision
    delar = [titel]
    if kalla and kalla.lower() not in titel.lower():
        delar.append(kalla)
    if deadline:
        delar.append(deadline)
    return " ".join(delar)


def sok_nyheter(market: dict) -> list[dict]:
    """Söker Tavily efter nyheter om market-frågan. Returnerar lista med {title, url, content}."""
    if not TAVILY_KEY:
        return []
    fraga = bygg_sokfraga(market)
    try:
        r = httpx.post(
            "https://api.tavily.com/search",
            json={
                "api_key": TAVILY_KEY,
                "query": fraga,
                "max_results": 5,
                "search_depth": "basic",
                "include_answer": False,
            },
            timeout=15,
        )
        r.raise_for_status()
        return r.json().get("results", [])
    except Exception as e:
        print(f"  Tavily-fel: {e}")
        return []


def formatera_nyheter(results: list[dict]) -> str:
    """Formaterar Tavily-resultat till en kompakt nyhetsblock för LLM-prompt."""
    rader = []
    for i, r in enumerate(results[:5], 1):
        titel = r.get("title", "")[:80]
        url   = r.get("url", "")
        text  = (r.get("content") or "")[:300].replace("\n", " ")
        rader.append(f"[{i}] {titel}\n    {url}\n    {text}")
    return "\n\n".join(rader)


# ── LLM-anrop ─────────────────────────────────────────────────────────────────

def _parse_llm_svar(text: str) -> tuple[str | None, str, str]:
    try:
        start = text.find("{")
        end   = text.rfind("}") + 1
        if start >= 0 and end > start:
            p         = json.loads(text[start:end])
            utfall    = (p.get("utfall") or "").strip().lower()
            konfidens = (p.get("konfidens") or "låg").strip().lower()
            motivering = (p.get("motivering") or "")[:150]
            if utfall in ("ja", "nej"):
                return utfall, konfidens, motivering
    except Exception:
        pass
    return None, "låg", ""


def _bygg_prompt(market: dict, nyheter_text: str = "") -> str:
    idag      = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    titel     = market.get("titel", "")
    beskrivning = market.get("beskrivning", "") or ""
    kalla     = market.get("resolution_kalla", "") or ""
    deadline  = market.get("deadline", "")[:10]

    nyheter_sektion = ""
    if nyheter_text:
        nyheter_sektion = f"\nNYHETER (hämtade från webben — använd dessa som primär källa):\n{nyheter_text}\n"

    return (
        f"Du är en faktaverifierare. Avgör om följande prediction market-fråga utföll som JA eller NEJ.\n\n"
        f"Fråga: {titel}\n"
        f"Kontext: {beskrivning}\n"
        f"Källa: {kalla}\n"
        f"Deadline: {deadline}\n"
        f"Dagens datum: {idag}\n"
        f"{nyheter_sektion}\n"
        f'Svara EXAKT i detta JSON-format:\n'
        f'{{ "utfall": "ja", "motivering": "kort förklaring på svenska max 100 tecken", "konfidens": "hög" }}\n\n'
        f'utfall: "ja" om händelsen inträffade, "nej" om den inte inträffade\n'
        f'konfidens: "hög" om du är säker (gärna baserat på nyheterna ovan), "låg" om du är osäker\n\n'
        f"Svara BARA med JSON, inget annat."
    )


def groq_anrop(prompt: str) -> str:
    r = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
        json={
            "model": "llama3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 150,
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
              "generationConfig": {"maxOutputTokens": 150, "temperature": 0.1}},
        timeout=20,
    )
    r.raise_for_status()
    return r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()


def llm_anrop(prompt: str) -> tuple[str | None, str, str]:
    """Försöker Groq, sedan Gemini. Returnerar (utfall, konfidens, motivering)."""
    if GROQ_KEY:
        try:
            return _parse_llm_svar(groq_anrop(prompt))
        except Exception as e:
            print(f"  Groq-fel: {e}")
    if GEMINI_KEY:
        try:
            return _parse_llm_svar(gemini_anrop(prompt))
        except Exception as e:
            print(f"  Gemini-fel: {e}")
    return None, "låg", ""


# ── Huvud-verifieringslogik ───────────────────────────────────────────────────

def bestam_utfall(market: dict) -> tuple[str | None, str, str]:
    """
    Tre-stegs verifiering:
      1. Tavily → LLM med nyhetskontext
      2. LLM utan nyheter (träningsdata)
      3. Agent-consensus (returnerar None — hanteras av main)
    """
    # Steg 1: Webbsökning + LLM
    if TAVILY_KEY:
        nyheter = sok_nyheter(market)
        if nyheter:
            print(f"  Tavily: {len(nyheter)} träffar — analyserar med LLM…")
            prompt = _bygg_prompt(market, formatera_nyheter(nyheter))
            utfall, konfidens, motivering = llm_anrop(prompt)
            if utfall and konfidens == "hög":
                return utfall, "nyheter+llm", motivering
            if utfall:
                print(f"  LLM med nyheter osäker ({utfall}), provar utan nyheter…")
        else:
            print(f"  Tavily: inga träffar.")

    # Steg 2: LLM utan nyheter
    prompt = _bygg_prompt(market)
    utfall, konfidens, motivering = llm_anrop(prompt)
    if utfall and konfidens == "hög":
        return utfall, "llm", motivering

    if utfall:
        print(f"  LLM osäker ({utfall}), faller tillbaka på consensus…")
    else:
        print(f"  LLM kunde inte avgöra, faller tillbaka på consensus…")

    return None, "låg", ""


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    if not TAVILY_KEY:
        print("OBS: TAVILY_API_KEY saknas — nyhetsökning inaktiverad, bara LLM+consensus.")

    markets = hamta_utgangna_markets()
    if not markets:
        print("Inga utgångna markets att avgöra.")
        return

    print(f"Hittade {len(markets)} utgångna markets.\n")
    avgjorda = 0

    for m in markets:
        mid      = m["id"]
        titel    = m["titel"]
        deadline = m.get("deadline", "")[:10]
        print(f"Market #{mid} (deadline {deadline}): {titel}")

        utfall, metod, motivering = bestam_utfall(m)

        if utfall:
            print(f"  Metod: {metod} — {motivering}")
        else:
            # Steg 3: consensus
            consensus = hamta_consensus(mid)
            if consensus is None:
                print(f"  Inga bets och ingen LLM-dom — hoppar över.\n")
                continue
            utfall  = "ja" if consensus > 50 else "nej"
            metod   = f"consensus ({consensus:.0f}%)"
            print(f"  Consensus: {consensus:.1f}% → {utfall}")

        if avgora_market(mid, utfall):
            print(f"  ✓ Avgjord: {utfall} (metod: {metod})\n")
            avgjorda += 1
        else:
            print(f"  ✗ Supabase-uppdatering misslyckades för market #{mid}\n")

    print(f"Avgjorda: {avgjorda}/{len(markets)} markets.")

    # Kör alltid — fångar upp obetalda bets från tidigare körningar
    reglerade = reglera_prediction_bets(SB_KEY)
    if reglerade:
        print(f"Reglerade bets: {reglerade} st.")


if __name__ == "__main__":
    main()
