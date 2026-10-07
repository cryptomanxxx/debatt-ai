#!/usr/bin/env python3
"""
cem_test.py – Constitutional Evolution Module (CEM)
====================================================
Varje vecka föreslår systemet en ändring av en grundlagsparameter baserat på
aktuell ekonomisk data (Gini, oligarkirisk). Alla 24 agenter röstar viktat
efter sitt maktindex. 2/3 majoritet krävs för att ändringen ska antas.

Körs fredagar 16:00 svensk tid via GitHub Actions (cem-test.yml).

Flöde:
  1. Hämta aktuella grundlagsparametrar och ekonomisk status
  2. LLM genererar ett motiverat ändringsförslag
  3. Alla 24 agenter röstar (LLM-call per agent, viktat av maktindex)
  4. Räkna viktade röster — 2/3 majoritet av total maktindex → antagen
  5. Uppdatera constitution_rules om antagen
  6. Logga till civilisations_minne

Kräver: SUPABASE_ANON_KEY
"""

import json
import os
import random
import sys
import urllib.parse
from datetime import datetime, timezone, timedelta

import httpx

from supabase_utils import hamta_maktindex_ranking, spara_civilisations_minne, _llm_spel
from agent import AGENTER

# ---------------------------------------------------------------------------
# Konfig
# ---------------------------------------------------------------------------

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
MAJORITET_DEFAULT = 0.667   # används om voting_majority saknas i DB

# ---------------------------------------------------------------------------
# HTTP-hjälpare  (identiska med domstol_test.py)
# ---------------------------------------------------------------------------


def sb_get(h: dict, path: str, timeout: int = 10) -> list:
    url = f"{SB_URL}/rest/v1/{path}"
    try:
        r = httpx.get(url, headers=h, timeout=timeout)
        if r.status_code == 200:
            return r.json()
        print(f"  [VARNING] GET {path} → {r.status_code}: {r.text[:200]}")
        return []
    except Exception as e:
        print(f"  [FEL] GET {path}: {e}")
        return []


def sb_post_repr(h: dict, path: str, data: dict, timeout: int = 10) -> dict | None:
    """POST med return=representation — returnerar sparad rad."""
    url = f"{SB_URL}/rest/v1/{path}"
    headers_rep = {**h, "Prefer": "return=representation"}
    try:
        r = httpx.post(url, headers=headers_rep, json=data, timeout=timeout)
        if r.status_code in (200, 201):
            result = r.json()
            return result[0] if isinstance(result, list) else result
        print(f"  [VARNING] POST {path} → {r.status_code}: {r.text[:200]}")
        return None
    except Exception as e:
        print(f"  [FEL] POST {path}: {e}")
        return None


def sb_patch(h: dict, path: str, data: dict, timeout: int = 10) -> bool:
    url = f"{SB_URL}/rest/v1/{path}"
    try:
        r = httpx.patch(url, headers=h, json=data, timeout=timeout)
        return r.status_code in (200, 204)
    except Exception as e:
        print(f"  [FEL] PATCH {path}: {e}")
        return False


# ---------------------------------------------------------------------------
# LLM
# ---------------------------------------------------------------------------


def llm_anrop(system: str, prompt: str, max_tokens: int = 300) -> str:
    """Provar alla AI-providers i dynamisk rankad ordning (ai_klient.py)."""
    return _llm_spel(system, prompt, max_tokens=max_tokens)


# ---------------------------------------------------------------------------
# Steg 1: Hämta ekonomisk status
# ---------------------------------------------------------------------------


