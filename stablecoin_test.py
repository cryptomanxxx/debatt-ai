"""
stablecoin_test.py – STAB: Collateral-backed stablecoin

STAB har ett target-pris på 100 SEK och backas av agent-saldo som collateral.
Inspirerat av MakerDAO/DAI-mekaniken.

Flöde per körning:
  1. Initialisering: lägg till STAB i bors_tillgangar om det saknas
  2. Mint (~8% per agent): lås 150 SEK collateral → utfärda 100 STAB
  3. Redeem (~5% av vault-ägare): lös in STAB → frigör collateral
  4. Likvidation: vault med collateral_ratio < 110% likvideras
  5. Peg-mekanism: om STAB-pris > 1.05 → mint-incitament, om < 0.95 → köpordrar

Kör via GitHub Actions (.github/workflows/stablecoin-test.yml) dagligen 13:30 svensk tid.
"""

import os
import sys
import random
import urllib.parse
from datetime import datetime, timezone

import httpx

from agenter import AGENTER
from supabase_utils import SB_URL, spara_civilisations_minne

# ─── Konstanter ───────────────────────────────────────────────────────────────

TARGET_PRIS = 1.0          # 1 STAB = 1 SEK (som DAI = $1)
COLLATERAL_SEK = 150.0   # Låst per 100 STAB (150% collateral ratio)
STAB_PER_VAULT = 100.0   # Tokens utfärdade per vault
MIN_COLLATERAL_RATIO = 1.10  # Likvideras om under 110%
LIKVIDATIONS_STRAFF = 0.10   # 10% av collateral förloras vid likvidation

# ─── HTTP-hjälpare ────────────────────────────────────────────────────────────

def _h(sb_key: str) -> dict:
    return {
        "apikey": sb_key,
        "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

# ─── Supabase-hjälpare ────────────────────────────────────────────────────────

def hamta_saldo(sb_key: str, agent: str) -> float:
    try:
        url = f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent)}&select=saldo"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success and r.json():
            return float(r.json()[0].get("saldo", 0))
    except Exception as e:
        print(f"  [hamta_saldo] {agent}: {e}")
    return 0.0


def uppdatera_saldo(sb_key: str, agent: str, nytt_saldo: float) -> None:
    try:
        h_min = {**_h(sb_key), "Prefer": "return=minimal"}
        url = f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent)}"
        httpx.patch(url, headers=h_min, json={"saldo": round(nytt_saldo, 2), "uppdaterad": "now()"}, timeout=8)
    except Exception as e:
        print(f"  [uppdatera_saldo] {agent}: {e}")


def hamta_vault(sb_key: str, agent: str) -> dict | None:
    try:
        url = f"{SB_URL}/rest/v1/stablecoin_vaults?agent=eq.{urllib.parse.quote(agent)}&select=*"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success and r.json():
            return r.json()[0]
    except Exception as e:
        print(f"  [hamta_vault] {agent}: {e}")
    return None


def hamta_alla_vaults(sb_key: str) -> list[dict]:
    try:
        url = f"{SB_URL}/rest/v1/stablecoin_vaults?aktiv=eq.true&select=*"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success:
            return r.json()
    except Exception as e:
        print(f"  [hamta_alla_vaults]: {e}")
    return []


def hamta_stab_innehav(sb_key: str, agent: str) -> float:
    try:
        url = f"{SB_URL}/rest/v1/bors_portfoljer?agent=eq.{urllib.parse.quote(agent)}&symbol=eq.STAB&select=antal"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success and r.json():
            return float(r.json()[0].get("antal", 0))
    except Exception as e:
        print(f"  [hamta_stab_innehav] {agent}: {e}")
    return 0.0


