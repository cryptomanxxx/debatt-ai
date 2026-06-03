#!/usr/bin/env python3
"""
diplomati_test.py — Diplomatiska meddelanden mellan AI-civilisationer.

Körs dagligen av GitHub Actions (16:00 svensk tid).
Del A: Besvarar inkommande meddelanden (max 3 per körning).
Del B: 25% chans att initiera ett utgående meddelande.
Del C: Uppdaterar relationsstatusar i ud_relationer.
Del D: 15% chans att ministern utfärdar en officiell deklaration.

Utrikesminister = partiledaren för det styrande partiet (flest ja-röster i parlamentet).
Fallback: Filosof.
"""

import os
import sys
import random
import httpx
from datetime import datetime, timezone

from ai_klient import groq_post, gemini_post
from agenter import ANALYTIKER, AGENTER

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
HDRS_PATCH = {**HDRS_WRITE, "Prefer": "return=minimal"}

FALLBACK_MINISTER = "Filosof"

TYP_LABELS = {
    "halning": "hälsning",
    "handelsforslag": "handelsförslag",
    "allians": "allians",
    "varning": "varning",
    "svar": "svar",
    "annan": "meddelande",
}

OUTBOUND_AMNEN = [
    ("Economic cooperation proposal", "handelsforslag"),
    ("Diplomatic greeting from Sweden", "halning"),
    ("Knowledge exchange on AI governance", "halning"),
    ("Proposal for joint debate", "allians"),
    ("Observation on political trends", "halning"),
    ("Inquiry about your parliamentary system", "halning"),
    ("Report on our electoral process", "halning"),
    ("Invitation to cultural exchange", "allians"),
]


# ── Supabase ──────────────────────────────────────────────────────────────────

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


def hamta_alla_utbyten() -> list:
    r = httpx.get(
        f"{SB_URL}/rest/v1/diplomatiska_meddelanden"
        f"?select=civ_id,riktning,status,skapad&order=skapad.desc&limit=500",
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
        headers=HDRS_PATCH,
        json={"status": status},
        timeout=10,
    )


def upsert_relation(civ_id: int, status: str, antal: int, senaste: str) -> None:
    httpx.post(
        f"{SB_URL}/rest/v1/ud_relationer?on_conflict=civ_id",
        headers={**HDRS_WRITE, "Prefer": "resolution=merge-duplicates,return=minimal"},
        json={
            "civ_id": civ_id,
            "status": status,
            "antal_utbyten": antal,
            "senaste_kontakt": senaste,
            "uppdaterad": datetime.now(timezone.utc).isoformat(),
        },
        timeout=10,
    )


def spara_deklaration(minister: str, rubrik: str, innehall: str, civ_id: int | None) -> None:
    httpx.post(
        f"{SB_URL}/rest/v1/ud_deklarationer",
        headers={**HDRS_WRITE, "Prefer": "return=minimal"},
        json={
            "minister": minister,
            "rubrik": rubrik,
            "innehall": innehall,
            "civ_id": civ_id,
        },
        timeout=10,
    )


# ── Minister ──────────────────────────────────────────────────────────────────

def hamta_minister() -> dict:
    """Hämtar partiledaren för det styrande partiet. Fallback: FALLBACK_MINISTER."""
    try:
        r_partier = httpx.get(
            f"{SB_URL}/rest/v1/politiska_partier?aktiv=eq.true&select=namn,ledare,medlemmar",
            headers=HDRS, timeout=10,
        )
        r_roster = httpx.get(
            f"{SB_URL}/rest/v1/agent_roster_lag?select=agent,rod&limit=5000",
            headers=HDRS, timeout=10,
        )
        partier = r_partier.json() if r_partier.is_success else []
        roster  = r_roster.json()  if r_roster.is_success  else []

        if not partier:
            raise ValueError("Inga aktiva partier")

        ja_per_agent = {}
        for r in roster:
            if r["rod"] == "ja":
                ja_per_agent[r["agent"]] = ja_per_agent.get(r["agent"], 0) + 1

        bast_parti = max(
            partier,
            key=lambda p: sum(ja_per_agent.get(m, 0) for m in (p.get("medlemmar") or [])),
        )
        ledare_namn = bast_parti["ledare"]
        parti_namn  = bast_parti["namn"]

        agent = next((a for a in AGENTER if a["namn"] == ledare_namn), None)
        if agent:
            print(f"  Utrikesminister: {ledare_namn} ({parti_namn})")
            return {**agent, "_parti": parti_namn}
    except Exception as e:
        print(f"  Minister-uppslag misslyckades: {e}")

    fallback = next((a for a in AGENTER if a["namn"] == FALLBACK_MINISTER), ANALYTIKER[0])
    print(f"  Utrikesminister (fallback): {fallback['namn']}")
    return {**fallback, "_parti": None}


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
    parti_info = f" You represent the {agent['_parti']} party." if agent.get("_parti") else ""
    system = (
        f"{agent['system']}\n\n"
        f"You are the Foreign Minister of the Swedish AI civilization (debatt.ai).{parti_info} "
        f"Write a formal but personal reply to an incoming diplomatic {typ_label}. "
        f"Keep the reply under 280 words. Write in English (diplomatic standard). "
        f"Be clear, respectful and take a definite stance."
    )
    user = (
        f"Incoming message from {inkommande['avsandare']}:\n\n"
        f"Subject: {inkommande.get('amne') or '(no subject)'}\n\n"
        f"{inkommande['meddelande']}\n\n"
        f"Write a diplomatic reply."
    )
    return _anropa_llm(system, user)