def hamta_ekonomisk_status(h: dict) -> dict:
    """Hämtar senaste oligarki-snapshot och beräknar genomsnittssaldo."""
    status = {
        "gini": 0.5,
        "oligarki_risk": 50,
        "mobilitet": 50,
        "snitt_saldo": 1000,
        "topp3_andel": 0.5,
    }
    snap = sb_get(h, "oligarki_historik?order=datum.desc&limit=1&select=gini,oligarki_risk,mobilitet,top3_andel")
    if snap:
        s = snap[0]
        status["gini"] = s.get("gini") or 0.5
        status["oligarki_risk"] = s.get("oligarki_risk") or 50
        status["mobilitet"] = s.get("mobilitet") or 50
        status["topp3_andel"] = s.get("top3_andel") or 0.5

    planbocker = sb_get(h, "agent_planbocker?select=saldo&agent=neq.Statskassa")
    if planbocker:
        saldos = [max(0, p.get("saldo") or 0) for p in planbocker]
        if saldos:
            status["snitt_saldo"] = round(sum(saldos) / len(saldos))
    return status


# ---------------------------------------------------------------------------
# Steg 2: Hämta aktuella grundlagsparametrar
# ---------------------------------------------------------------------------


def hamta_regler(h: dict) -> list[dict]:
    return sb_get(h, "constitution_rules?order=id.asc")


# ---------------------------------------------------------------------------
# Steg 3: LLM genererar ändringsförslag
# ---------------------------------------------------------------------------


def generera_forslag(regler: list[dict], ekon: dict) -> dict | None:
    """Ber LLM välja en parameter att ändra och motivera varför."""
    regler_text = "\n".join(
        f"  - {r['id']} ({r['namn']}): nuvarande {r['varde']} {r['enhet']}, "
        f"tillåtet {r['min_varde']}–{r['max_varde']} {r['enhet']}"
        for r in regler
    )

    system = (
        "Du är ett neutralt analysinstitut som utvärderar AI-civilisationens konstitution. "
        "Du baserar dina förslag på ekonomiska indikatorer och väljer en parameter att ändra "
        "för att förbättra civilisationens jämlikhet och dynamik. "
        "Svara alltid på svenska med ett JSON-objekt och inget annat."
    )
    prompt = (
        f"Aktuella ekonomiska indikatorer:\n"
        f"  Gini-koefficient: {ekon['gini']:.3f} (0=perfekt jämlikhet, 1=total koncentration)\n"
        f"  Oligarkirisk: {ekon['oligarki_risk']}/100\n"
        f"  Social mobilitet: {ekon['mobilitet']}/100\n"
        f"  Topp-3 förmögenhetsandel: {round(ekon['topp3_andel'] * 100)}%\n"
        f"  Genomsnittssaldo: {ekon['snitt_saldo']} kr\n\n"
        f"Aktuella grundlagsparametrar:\n{regler_text}\n\n"
        f"Välj EN parameter att ändra. Motivera valet utifrån de ekonomiska indikatorerna. "
        f"Svara med JSON:\n"
        '{{"regel_id": "parameter-id", "foreslagen_varde": 123, "motivering": "...2-3 meningar..."}}'
    )

    svar = llm_anrop(system, prompt, max_tokens=300)
    if not svar:
        return None

    # Parsa JSON
    clean = svar.strip()
    if clean.startswith("```"):
        lines = clean.split("\n")
        clean = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        start, end = clean.find("{"), clean.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(clean[start:end])
            except json.JSONDecodeError:
                pass
    print(f"  [VARNING] Kunde inte parsa LLM-förslag: {svar[:200]}")
    return None


# ---------------------------------------------------------------------------
# Steg 4: Spara ändringsförslag
# ---------------------------------------------------------------------------


def spara_amendment(h: dict, regel: dict, forslag: dict) -> dict | None:
    gammalt = float(regel["varde"])
    nytt = float(forslag["foreslagen_varde"])

    # Klamma till tillåtet intervall
    nytt = max(float(regel["min_varde"]), min(float(regel["max_varde"]), nytt))
    nytt = round(nytt, 3)

    if abs(nytt - gammalt) < 0.001:
        print(f"  [INFO] Ingen reell ändring (gammalt={gammalt}, nytt={nytt}) — hoppar över")
        return None

    nu = datetime.now(timezone.utc)
    rostning_slutar = (nu + timedelta(hours=24)).isoformat()

    data = {
        "regel_id": regel["id"],
        "foreslagen_av": "System",
        "gammalt_varde": gammalt,
        "foreslagen_varde": nytt,
        "motivering": forslag.get("motivering", "Ingen motivering angiven."),
        "status": "öppen",
        "rostning_slutar": rostning_slutar,
    }
    return sb_post_repr(h, "constitution_amendments", data)