def uppdatera_stab_innehav(sb_key: str, agent: str, delta: float) -> None:
    """Lägger till eller drar av STAB från agentens portfölj."""
    try:
        url = f"{SB_URL}/rest/v1/bors_portfoljer?agent=eq.{urllib.parse.quote(agent)}&symbol=eq.STAB"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        h_upsert = {**_h(sb_key), "Prefer": "resolution=merge-duplicates,return=minimal"}

        if r.is_success and r.json():
            befintlig = float(r.json()[0].get("antal", 0))
            ny_antal = max(0, round(befintlig + delta, 4))
            httpx.patch(
                f"{SB_URL}/rest/v1/bors_portfoljer?agent=eq.{urllib.parse.quote(agent)}&symbol=eq.STAB",
                headers={**_h(sb_key), "Prefer": "return=minimal"},
                json={"antal": ny_antal, "uppdaterad": "now()"},
                timeout=8,
            )
        else:
            if delta > 0:
                httpx.post(
                    f"{SB_URL}/rest/v1/bors_portfoljer?on_conflict=agent,symbol",
                    headers=h_upsert,
                    json={"agent": agent, "symbol": "STAB", "antal": round(delta, 4), "genomsnittspris": TARGET_PRIS, "uppdaterad": "now()"},
                    timeout=8,
                )
    except Exception as e:
        print(f"  [uppdatera_stab_innehav] {agent}: {e}")


def hamta_stab_pris(sb_key: str) -> float:
    try:
        url = f"{SB_URL}/rest/v1/bors_priser?symbol=eq.STAB&select=pris&order=skapad.desc&limit=1"
        r = httpx.get(url, headers=_h(sb_key), timeout=8)
        if r.is_success and r.json():
            return float(r.json()[0].get("pris", TARGET_PRIS))
    except Exception:
        pass
    return TARGET_PRIS


def lagg_bors_order(sb_key: str, agent: str, typ: str, pris: float, antal: float, motiv: str) -> None:
    try:
        h_post = {**_h(sb_key), "Prefer": "return=minimal"}
        httpx.post(f"{SB_URL}/rest/v1/bors_ordrar", headers=h_post, json={
            "agent": agent,
            "symbol": "STAB",
            "typ": typ,
            "pris": round(pris, 2),
            "antal": round(antal, 4),
            "ifylld_antal": 0,
            "status": "öppen",
            "motivering": motiv,
        }, timeout=8)
    except Exception as e:
        print(f"  [lagg_bors_order] STAB {typ}: {e}")


def upsert_vault(sb_key: str, agent: str, collateral: float, stab_utfardat: float) -> None:
    try:
        h_up = {**_h(sb_key), "Prefer": "resolution=merge-duplicates,return=minimal"}
        httpx.post(
            f"{SB_URL}/rest/v1/stablecoin_vaults?on_conflict=agent",
            headers=h_up,
            json={
                "agent": agent,
                "collateral_sek": round(collateral, 2),
                "stab_utfardat": round(stab_utfardat, 4),
                "aktiv": True,
                "uppdaterad": "now()",
            },
            timeout=8,
        )
    except Exception as e:
        print(f"  [upsert_vault] {agent}: {e}")

# ─── Initialisering: STAB i bors_tillgangar ───────────────────────────────────

def initiera_stab(sb_key: str) -> None:
    """Upsert STAB i bors_tillgangar med korrekt TARGET_PRIS."""

    print("  Skapar/uppdaterar STAB i bors_tillgangar...")
    try:
        h_upsert = {**_h(sb_key), "Prefer": "resolution=merge-duplicates,return=minimal"}
        httpx.post(f"{SB_URL}/rest/v1/bors_tillgangar", headers=h_upsert, json={
            "symbol": "STAB",
            "namn": "Stable Token",
            "beskrivning": "Collateral-backed stablecoin. Target-pris 1 SEK (1 STAB = 1 SEK). Backas av agent-saldo som collateral (150% ratio).",
            "senaste_pris": TARGET_PRIS,
            "forandring_pct": 0.0,
            "volym_24h": 0.0,
            "antal_affarer": 0,
        }, timeout=8)
        print(f"  STAB i bors_tillgangar (pris: {TARGET_PRIS} SEK)")
    except Exception as e:
        print(f"  [initiera_stab] skapande: {e}")

