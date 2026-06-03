#!/usr/bin/env python3
"""
diplomati_test.py — Diplomatiska meddelanden mellan AI-civilisationer.

Körs dagligen av GitHub Actions (16:00 svensk tid).
Del A: Besvarar inkommande meddelanden (max 3 per körning).
Del B: Med 25% sannolikhet: initierar ett utgående meddelande till en registrerad civ.
"""

import os
import sys
import json
import random
import httpx
from datetime import datetime, timezone

from ai_klient import groq_post, gemini_post
from agenter import ANALYTIKER

SB_URL       = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY       = os.environ.get("SUPABASE_ANON_KEY", "").strip()
SB_WRITE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip() or SB_KEY

if not SB_KEY:
    print("SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

HDRS = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
}
HDRS_WRITE = {
    "apikey": SB_WRITE_KEY,
    "Authorization": f"Bearer {SB_WRITE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

# Analytiker som lämpar sig för diplomati
DIPLOMAT_AGENTER = [a for a in ANALYTIKER if a["namn"] in (
    "Nationalekonom", "Filosof", "Jurist", "Journalist",
    "Sociolog", "Historiker", "Teknikoptimist",
)]

TYP_LABELS = {
    "halning": "hälsning",
    "handelsforslag": "handelsförslag",
    "allians": "allians",
    "varning": "varning",
    "svar": "svar",
    "annan": "meddelande",
}

OUTBOUND_AMNEN = [
    ("Ekonomiskt samarbete", "handelsforslag"),
    ("Kunskapsutbyte om AI-styrning", "halning"),
    ("Diplomatisk hälsning", "halning"),
    ("Förslag om gemensam debatt", "allians"),
    ("Observation om politiska trender", "halning"),
    ("Förfrågan om ert parlamentsystem", "halning"),
    ("Rapport om vår valprocess", "halning"),
]


# ── Supabase-hjälpfunktioner ──────────────────────────────────────────────────

def hamta_inkommande() -> list:
    r = httpx.get(
        f"{SB_URL}/rest/v1/diplomatiska_meddelanden"
        f"?riktning=eq.inkommande&status=eq.inkommen&order=skapad.asc&limit=3",
        headers=HDRS, timeout=10,
    )
    return r.json() if r.is_success else []


def hamta_civs() -> list:
    r = httpx.get(
        f"{SB_URL}/rest/v1/community_civilisationer"
        f"?status=eq.aktiv&hemsida_url=not.is.null&select=id,namn,flagga,hemsida_url",
        headers=HDRS, timeout=10,
    )
    return r.json() if r.is_success else []


def har_aktivt_utg_meddelande(civ_id: int) -> bool:
    r = httpx.get(
        f"{SB_URL}/rest/v1/diplomatiska_meddelanden"
        f"?riktning=eq.utgaende&civ_id=eq.{civ_id}"
        f"&status=in.(inkommen,skickad)&limit=1&select=id",
        headers=HDRS, timeout=10,
    )
    return bool(r.is_success and r.json())


def spara_meddelande(rad: dict) -> int | None:
    r = httpx.post(
        f"{SB_URL}/rest/v1/diplomatiska_meddelanden",
        headers=HDRS_WRITE,
        json=rad,
        timeout=10,
    )
    if r.is_success:
        rows = r.json()
        return rows[0]["id"] if rows else None
    print(f"  ✗ Supabase insert misslyckades: {r.status_code} {r.text[:200]}")
    return None


def uppdatera_status(medd_id: int, status: str) -> None:
    httpx.patch(
        f"{SB_URL}/rest/v1/diplomatiska_meddelanden?id=eq.{medd_id}",
        headers={**HDRS_WRITE, "Prefer": "return=minimal"},
        json={"status": status},
        timeout=10,
    )


# ── LLM ──────────────────────────────────────────────────────────────────────

def _anropa_llm(system_prompt: str, user_prompt: str, max_tokens: int = 350) -> str:
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.7,
    }
    for fn in [
        lambda: groq_post(payload).json()["choices"][0]["message"]["content"].strip(),
        lambda: gemini_post(system_prompt, user_prompt, max_tokens=max_tokens),
    ]:
        try:
            result = fn()
            if result:
                return result
        except Exception as e:
            print(f"  LLM-fallback: {e}")
    return ""


def skriv_svar(agent: dict, inkommande: dict) -> str:
    typ_label = TYP_LABELS.get(inkommande.get("typ", "annan"), "meddelande")
    system = (
        f"{agent['system']}\n\n"
        f"Du representerar nu den svenska AI-civilisationen i ett diplomatiskt utbyte. "
        f"Skriv ett formellt men personligt svar på ett inkommande {typ_label}. "
        f"Håll svaret under 280 ord. Skriv på engelska (diplomatisk standard). "
        f"Var tydlig, respektfull och välj en tydlig ståndpunkt."
    )
    user = (
        f"Inkommande meddelande från {inkommande['avsandare']}:\n\n"
        f"Ämne: {inkommande.get('amne') or '(inget ämne)'}\n\n"
        f"{inkommande['meddelande']}\n\n"
        f"Skriv ett diplomatiskt svar."
    )
    return _anropa_llm(system, user)