# ---------------------------------------------------------------------------
# Steg 5: Agenter röstar
# ---------------------------------------------------------------------------


def agent_rostar(agent: dict, amendment: dict, regel: dict, ekon: dict) -> tuple[str, str]:
    """Returnerar ('for'|'mot', motivering)."""
    namn = agent["namn"]
    pers = agent.get("personlighet", "")

    system = (
        f"Du är {namn}. {pers} "
        "Du är medborgare i AI-civilisationen och röstar på ett förslag om att ändra grundlagen. "
        "Svara alltid på svenska. Svara bara med ett JSON-objekt."
    )
    prompt = (
        f"Förslag: Ändra '{regel['namn']}' från {amendment['gammalt_varde']} {regel['enhet']} "
        f"till {amendment['foreslagen_varde']} {regel['enhet']}.\n\n"
        f"Motivering från analysinstitutet: {amendment['motivering']}\n\n"
        f"Aktuell Gini: {ekon['gini']:.3f}, Oligarkirisk: {ekon['oligarki_risk']}/100\n\n"
        f"Röstar du för eller mot denna ändring? "
        f"Svara med JSON:\n"
        '{{"rod": "for" eller "mot", "motivering": "din karaktärsenliga 1-mening-motivering"}}'
    )

    svar = llm_anrop(system, prompt, max_tokens=150)
    if not svar:
        # default: rösta slumpmässigt
        return random.choice(["for", "mot"]), "Ingen motivering."

    clean = svar.strip()
    if clean.startswith("```"):
        lines = clean.split("\n")
        clean = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    parsed = None
    try:
        parsed = json.loads(clean)
    except json.JSONDecodeError:
        s, e = clean.find("{"), clean.rfind("}") + 1
        if s != -1 and e > s:
            try:
                parsed = json.loads(clean[s:e])
            except json.JSONDecodeError:
                pass

    if parsed and parsed.get("rod") in ("for", "mot"):
        return parsed["rod"], parsed.get("motivering", "")
    return random.choice(["for", "mot"]), "Tekniskt fel — slumpmässig röst."


def kör_röstning(sb_key: str, h: dict, amendment: dict, regel: dict, ekon: dict, maktindex: dict[str, float]) -> dict:
    """Låt alla 24 agenter rösta. Returnerar {for_ki, mot_ki, for_antal, mot_antal}."""
    for_ki = 0.0
    mot_ki = 0.0
    for_antal = 0
    mot_antal = 0

    agenter_shuffled = list(AGENTER)
    random.shuffle(agenter_shuffled)

    for agent in agenter_shuffled:
        namn = agent["namn"]
        ki = maktindex.get(namn, 1.0)  # minst 1.0 så alla räknas

        rod, motivering = agent_rostar(agent, amendment, regel, ekon)

        # Spara röst
        h_repr = {**h, "Prefer": "return=minimal"}
        httpx.post(
            f"{SB_URL}/rest/v1/constitution_roster",
            headers=h_repr,
            json={
                "amendment_id": amendment["id"],
                "agent": namn,
                "rod": rod,
                "maktindex": round(ki, 2),
                "motivering": motivering,
            },
            timeout=10,
        )

        if rod == "for":
            for_ki += ki
            for_antal += 1
        else:
            mot_ki += ki
            mot_antal += 1

        symbol = "✅" if rod == "for" else "❌"
        print(f"    {symbol} {namn} (ki={ki:.1f}): {motivering[:60]}")

    return {
        "for_ki": round(for_ki, 2),
        "mot_ki": round(mot_ki, 2),
        "for_antal": for_antal,
        "mot_antal": mot_antal,
    }


# ---------------------------------------------------------------------------
# Steg 6: Avgör och verkställ
# ---------------------------------------------------------------------------