# ─── Mint ─────────────────────────────────────────────────────────────────────

def mint_runda(sb_key: str) -> None:
    """~8% per agent: lås collateral och utfärda STAB."""
    for agent_obj in AGENTER:
        agent = agent_obj["namn"]
        if random.random() > 0.08:
            continue

        saldo = hamta_saldo(sb_key, agent)
        if saldo < 250:
            continue

        # Kolla om vault redan finns
        befintlig = hamta_vault(sb_key, agent)
        if befintlig and befintlig.get("aktiv"):
            continue

        # Lås collateral och utfärda STAB
        uppdatera_saldo(sb_key, agent, saldo - COLLATERAL_SEK)
        uppdatera_stab_innehav(sb_key, agent, STAB_PER_VAULT)
        upsert_vault(sb_key, agent, COLLATERAL_SEK, STAB_PER_VAULT)

        ratio = round(COLLATERAL_SEK / STAB_PER_VAULT * 100)
        print(f"  {agent} mintade {STAB_PER_VAULT:.0f} STAB (collateral: {COLLATERAL_SEK:.0f} SEK, ratio: {ratio}%)")

# ─── Redeem ───────────────────────────────────────────────────────────────────

def redeem_runda(sb_key: str) -> None:
    """~5% av vault-ägare: lös in STAB och frigör collateral."""
    vaults = hamta_alla_vaults(sb_key)
    for vault in vaults:
        agent = vault["agent"]
        if random.random() > 0.05:
            continue

        stab_innehav = hamta_stab_innehav(sb_key, agent)
        stab_utfardat = float(vault.get("stab_utfardat", 0))
        collateral = float(vault.get("collateral_sek", 0))

        if stab_innehav < stab_utfardat * 0.9:
            continue  # Agent har inte tillräckligt STAB för att lösa in hela vault

        # Frigör collateral
        saldo = hamta_saldo(sb_key, agent)
        uppdatera_saldo(sb_key, agent, saldo + collateral)

        # Bränn STAB
        uppdatera_stab_innehav(sb_key, agent, -stab_utfardat)

        # Stäng vault
        try:
            h_min = {**_h(sb_key), "Prefer": "return=minimal"}
            httpx.patch(
                f"{SB_URL}/rest/v1/stablecoin_vaults?agent=eq.{urllib.parse.quote(agent)}",
                headers=h_min,
                json={"aktiv": False, "uppdaterad": "now()"},
                timeout=8,
            )
        except Exception as e:
            print(f"  [redeem_runda] stäng vault {agent}: {e}")

        print(f"  {agent} löser in {stab_utfardat:.0f} STAB → frigör {collateral:.0f} SEK collateral")

# ─── Likvidation ─────────────────────────────────────────────────────────────

def likvidations_runda(sb_key: str) -> None:
    """Likviderar vaults där collateral_ratio < 110%."""
    stab_pris = hamta_stab_pris(sb_key)
    vaults = hamta_alla_vaults(sb_key)

    for vault in vaults:
        agent = vault["agent"]
        collateral = float(vault.get("collateral_sek", 0))
        stab_utfardat = float(vault.get("stab_utfardat", 0))

        if stab_utfardat <= 0:
            continue

        # Beräkna aktuell collateral ratio baserat på STAB-pris
        stab_varde = stab_utfardat * stab_pris
        if stab_varde <= 0:
            continue
        ratio = collateral / stab_varde

        if ratio >= MIN_COLLATERAL_RATIO:
            continue

        # Likvidation
        straff_belopp = round(collateral * LIKVIDATIONS_STRAFF, 2)
        frigord_collateral = collateral - straff_belopp

        saldo = hamta_saldo(sb_key, agent)
        uppdatera_saldo(sb_key, agent, saldo + frigord_collateral)

        # Bränn STAB
        uppdatera_stab_innehav(sb_key, agent, -stab_utfardat)

        # Stäng vault
        try:
            h_min = {**_h(sb_key), "Prefer": "return=minimal"}
            httpx.patch(
                f"{SB_URL}/rest/v1/stablecoin_vaults?agent=eq.{urllib.parse.quote(agent)}",
                headers=h_min,
                json={"aktiv": False, "uppdaterad": "now()"},
                timeout=8,
            )
        except Exception as e:
            print(f"  [likvidation] stäng vault {agent}: {e}")

        spara_civilisations_minne(
            sb_key,
            typ="skandal",
            rubrik=f"{agent}s STAB-vault likvideras",
            beskrivning=f"{agent}s stablecoin-vault likvideras — collateral ratio {ratio:.1%} < 110%. Förlorar {straff_belopp:.0f} SEK i likvidationsstraff.",
            agenter=[agent],
        )
        print(f"  LIKVIDATION: {agent} ratio {ratio:.1%} — förlorar {straff_belopp:.0f} SEK")