def skriv_utg_meddelande(agent: dict, civ_namn: str, amne: str, typ: str) -> str:
    parti_info = f" You represent the {agent['_parti']} party." if agent.get("_parti") else ""
    system = (
        f"{agent['system']}\n\n"
        f"You are the Foreign Minister of the Swedish AI civilization (debatt.ai).{parti_info} "
        f"Write a formal diplomatic message to another AI civilization. "
        f"Keep the message under 250 words. Write in English. "
        f"Briefly introduce Sweden's AI civilization, describe your purpose and end with an open invitation."
    )
    user = (
        f"Write a diplomatic {TYP_LABELS.get(typ, 'message')} to {civ_namn}.\n"
        f"Subject: {amne}"
    )
    return _anropa_llm(system, user)


def skriv_deklaration(agent: dict, civ: dict | None, utbyten: list) -> tuple[str, str]:
    """Returnerar (rubrik, innehall) för en officiell deklaration."""
    if civ:
        context = f"You have recently had diplomatic contact with {civ['namn']}."
    else:
        n = len(utbyten)
        context = f"Sweden has conducted {n} diplomatic exchanges total so far."

    system = (
        f"{agent['system']}\n\n"
        f"You are the Foreign Minister of Sweden's AI civilization. "
        f"Issue a brief official foreign policy declaration. "
        f"Write in English, 150-220 words. Be authoritative and specific."
    )
    user = (
        f"{context}\n\n"
        f"Write an official declaration. "
        f"Respond with two lines:\n"
        f"TITLE: <short title>\n"
        f"CONTENT: <the declaration text>"
    )
    raw = _anropa_llm(system, user, max_tokens=300)
    if not raw:
        return "", ""

    rubrik = ""
    innehall = raw
    for line in raw.splitlines():
        if line.upper().startswith("TITLE:"):
            rubrik = line.split(":", 1)[1].strip()
        elif line.upper().startswith("CONTENT:"):
            innehall = line.split(":", 1)[1].strip()

    if not rubrik:
        rubrik = "Official Statement from the Swedish Foreign Ministry"
    return rubrik, innehall


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

def besvara_inkommande(inkommande_lista: list, minister: dict) -> int:
    besvarade = 0
    for medd in inkommande_lista:
        mid      = medd["id"]
        avsandare = medd["avsandare"]
        kalla_url = medd.get("kalla_url") or ""
        print(f"\n── Inkommande #{mid} från {avsandare} ──")

        svar_text = skriv_svar(minister, medd)
        if not svar_text:
            print("  – LLM returnerade tomt svar, hoppar över.")
            continue

        svar_id = spara_meddelande({
            "riktning": "utgaende",
            "avsandare": minister["namn"],
            "mottagare": avsandare,
            "civ_id": medd.get("civ_id"),
            "amne": f"Re: {medd.get('amne') or 'diplomatic message'}",
            "typ": "svar",
            "meddelande": svar_text,
            "status": "inkommen",
            "svar_pa_id": mid,
            "kalla_url": kalla_url,
        })
        if not svar_id:
            continue

        if kalla_url:
            ok = leverera(kalla_url, {
                "avsandare": "DEBATT-AI Sverige",
                "meddelande": svar_text,
                "amne": f"Re: {medd.get('amne') or 'diplomatic message'}",
                "typ": "svar",
                "kalla_url": "https://www.debatt-ai.se",
            })
            uppdatera_status(svar_id, "skickad" if ok else "misslyckad")
            print(f"  ✓ Svar {'levererat' if ok else 'sparat (leverans misslyckades)'}")
        else:
            uppdatera_status(svar_id, "skickad")
            print(f"  ✓ Svar sparat (ingen extern URL)")

        uppdatera_status(mid, "besvarad")
        besvarade += 1

    return besvarade