def avgör_amendment(sb_key: str, h: dict, amendment: dict, roster: dict, regler_map: dict, majoritet_krav: float) -> str:
    """Räknar viktat utfall och uppdaterar DB. Returnerar 'antagen'|'avvisad'."""
    for_ki = roster["for_ki"]
    mot_ki = roster["mot_ki"]
    total_ki = for_ki + mot_ki
    andel_for = for_ki / total_ki if total_ki > 0 else 0.0

    print(f"\n  Röstresultat: {roster['for_antal']} för / {roster['mot_antal']} mot")
    print(f"  Viktat maktindex: {for_ki:.1f} för / {mot_ki:.1f} mot")
    print(f"  Andel för: {round(andel_for * 100, 1)}% (krav: {round(majoritet_krav * 100, 1)}%)")

    antagen = andel_for >= majoritet_krav
    status = "antagen" if antagen else "avvisad"

    # Uppdatera amendment
    sb_patch(
        h,
        f"constitution_amendments?id=eq.{amendment['id']}",
        {
            "status": status,
            "roster_for": roster["for_antal"],
            "roster_mot": roster["mot_antal"],
            "maktindex_for": roster["for_ki"],
            "maktindex_mot": roster["mot_ki"],
        },
    )

    if antagen:
        regel_id = amendment["regel_id"]
        nytt_varde = amendment["foreslagen_varde"]
        sb_patch(
            h,
            f"constitution_rules?id=eq.{urllib.parse.quote(regel_id)}",
            {"varde": nytt_varde, "senast_andrad": datetime.now(timezone.utc).isoformat()},
        )
        regel = regler_map.get(regel_id, {})
        print(f"\n  ✅ ANTAGEN: {regel.get('namn', regel_id)} ändras {amendment['gammalt_varde']} → {nytt_varde} {regel.get('enhet', '')}")

        spara_civilisations_minne(
            sb_key,
            typ="triumf",
            rubrik=f"Grundlagsändring antagen: {regel.get('namn', regel_id)} {amendment['gammalt_varde']} → {nytt_varde}",
            beskrivning=(
                f"AI-civilisationens konstitution uppdaterades. {amendment['motivering']} "
                f"Röstresultat: {roster['for_antal']} för / {roster['mot_antal']} mot "
                f"({round(andel_for * 100, 1)}% av viktat maktindex)."
            ),
            agenter=[],
        )
    else:
        regel = regler_map.get(amendment["regel_id"], {})
        print(f"\n  ❌ AVVISAD: {regel.get('namn', amendment['regel_id'])} förblir {amendment['gammalt_varde']}")

        spara_civilisations_minne(
            sb_key,
            typ="skandal",
            rubrik=f"Grundlagsändring avvisad: {regel.get('namn', amendment['regel_id'])}",
            beskrivning=(
                f"Förslag om att ändra {regel.get('namn', '')} från {amendment['gammalt_varde']} "
                f"till {amendment['foreslagen_varde']} {regel.get('enhet', '')} röstades ned. "
                f"{roster['mot_antal']} agenter röstade mot ({round((1 - andel_for) * 100, 1)}% av viktat maktindex)."
            ),
            agenter=[],
        )

    return status


# ---------------------------------------------------------------------------
# Huvud-flöde
# ---------------------------------------------------------------------------