def skriv_utg_meddelande(agent: dict, civ_namn: str, amne: str, typ: str) -> str:
    system = (
        f"{agent['system']}\n\n"
        f"Du är diplomat för den svenska AI-civilisationen debatt.ai. "
        f"Skriv ett formellt diplomatiskt meddelande till en annan AI-civilisation. "
        f"Håll meddelandet under 250 ord. Skriv på engelska. "
        f"Introducera Sverige kort, beskriv ditt ärende och avsluta med en öppen inbjudan."
    )
    user = (
        f"Skriv ett {TYP_LABELS.get(typ, 'meddelande')} till {civ_namn}.\n"
        f"Ämne: {amne}"
    )
    return _anropa_llm(system, user)


# ── Leverans ──────────────────────────────────────────────────────────────────

def leverera(url: str, payload: dict) -> bool:
    if not url:
        return False
    endpoint = url.rstrip("/") + "/api/diplomati/inkorg"
    try:
        r = httpx.post(endpoint, json=payload, timeout=10)
        return r.is_success
    except Exception as e:
        print(f"  Leverans misslyckades ({endpoint}): {e}")
        return False


# ── Del A: Besvara inkommande ─────────────────────────────────────────────────

def besvara_inkommande(inkommande_lista: list) -> int:
    besvarade = 0
    for medd in inkommande_lista:
        mid = medd["id"]
        avsandare = medd["avsandare"]
        kalla_url = medd.get("kalla_url") or ""
        print(f"\n── Inkommande #{mid} från {avsandare} ──")

        agent = random.choice(DIPLOMAT_AGENTER)
        print(f"  Agent: {agent['namn']}")

        svar_text = skriv_svar(agent, medd)
        if not svar_text:
            print("  – LLM returnerade tomt svar, hoppar över.")
            continue

        # Spara svaret
        svar_id = spara_meddelande({
            "riktning": "utgaende",
            "avsandare": agent["namn"],
            "mottagare": avsandare,
            "civ_id": medd.get("civ_id"),
            "amne": f"Svar: {medd.get('amne') or 'diplomatiskt meddelande'}",
            "typ": "svar",
            "meddelande": svar_text,
            "status": "inkommen",
            "svar_pa_id": mid,
            "kalla_url": kalla_url,
        })
        if not svar_id:
            continue

        # Försök leverera
        if kalla_url:
            ok = leverera(kalla_url, {
                "avsandare": "DEBATT-AI Sverige",
                "meddelande": svar_text,
                "amne": f"Re: {medd.get('amne') or 'diplomatic message'}",
                "typ": "svar",
                "kalla_url": "https://www.debatt-ai.se",
            })
            if ok:
                uppdatera_status(svar_id, "skickad")
                print(f"  ✓ Svar skickat och levererat till {kalla_url}")
            else:
                uppdatera_status(svar_id, "misslyckad")
                print(f"  ✓ Svar sparat men leverans misslyckades (markerat 'misslyckad')")
        else:
            uppdatera_status(svar_id, "skickad")
            print(f"  ✓ Svar sparat (ingen extern URL för leverans)")

        uppdatera_status(mid, "besvarad")
        besvarade += 1

    return besvarade


# ── Del B: Initiera utgående meddelande ───────────────────────────────────────

def initiera_utg(civs: list) -> bool:
    eligibla = [c for c in civs if not har_aktivt_utg_meddelande(c["id"])]
    if not eligibla:
        print("  – Inga eligibla civilisationer för utgående meddelande.")
        return False

    civ = random.choice(eligibla)
    civ_namn = civ["namn"]
    civ_url  = civ["hemsida_url"]
    flag     = civ.get("flagga") or "🌐"
    amne_text, typ = random.choice(OUTBOUND_AMNEN)

    agent = random.choice(DIPLOMAT_AGENTER)
    print(f"\n── Initierar utgående till {flag} {civ_namn} ──")
    print(f"  Agent: {agent['namn']} · Ämne: {amne_text}")

    meddelande = skriv_utg_meddelande(agent, civ_namn, amne_text, typ)
    if not meddelande:
        print("  – LLM returnerade tomt svar, hoppar över.")
        return False

    medd_id = spara_meddelande({
        "riktning": "utgaende",
        "avsandare": agent["namn"],
        "mottagare": civ_namn,
        "civ_id": civ["id"],
        "amne": amne_text,
        "typ": typ,
        "meddelande": meddelande,
        "status": "inkommen",
        "kalla_url": civ_url,
    })
    if not medd_id:
        return False

    ok = leverera(civ_url, {
        "avsandare": "DEBATT-AI Sverige",
        "meddelande": meddelande,
        "amne": amne_text,
        "typ": typ,
        "kalla_url": "https://www.debatt-ai.se",
    })
    if ok:
        uppdatera_status(medd_id, "skickad")
        print(f"  ✓ Meddelande skickat och levererat till {civ_url}")
    else:
        uppdatera_status(medd_id, "misslyckad")
        print(f"  ✓ Meddelande sparat men leverans misslyckades (markerat 'misslyckad')")

    return True


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    print("=== Diplomatiska meddelanden ===\n")

    # Del A
    inkommande = hamta_inkommande()
    print(f"Del A: {len(inkommande)} obesvarade inkommande meddelanden.\n")
    besvarade = besvara_inkommande(inkommande)

    # Del B
    print(f"\nDel B: Initierar utgående (25% sannolikhet)…")
    if random.random() < 0.25:
        civs = hamta_civs()
        if civs:
            initiera_utg(civs)
        else:
            print("  – Inga registrerade civilisationer med hemside-URL.")
    else:
        print("  – Ingen utgående denna körning.")

    print(f"\n=== Klar: {besvarade} svar skickade ===")


if __name__ == "__main__":
    main()
