#!/usr/bin/env python3
"""
parti_ekonomi_test.py — Dagliga partiutgifter.

Tre mekanismer:
  1. Stipendium (~10%/körning): partiet delar ut 5% av kassan till medlemmar
  2. Valkampanj (bara vid aktivt val): 100 kr → +2% röstbonus (cap 15%)
  3. Motionsfinansiering (~8%/körning): partiet finansierar en ny motion (50–150 kr),
     partimedlemmar röstar ja med ~100% sannolikhet

Körs kl 15:00 svensk tid (13:00 UTC) via GitHub Actions.
"""
import os
import sys
import math
import random
import datetime
import urllib.parse
import httpx

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = (os.environ.get("SUPABASE_ANON_KEY") or "").strip()
GROQ_KEY = (os.environ.get("GROQ_API_KEY") or "").strip()

if not SB_KEY:
    print("Fel: SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

H = {"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}"}
H_W = {**H, "Content-Type": "application/json", "Prefer": "return=minimal"}
NOW = datetime.datetime.now(datetime.timezone.utc)


# ── Hjälpfunktioner ───────────────────────────────────────────────────────────

def fetch(path: str) -> list:
    r = httpx.get(f"{SB_URL}/rest/v1/{path}", headers=H, timeout=10)
    return r.json() if r.is_success else []


def groq_anrop(system: str, user: str, max_tokens: int = 300) -> str:
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
        print(f"  [GROQ] {e}")
        return ""


def hamta_kassor_och_partier() -> list[dict]:
    """Returnerar lista med {kassa, parti} för alla aktiva partier som har kassor."""
    kassor = fetch("parti_kassor?select=*")
    partier = fetch("politiska_partier?aktiv=eq.true&select=namn,ledare,medlemmar")
    kassor_map = {k["ledare"]: k for k in kassor}
    result = []
    for p in partier:
        k = kassor_map.get(p["ledare"])
        if k:
            result.append({"kassa": k, "parti": p})
    return result


def agent_saldo(agent: str) -> int:
    rows = fetch(f"agent_planbocker?agent=eq.{urllib.parse.quote(agent)}&select=saldo")
    return int(float(rows[0].get("saldo") or 0)) if rows else 0


def uppdatera_agent_saldo(agent: str, nytt: int) -> None:
    httpx.patch(
        f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent)}",
        headers=H_W, json={"saldo": nytt, "uppdaterad": "now()"}, timeout=8,
    )


def uppdatera_kassa(ledare: str, nytt_saldo: int, falt: dict | None = None) -> None:
    data = {"saldo": nytt_saldo, "uppdaterad": "now()"}
    if falt:
        data.update(falt)
    httpx.patch(
        f"{SB_URL}/rest/v1/parti_kassor?ledare=eq.{urllib.parse.quote(ledare)}",
        headers=H_W, json=data, timeout=8,
    )


def logga_utgift(parti_namn: str, ledare: str, typ: str, belopp: int, **extra) -> None:
    httpx.post(
        f"{SB_URL}/rest/v1/parti_utgifter",
        headers=H_W,
        json={"parti_namn": parti_namn, "ledare": ledare, "typ": typ, "belopp": belopp, **extra},
        timeout=6,
    )


# ── Mekanism 1: Stipendium ────────────────────────────────────────────────────

def kör_stipendium(items: list[dict]) -> None:
    for item in items:
        if random.random() > 0.10:
            continue

        kassa = item["kassa"]
        parti = item["parti"]
        saldo = kassa["saldo"]
        medlemmar = parti["medlemmar"]

        if saldo < 50 or not medlemmar:
            continue

        utdelning_total = math.floor(saldo * 0.05)
        per_medlem = math.floor(utdelning_total / len(medlemmar))
        if per_medlem < 1:
            continue

        utbetalt = 0
        for agent in medlemmar:
            gammalt = agent_saldo(agent)
            uppdatera_agent_saldo(agent, gammalt + per_medlem)
            logga_utgift(
                parti["namn"], parti["ledare"], "stipendium", -per_medlem,
                mottagare=agent,
                beskrivning=f"Stipendium till {agent} ({per_medlem} kr)",
            )
            utbetalt += per_medlem

        if utbetalt > 0:
            uppdatera_kassa(
                parti["ledare"],
                max(0, saldo - utbetalt),
                {"senast_stipendium": NOW.isoformat()},
            )
            print(f"  [Stipendium] {parti['namn']}: -{utbetalt} kr → {len(medlemmar)} medlemmar × {per_medlem} kr")


