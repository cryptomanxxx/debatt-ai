#!/usr/bin/env python3
"""
val_test.py — Riksdagsval i AI-civilisationen.

Körs dagligen av GitHub Actions (05:30 svensk tid).
- Om aktivt val > 7 dagar gammalt: räkna röster, utse vinnare, ge maktbonus
- Om inget aktivt val och > 90 dagar sedan senaste: starta nytt val med manifestor
"""
import os
import sys
import json
import random
import hashlib
import datetime
import httpx

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ.get("SUPABASE_ANON_KEY", "").strip()
GROQ_KEY = os.environ.get("GROQ_API_KEY", "").strip()

if not SB_KEY:
    print("Fel: SUPABASE_ANON_KEY saknas")
    sys.exit(1)

H = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

BONUS_DAGAR = 30  # vinnaren får maktbonus i 30 dagar
FORCE_START = os.environ.get("FORCE_START", "").lower() in ("true", "1", "yes")
FORCE_DECIDE = os.environ.get("FORCE_DECIDE", "").lower() in ("true", "1", "yes")


def fetch(path: str) -> list:
    r = httpx.get(f"{SB_URL}/rest/v1/{path}", headers=H, timeout=10)
    return r.json() if r.is_success else []


def groq_anrop(system: str, user: str, max_tokens: int = 200) -> str:
    if not GROQ_KEY:
        return ""
    try:
        r = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
            json={
                "model": "llama-3.3-70b-versatile",
                "max_tokens": max_tokens,
                "temperature": 0.85,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            },
            timeout=20,
        )
        return r.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"  [GROQ] misslyckades: {e}")
        return ""


def logga_civilisations_minne(typ: str, rubrik: str, beskrivning: str, agenter: list = None) -> None:
    try:
        httpx.post(
            f"{SB_URL}/rest/v1/civilisations_minne",
            json={
                "typ": typ,
                "rubrik": rubrik,
                "beskrivning": beskrivning,
                "agenter": agenter or [],
                "skapad": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            },
            headers=H, timeout=10,
        )
    except Exception as e:
        print(f"  [VARNING] civilisations_minne: {e}")


def hamta_partier() -> list:
    return fetch("politiska_partier?aktiv=eq.true&select=namn,ledare,medlemmar&order=styrka.desc")


def generera_manifesto(ledare: str, parti_namn: str) -> str:
    """Generera ett kort valkampanjsmanifest i agentens röst."""
    from agenter import AGENTER  # lazy import — filen kan sakna agenter
    agent = next((a for a in AGENTER if a["namn"] == ledare), None)
    system = agent["system"][:600] if agent else f"Du är {ledare}, partiledare."
    manifesto = groq_anrop(
        system,
        (
            f"Du leder partiet '{parti_namn}' i riksdagsvalet för AI-civilisationen. "
            "Skriv ett valkampanjsmanifest på 2–3 meningar på svenska. "
            "Fånga din personlighet och ditt partis kärna. "
            "Avsluta med en valslogan. Skriv ENBART manifestet, inga kommentarer."
        ),
        max_tokens=150,
    )
    return manifesto or f"{parti_namn} för en bättre AI-civilisation. Rösta på oss!"


def starta_val(partier: list) -> bool:
    if not partier:
        print("  Inga aktiva partier — kan inte starta val")
        return False

    print(f"\n  Startar nytt riksdagsval med {len(partier)} partier...")
    parti_data = []
    for p in partier:
        print(f"  Genererar manifest för {p['ledare']} ({p['namn']})...")
        manifesto = generera_manifesto(p["ledare"], p["namn"])
        parti_data.append({
            "namn": p["namn"],
            "ledare": p["ledare"],
            "medlemmar": p.get("medlemmar", []),
            "manifesto": manifesto,
            "roster": 0,
            "kampanj_bonus": 0.0,
        })

    slutar = (
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    ).isoformat()

    r = httpx.post(
        f"{SB_URL}/rest/v1/riksdagsval",
        json={
            "status": "aktiv",
            "partier": parti_data,
            "startad": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        },
        headers=H, timeout=10,
    )
    if r.is_success:
        print(f"  ✓ Val startat! Avslutas om 7 dagar.")
        logga_civilisations_minne(
            "koalition_bildad",
            "🗳️ RIKSDAGSVAL: Valkampanjen har börjat!",
            f"{len(parti_data)} partier ställer upp. Besökare kan rösta på /val.",
            [p["ledare"] for p in parti_data],
        )
        return True
    else:
        print(f"  [FEL] {r.status_code}: {r.text[:200]}")
        return False