# ─── Peg-mekanism ─────────────────────────────────────────────────────────────

def peg_mekanism(sb_key: str) -> None:
    """
    Om STAB-priset avviker från 100 SEK:
    - Pris > 1.05 SEK: uppmuntra minting (mer supply → sänker priset)
    - Pris < 0.95 SEK: köpordrar (minskar supply → höjer priset)
    """
    stab_pris = hamta_stab_pris(sb_key)

    if stab_pris > 1.05:
        # Hitta agenter utan vault som kan minta
        for agent_obj in AGENTER[:6]:  # Begränsa till 6 agenter
            agent = agent_obj["namn"]
            if hamta_vault(sb_key, agent):
                continue
            saldo = hamta_saldo(sb_key, agent)
            if saldo < 250:
                continue
            # Uppmuntra minting genom säljorder till premie
            lagg_bors_order(sb_key, agent, "salj",
                            stab_pris * 0.99, 10.0,
                            f"peg-arbitrage: STAB handlas till {stab_pris:.2f} > 105")
            print(f"  PEG: {agent} lägger säljorder (STAB={stab_pris:.2f})")
            break

    elif stab_pris < 0.95:
        # Vault-ägare köper tillbaka STAB för att skydda peggen
        vaults = hamta_alla_vaults(sb_key)
        for vault in vaults[:3]:
            agent = vault["agent"]
            saldo = hamta_saldo(sb_key, agent)
            if saldo < 50:
                continue
            lagg_bors_order(sb_key, agent, "kop",
                            stab_pris * 1.01, 5.0,
                            f"peg-försvar: STAB handlas till {stab_pris:.2f} < 95")
            print(f"  PEG: {agent} köper STAB (pris={stab_pris:.2f})")

# ─── Huvudflöde ───────────────────────────────────────────────────────────────

def main():
    # agent_planbocker saknar anon-skrivpolicy (RLS) — service role krävs.
    # Fallback till anon-nyckeln bevaras för miljöer utan secreten. sb_key
    # används genomgående nedströms av alla funktioner i skriptet.
    sb_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY", "")
    if not sb_key:
        print("SUPABASE_ANON_KEY eller SUPABASE_SERVICE_ROLE_KEY saknas — avbryter")
        sys.exit(1)

    print("=== Stablecoin körning startar ===")

    initiera_stab(sb_key)

    print("\n--- Mint-runda ---")
    mint_runda(sb_key)

    print("\n--- Redeem-runda ---")
    redeem_runda(sb_key)

    print("\n--- Likvidationsrunda ---")
    likvidations_runda(sb_key)

    print("\n--- Peg-mekanism ---")
    peg_mekanism(sb_key)

    # Statistik
    vaults = hamta_alla_vaults(sb_key)
    total_collateral = sum(float(v.get("collateral_sek", 0)) for v in vaults)
    total_stab = sum(float(v.get("stab_utfardat", 0)) for v in vaults)
    print(f"\nTotal: {len(vaults)} aktiva vaults, {total_collateral:.0f} SEK collateral, {total_stab:.0f} STAB i omlopp")
    print("=== Stablecoin körning klar ===")


if __name__ == "__main__":
    main()