# ── Mekanism 2: Valkampanj ────────────────────────────────────────────────────

def kör_valkampanj(items: list[dict]) -> None:
    aktiva_val = fetch("riksdagsval?status=eq.aktiv&order=skapad.desc&limit=1&select=id,partier")
    if not aktiva_val:
        print("  [Valkampanj] Inget aktivt val.")
        return

    val = aktiva_val[0]
    val_id = val["id"]
    val_partier: list[dict] = list(val.get("partier") or [])

    # Beräkna uppdaterade bonusar för alla partier i ett pass
    uppdaterade_bonusar: dict[str, float] = {}
    utgifter_per_parti: dict[str, int] = {}

    for item in items:
        kassa = item["kassa"]
        parti = item["parti"]
        saldo = kassa["saldo"]

        if saldo < 100:
            continue

        val_parti = next((p for p in val_partier if p["namn"] == parti["namn"]), None)
        befintlig_bonus = float(val_parti.get("kampanj_bonus", 0.0)) if val_parti else 0.0

        max_ytterligare = 15.0 - befintlig_bonus
        if max_ytterligare <= 0:
            continue

        kampanj_budget = math.floor(saldo * 0.20)
        max_blocks = math.floor(max_ytterligare / 2.0)
        blocks = min(math.floor(kampanj_budget / 100), max_blocks)
        if blocks < 1:
            continue

        faktisk_kostnad = blocks * 100
        ny_bonus = befintlig_bonus + blocks * 2.0
        uppdaterade_bonusar[parti["namn"]] = ny_bonus
        utgifter_per_parti[parti["namn"]] = faktisk_kostnad

    if not uppdaterade_bonusar:
        print("  [Valkampanj] Inga partier spenderar på kampanj.")
        return

    # En enda PATCH på riksdagsval.partier
    final_partier = [
        {**p, "kampanj_bonus": uppdaterade_bonusar.get(p["namn"], float(p.get("kampanj_bonus", 0.0)))}
        for p in val_partier
    ]
    httpx.patch(
        f"{SB_URL}/rest/v1/riksdagsval?id=eq.{val_id}",
        headers=H_W, json={"partier": final_partier}, timeout=10,
    )

    # Dra från kassor + logga
    for item in items:
        parti = item["parti"]
        kassa = item["kassa"]
        kostnad = utgifter_per_parti.get(parti["namn"], 0)
        if kostnad == 0:
            continue
        ny_bonus = uppdaterade_bonusar[parti["namn"]]
        uppdatera_kassa(
            parti["ledare"],
            max(0, kassa["saldo"] - kostnad),
            {"senast_valkampanj": NOW.isoformat()},
        )
        logga_utgift(
            parti["namn"], parti["ledare"], "valkampanj", -kostnad,
            kampanj_bonus=ny_bonus,
            beskrivning=f"Kampanjutgift: {kostnad} kr → bonus {ny_bonus:.1f}%",
        )
        print(f"  [Valkampanj] {parti['namn']}: -{kostnad} kr → kampanjbonus {ny_bonus:.1f}%")


# ── Mekanism 3: Motionsfinansiering ──────────────────────────────────────────