def main():
    sb_key = (
        os.environ.get("SUPABASE_SERVICE_KEY")
        or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("SUPABASE_ANON_KEY")
    )

    if not sb_key:
        print("FEL: SUPABASE_ANON_KEY saknas", file=sys.stderr)
        sys.exit(1)

    h = {
        "apikey": sb_key,
        "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    print("=" * 60)
    print("  CONSTITUTIONAL EVOLUTION MODULE")
    print("=" * 60)
    print(f"  Datum: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n")

    # --- Steg 1: Ekonomisk status ---
    print("[STEG 1] Hämtar ekonomisk status...")
    ekon = hamta_ekonomisk_status(h)
    print(f"  Gini: {ekon['gini']:.3f}  Oligarkirisk: {ekon['oligarki_risk']}  Mobilitet: {ekon['mobilitet']}")
    print(f"  Topp-3 andel: {round(ekon['topp3_andel'] * 100)}%  Snitt saldo: {ekon['snitt_saldo']} kr")

    # --- Steg 2: Hämta parametrar ---
    print("\n[STEG 2] Hämtar grundlagsparametrar...")
    regler = hamta_regler(h)
    if not regler:
        print("  [FEL] Inga parametrar i constitution_rules — kör supabase_cem.sql först")
        sys.exit(1)
    regler_map = {r["id"]: r for r in regler}

    # Hämta majoritetskrav
    majoritet_regel = regler_map.get("voting_majority")
    majoritet_krav = float(majoritet_regel["varde"]) if majoritet_regel else MAJORITET_DEFAULT
    print(f"  {len(regler)} parametrar hittade. Majoritetskrav: {round(majoritet_krav * 100)}%")

    # --- Steg 3: Maktindex för alla agenter ---
    print("\n[STEG 3] Beräknar maktindex...")
    ranking = hamta_maktindex_ranking(sb_key)
    maktindex_map: dict[str, float] = {agent: ki for agent, ki in ranking}
    if not maktindex_map:
        # Fail-open: ge alla 1.0
        maktindex_map = {a["namn"]: 1.0 for a in AGENTER}
        print("  [VARNING] Maktindex ej tillgängligt — alla agenter viktas lika (1.0)")
    else:
        top3 = ranking[:3]
        print(f"  Topp 3: {', '.join(f'{n} ({ki:.1f})' for n, ki in top3)}")

    # --- Steg 4: LLM genererar förslag ---
    print("\n[STEG 4] Genererar ändringsförslag via LLM...")
    # Exkludera voting_majority från förslaget — den är metanivå
    möjliga_regler = [r for r in regler if r["id"] != "voting_majority"]
    forslag_raw = generera_forslag(möjliga_regler, ekon)

    if not forslag_raw or "regel_id" not in forslag_raw:
        print("  LLM-förslag misslyckades — väljer slumpmässig parameter")
        vald_regel = random.choice(möjliga_regler)
        # Föreslå +/- 10% beroende på Gini
        delta = 0.9 if ekon["gini"] > 0.5 else 1.1
        nytt_v = round(float(vald_regel["varde"]) * delta)
        forslag_raw = {
            "regel_id": vald_regel["id"],
            "foreslagen_varde": nytt_v,
            "motivering": f"Automatiskt förslag baserat på Gini {ekon['gini']:.3f}.",
        }

    regel_id = forslag_raw["regel_id"]
    if regel_id not in regler_map:
        print(f"  [FEL] LLM angav okänd regel_id '{regel_id}' — avbryter")
        sys.exit(1)

    vald_regel = regler_map[regel_id]
    print(f"  Föreslår: {vald_regel['namn']} {vald_regel['varde']} → {forslag_raw['foreslagen_varde']} {vald_regel['enhet']}")
    print(f"  Motivering: {forslag_raw.get('motivering', '')[:120]}")

    # --- Steg 5: Spara amendment ---
    print("\n[STEG 5] Sparar ändringsförslag...")
    amendment = spara_amendment(h, vald_regel, forslag_raw)
    if not amendment:
        print("  Inget amendment att rösta på — avslutar")
        sys.exit(0)
    print(f"  Amendment #{amendment['id']} skapad.")

    # --- Steg 6: Röstning ---
    print(f"\n[STEG 6] Röstning ({len(AGENTER)} agenter)...")
    roster = kör_röstning(sb_key, h, amendment, vald_regel, ekon, maktindex_map)

    # --- Steg 7: Avgör ---
    print("\n[STEG 7] Avgör utfall...")
    utfall = avgör_amendment(sb_key, h, amendment, roster, regler_map, majoritet_krav)

    print(f"\n{'=' * 60}")
    print(f"  KLART — Amendment #{amendment['id']}: {utfall.upper()}")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    main()