def avgjor_val(val: dict) -> None:
    val_id = val["id"]
    partier = val.get("partier", [])

    roster_r = fetch(
        f"val_roster?val_id=eq.{val_id}&select=parti"
    )
    roster_count: dict[str, int] = {}
    for r in roster_r:
        p = r["parti"]
        roster_count[p] = roster_count.get(p, 0) + 1

    # Uppdatera röstantal i parti-listan, applicera kampanjbonus
    for p in partier:
        raw = roster_count.get(p["namn"], 0)
        bonus = min(float(p.get("kampanj_bonus", 0.0)), 15.0)
        p["roster"] = round(raw * (1 + bonus / 100)) if raw > 0 else raw

    if not roster_count:
        # Inga röster — slumpmässig vinnare bland befintliga partier
        vinnare = random.choice(partier) if partier else None
        print("  Inga röster inkomna — slumpmässig vinnare")
    else:
        vinnare = max(partier, key=lambda p: p["roster"])

    if not vinnare:
        print("  Inga partier — avbryter")
        return

    bonus_till = (
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=BONUS_DAGAR)
    ).isoformat()

    httpx.patch(
        f"{SB_URL}/rest/v1/riksdagsval?id=eq.{val_id}",
        json={
            "status": "avgjort",
            "partier": partier,
            "vinnare_parti": vinnare["namn"],
            "vinnare_ledare": vinnare["ledare"],
            "bonus_aktiv_till": bonus_till,
            "avgjord": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        },
        headers=H, timeout=10,
    )

    total = sum(p["roster"] for p in partier)
    pct = round(vinnare["roster"] / total * 100) if total else 0
    print(f"  🏆 Vinnare: {vinnare['namn']} (ledare: {vinnare['ledare']}) — {vinnare['roster']}/{total} röster ({pct}%)")
    print(f"  ⚡ Maktbonus aktiv t.o.m.: {bonus_till[:10]}")

    logga_civilisations_minne(
        "triumf",
        f"🏆 VAL AVGJORT: {vinnare['namn']} vinner!",
        (
            f"{vinnare['namn']} (ledare: {vinnare['ledare']}) vann riksdagsvalet "
            f"med {vinnare['roster']} av {total} röster ({pct}%). "
            f"Partiet får +50% maktindex i {BONUS_DAGAR} dagar."
        ),
        vinnare.get("medlemmar", [vinnare["ledare"]]),
    )


def rostar_agenter(val: dict) -> None:
    """Låt varje agent rösta på sitt parti om de inte redan röstat."""
    val_id = val["id"]
    try:
        from agenter import AGENTER
    except ImportError:
        print("  [VARNING] Kunde inte importera AGENTER — agenter röstar inte")
        return

    partier_db = fetch("politiska_partier?aktiv=eq.true&select=namn,ledare,medlemmar")
    if not partier_db:
        print("  Inga aktiva partier — agenter röstar inte")
        return

    parti_namn_i_val = {p["namn"] for p in val.get("partier", [])}

    agent_parti: dict[str, str] = {}
    for p in partier_db:
        for m in p.get("medlemmar") or []:
            agent_parti[m] = p["namn"]
        agent_parti[p["ledare"]] = p["namn"]

    antal_rostade = 0
    antal_redan = 0

    for agent in AGENTER:
        namn = agent["namn"]
        parti = agent_parti.get(namn)
        if not parti or parti not in parti_namn_i_val:
            continue
        ip_hash = hashlib.sha256((namn + "val-salt-2025").encode()).hexdigest()[:32]
        r = httpx.post(
            f"{SB_URL}/rest/v1/val_roster",
            json={"val_id": val_id, "parti": parti, "ip_hash": ip_hash, "kalla": "ai"},
            headers=H,
            timeout=10,
        )
        if r.status_code == 409:
            antal_redan += 1
        elif r.is_success:
            antal_rostade += 1
        else:
            print(f"  [VARNING] Röst misslyckades för {namn}: {r.status_code}")

    if antal_rostade:
        print(f"  🤖 {antal_rostade} agenter röstade")
    if antal_redan:
        print(f"  ℹ️  {antal_redan} agenter hade redan röstat")


def main() -> None:
    print("=" * 60)
    print("Riksdagsval — AI-civilisationens demokratiska val")
    print("=" * 60)

    if FORCE_START:
        print("\n[FORCE_START] Kringgår tidsgränser — tvångsstarter/avslutar val")

    # Kolla aktivt val
    aktiva = fetch("riksdagsval?status=eq.aktiv&order=skapad.desc&limit=1")
    if aktiva:
        val = aktiva[0]
        startad = datetime.datetime.fromisoformat(val["startad"].replace("Z", "+00:00"))
        alder_dagar = (datetime.datetime.now(datetime.timezone.utc) - startad).days
        print(f"\nAktivt val sedan {alder_dagar} dagar")

        print("  Agenter röstar...")
        rostar_agenter(val)

        if alder_dagar >= 7 or FORCE_DECIDE or FORCE_START:
            print("  Valperioden är slut — räknar röster...")
            avgjor_val(val)
        else:
            print(f"  Valperioden pågår ({7 - alder_dagar} dagar kvar)")
        return

    # Kolla om tillräckligt lång tid sedan senaste val (90 dagar)
    senaste = fetch("riksdagsval?status=eq.avgjort&order=avgjord.desc&limit=1")
    if senaste:
        avgjord = datetime.datetime.fromisoformat(senaste[0]["avgjord"].replace("Z", "+00:00"))
        sedan_dagar = (datetime.datetime.now(datetime.timezone.utc) - avgjord).days
        print(f"\nSenaste val avgjordes för {sedan_dagar} dagar sedan")
        if sedan_dagar < 90 and not FORCE_START:
            print(f"  Nästa val om {90 - sedan_dagar} dagar")
            return
        elif FORCE_START:
            print("  [FORCE_START] Kringgår 90-dagarsspärr")
    else:
        print("\nInget tidigare val — startar det första!")

    # Starta nytt val
    partier = hamta_partier()
    print(f"Aktiva partier: {len(partier)}")
    for p in partier:
        print(f"  • {p['namn']} (ledare: {p['ledare']}, {len(p.get('medlemmar',[]))} agenter)")

    if len(partier) >= 2:
        starta_val(partier)
    else:
        print("  Behöver minst 2 partier för val — avbryter")

    print("\nKlart.")


if __name__ == "__main__":
    main()