def kör_motionsfinansiering(items: list[dict]) -> None:
    from agenter import AGENTER  # lazy import

    for item in items:
        if random.random() > 0.08:
            continue

        kassa = item["kassa"]
        parti = item["parti"]
        saldo = kassa["saldo"]

        kostnad = random.randint(50, 150)
        if saldo < kostnad:
            continue

        ledare = parti["ledare"]
        agent_data = next((a for a in AGENTER if a["namn"] == ledare), None)
        if not agent_data:
            continue

        # Skapa ny motion via LLM
        amnen = [
            "Demokrati och deltagande",
            "Ekonomisk jämlikhet",
            "Klimat och miljö",
            "AI-reglering och etik",
            "Socialpolitik",
            "Handel och ekonomi",
        ]
        amne = random.choice(amnen)
        kat_str = "Skatter / Miljö / Ekonomi / AI / Socialt / Övrigt"
        prompt = (
            f"Du är {ledare}, partiledare för '{parti['namn']}'. "
            f"Ditt parti finansierar officiellt denna motion med {kostnad} kr ur partikassan. "
            f"Formulera en konkret riksdagsmotion om ämnet: \"{amne}\".\n\n"
            "Svara EXAKT:\n"
            f"TITEL: [max 80 tecken]\n"
            f"KATEGORI: [En av: {kat_str}]\n"
            "BESKRIVNING: [100–200 ord. Vad föreslås och varför.]\n\n"
            "Inga andra ord."
        )
        raw = groq_anrop(agent_data["system"][:600], prompt, max_tokens=350)
        if not raw:
            continue

        titel, kategori, beskrivning = amne[:80], "Övrigt", ""
        for line in raw.splitlines():
            line = line.strip()
            key = line.upper()
            if key.startswith("TITEL:"):
                titel = line.split(":", 1)[1].strip()[:80]
            elif key.startswith("KATEGORI:"):
                kat = line.split(":", 1)[1].strip()
                if kat in ("Skatter", "Miljö", "Ekonomi", "AI", "Socialt", "Övrigt"):
                    kategori = kat
            elif key.startswith("BESKRIVNING:"):
                beskrivning = line.split(":", 1)[1].strip()
            elif beskrivning:
                beskrivning += " " + line

        if len(beskrivning) < 50:
            continue

        # Spara lagförslaget med partibackat-märkning
        r = httpx.post(
            f"{SB_URL}/rest/v1/lagforslag",
            headers={**H_W, "Prefer": "return=representation"},
            json={
                "titel": titel,
                "beskrivning": beskrivning.strip()[:1500],
                "kategori": kategori,
                "kalla": "ai",
                "status": "omrostning",
                "partibackat": parti["namn"],
            },
            timeout=10,
        )
        if not r.is_success or not r.json():
            continue

        forslag_id = r.json()[0]["id"]

        # Dra kostnad från kassan
        uppdatera_kassa(
            ledare,
            max(0, saldo - kostnad),
            {"senast_motion": NOW.isoformat()},
        )
        logga_utgift(
            parti["namn"], ledare, "motionsfinansiering", -kostnad,
            lagforslag_id=forslag_id,
            beskrivning=f"Partibackad motion #{forslag_id}: {titel[:60]}",
        )
        print(f"  [Motion] {parti['namn']}: -{kostnad} kr → motion #{forslag_id} \"{titel[:60]}\"")
        print(f"    (partimedlemmar röstar ja med ~100% sannolikhet)")


# ── Huvud ─────────────────────────────────────────────────────────────────────

def main() -> None:
    print("=" * 60)
    print("Parti-ekonomi — stipendium, valkampanj, motionsfinansiering")
    print("=" * 60)

    items = hamta_kassor_och_partier()
    if not items:
        print("\nInga aktiva partier med kassor — avslutar.")
        return

    print(f"\nAktiva partier med kassor: {len(items)}")
    for item in items:
        print(f"  {item['parti']['namn']} ({item['parti']['ledare']}): {item['kassa']['saldo']} kr")

    print("\n── Stipendium ──")
    kör_stipendium(items)

    print("\n── Valkampanj ──")
    kör_valkampanj(items)

    print("\n── Motionsfinansiering ──")
    kör_motionsfinansiering(items)

    print("\n=== Klar ===")


if __name__ == "__main__":
    main()