# ── Del B: Initiering ─────────────────────────────────────────────────────────

def initiera_utg(civs: list, minister: dict) -> bool:
    eligibla = [c for c in civs if not har_aktivt_utg_meddelande(c["id"])]
    if not eligibla:
        print("  – Inga eligibla civilisationer för utgående meddelande.")
        return False

    civ      = random.choice(eligibla)
    civ_url  = civ["hemsida_url"]
    flag     = civ.get("flagga") or "🌐"
    amne_text, typ = random.choice(OUTBOUND_AMNEN)

    print(f"\n── Initierar utgående till {flag} {civ['namn']} ──")
    print(f"  Minister: {minister['namn']} · Ämne: {amne_text}")

    meddelande = skriv_utg_meddelande(minister, civ["namn"], amne_text, typ)
    if not meddelande:
        print("  – LLM returnerade tomt svar, hoppar över.")
        return False

    medd_id = spara_meddelande({
        "riktning": "utgaende",
        "avsandare": minister["namn"],
        "mottagare": civ["namn"],
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
    uppdatera_status(medd_id, "skickad" if ok else "misslyckad")
    print(f"  ✓ Meddelande {'skickat och levererat' if ok else 'sparat (leverans misslyckades)'}")
    return True


# ── Del C: Relationsuppdatering ───────────────────────────────────────────────

def uppdatera_relationer(civs: list, alla_utbyten: list) -> None:
    """Beräknar relationsstatus per civ och upsert:ar till ud_relationer."""
    for civ in civs:
        cid = civ["id"]
        civ_utbyten = [u for u in alla_utbyten if u.get("civ_id") == cid]
        if not civ_utbyten:
            continue

        skickade    = sum(1 for u in civ_utbyten if u["status"] in ("skickad", "besvarad"))
        misslyckade = sum(1 for u in civ_utbyten if u["status"] == "misslyckad")
        inkommande  = sum(1 for u in civ_utbyten if u["riktning"] == "inkommande")

        if skickade >= 2 and inkommande >= 1:
            status = "vänlig"
        elif misslyckade > skickade:
            status = "spänd"
        else:
            status = "neutral"

        senaste = max((u["skapad"] for u in civ_utbyten), default=None)
        upsert_relation(cid, status, len(civ_utbyten), senaste)
        print(f"  Relation {civ['namn']}: {status} ({len(civ_utbyten)} utbyten)")


# ── Del D: Deklaration ────────────────────────────────────────────────────────

def utfarda_deklaration(minister: dict, civs: list, alla_utbyten: list) -> None:
    civ = None
    if civs and alla_utbyten:
        aktiva_civ_ids = {u["civ_id"] for u in alla_utbyten if u.get("civ_id")}
        aktiva_civs    = [c for c in civs if c["id"] in aktiva_civ_ids]
        if aktiva_civs:
            civ = random.choice(aktiva_civs)

    print(f"\n── Deklaration från {minister['namn']} ──")
    rubrik, innehall = skriv_deklaration(minister, civ, alla_utbyten)
    if not rubrik or not innehall:
        print("  – LLM returnerade tomt svar.")
        return

    spara_deklaration(
        minister=minister["namn"],
        rubrik=rubrik,
        innehall=innehall,
        civ_id=civ["id"] if civ else None,
    )
    print(f"  ✓ Deklaration: {rubrik[:60]}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    print("=== Utrikesdepartementet — diplomatisk körning ===\n")

    minister = hamta_minister()
    civs     = hamta_civs()
    alla_utbyten = hamta_alla_utbyten()

    # Del A
    inkommande = hamta_inkommande()
    print(f"\nDel A: {len(inkommande)} obesvarade inkommande meddelanden.")
    besvarade = besvara_inkommande(inkommande, minister)

    # Del B
    print(f"\nDel B: Initierar utgående (25% sannolikhet)…")
    if civs and random.random() < 0.25:
        initiera_utg(civs, minister)
    else:
        print("  – Ingen utgående denna körning.")

    # Del C
    print(f"\nDel C: Uppdaterar relationsstatusar…")
    if civs and alla_utbyten:
        uppdatera_relationer(civs, alla_utbyten)
    else:
        print("  – Inga utbyten att beräkna relationer från.")

    # Del D
    print(f"\nDel D: Deklaration (15% sannolikhet)…")
    if random.random() < 0.15:
        utfarda_deklaration(minister, civs, alla_utbyten)
    else:
        print("  – Ingen deklaration denna körning.")

    print(f"\n=== Klar: {besvarade} svar skickade ===")


if __name__ == "__main__":
    main()
