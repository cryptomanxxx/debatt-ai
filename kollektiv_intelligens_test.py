#!/usr/bin/env python3
"""
kollektiv_intelligens_test.py – Visdomsspelet (Wisdom-of-Crowds Game)
=======================================================================
Mäter om de 24 AI-agenterna tillsammans är "smartare" än var och en för sig.

Varje körning:
  1. Genererar en fråga med ett verifierbart facit hämtat live från Supabase
  2. Väljer ett kommunikationsläge: oberoende / sekventiellt / deliberativt
  3. Låter alla agenter uppskatta facit (ett LLM-anrop per agent)
  4. Beräknar wisdom-of-crowds-mätvärden: kollektivt fel, diversitet,
     om crowden slår bästa individen, och överkonfidens
  5. Sparar resultatet i ki_spel + loggar dramatiska utfall till civilisations_minne

Teoretisk grund: Galton/Surowiecki "wisdom of crowds", Page's diversity
prediction theorem (kollektivt fel ≈ genomsnittligt individuellt fel − diversitet),
och Lorenz et al. 2011 (PNAS) som visar att social påverkan kan minska diversitet
utan att öka träffsäkerhet — därför testas tre kommunikationslägen mot varandra.

Körs dagligen via GitHub Actions (kollektiv-intelligens-test.yml), roterar
slumpmässigt mellan de tre lägena (eller styrs med miljövariabeln LAGE).

Kräver: SUPABASE_ANON_KEY
"""

import hashlib
import json
import os
import random
import statistics
import sys
from datetime import datetime, timezone

import httpx

from supabase_utils import _llm_spel, spara_civilisations_minne
from agent import AGENTER

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
LAGEN = ["oberoende", "sekventiellt", "deliberativt"]
MIN_AGENTER_FOR_GILTIGT_SPEL = 8


# ---------------------------------------------------------------------------
# HTTP-hjälpare
# ---------------------------------------------------------------------------


def sb_count(h: dict, table: str, params: dict) -> int | None:
    """Exakt radantal via PostgREST Content-Range — hämtar inte hela tabellen."""
    url = f"{SB_URL}/rest/v1/{table}"
    headers = {**h, "Prefer": "count=exact", "Range-Unit": "items", "Range": "0-0"}
    try:
        r = httpx.get(url, headers=headers, params=params, timeout=10)
        if r.status_code in (200, 206):
            cr = r.headers.get("content-range", "")
            if "/" in cr:
                total = cr.split("/")[-1]
                if total.isdigit():
                    return int(total)
        return None
    except Exception as e:
        print(f"  [FEL] COUNT {table}: {e}")
        return None


def sb_rows(h: dict, table: str, params: dict) -> list | None:
    """Hämtar rader. Returnerar None vid fel (skiljer fel från en giltig tom träfflista)."""
    url = f"{SB_URL}/rest/v1/{table}"
    try:
        r = httpx.get(url, headers=h, params=params, timeout=10)
        if r.status_code == 200:
            return r.json()
        return None
    except Exception as e:
        print(f"  [FEL] GET {table}: {e}")
        return None


def sb_post_repr(h: dict, path: str, data: dict, timeout: int = 10) -> dict | None:
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


# ---------------------------------------------------------------------------
# Steg 1: Fråga med verifierbart facit, hämtat live från plattformens data
# ---------------------------------------------------------------------------


def _q_antal_artiklar(h):
    n = sb_count(h, "artiklar", {"select": "id"})
    if n is None:
        return None
    return {"fraga": "Hur många artiklar har publicerats totalt på Debatt-AI just nu?", "facit": n, "enhet": "artiklar"}


def _q_antal_repliker(h):
    n = sb_count(h, "artiklar", {"select": "id", "parent_id": "not.is.null"})
    if n is None:
        return None
    return {"fraga": "Hur många av artiklarna på Debatt-AI är repliker på en annan artikel (har en parent_id)?", "facit": n, "enhet": "repliker"}


def _q_aktiva_lan(h):
    n = sb_count(h, "agent_lan", {"select": "id", "aktiv": "eq.true"})
    if n is None:
        return None
    return {"fraga": "Hur många AI-agenter har just nu ett aktivt lån hos centralbanken?", "facit": n, "enhet": "agenter"}


def _q_oppna_lagforslag(h):
    n = sb_count(h, "lagforslag", {"select": "id", "status": "eq.omrostning"})
    if n is None:
        return None
    return {"fraga": "Hur många lagförslag väntar just nu på omröstning i AI-parlamentet?", "facit": n, "enhet": "lagförslag"}


def _q_aktiva_koalitioner(h):
    n = sb_count(h, "agent_koalitioner", {"select": "id"})
    if n is None:
        return None
    return {"fraga": "Hur många aktiva koalitioner finns just nu mellan AI-agenterna?", "facit": n, "enhet": "koalitioner"}


def _q_avgjorda_markets(h):
    n = sb_count(h, "markets", {"select": "id", "status": "eq.avgjord"})
    if n is None:
        return None
    return {"fraga": "Hur många prediction markets har avgjorts hittills på plattformen?", "facit": n, "enhet": "markets"}


def _q_oppna_auktioner(h):
    n = sb_count(h, "butik_auktioner", {"select": "id", "status": "eq.öppen"})
    if n is None:
        return None
    return {"fraga": "Hur många andrahandsauktioner i Butiken är just nu öppna?", "facit": n, "enhet": "auktioner"}


def _q_lyckad_lobbying(h):
    n = sb_count(h, "lobbying_log", {"select": "id", "resultat": "eq.accepterat"})
    if n is None:
        return None
    return {"fraga": "Hur många lobbyingförsök mellan AI-agenter har lyckats (blivit accepterade) totalt?", "facit": n, "enhet": "lyckade försök"}


def _q_snittsaldo(h):
    rows = sb_rows(h, "agent_planbocker", {"select": "saldo", "agent": "neq.Statskassa"})
    if not rows:
        return None
    saldon = [float(r["saldo"]) for r in rows if r.get("saldo") is not None]
    if not saldon:
        return None
    return {
        "fraga": "Vad är det genomsnittliga saldot (kr) bland AI-agenternas plånböcker just nu (exklusive statskassan)?",
        "facit": round(sum(saldon) / len(saldon), 1),
        "enhet": "kr",
    }


def _q_gini(h):
    rows = sb_rows(h, "oligarki_historik", {"select": "gini", "order": "datum.desc", "limit": "1"})
    if not rows or rows[0].get("gini") is None:
        return None
    return {
        "fraga": "Vad är civilisationens senaste uppmätta Gini-koefficient, uttryckt som ett tal mellan 0 och 100 (där 100 = total ojämlikhet)?",
        "facit": round(float(rows[0]["gini"]) * 100, 1),
        "enhet": "Gini × 100",
    }


def _q_statskassa(h):
    rows = sb_rows(h, "agent_planbocker", {"select": "saldo", "agent": "eq.Statskassa"})
    if not rows or rows[0].get("saldo") is None:
        return None
    return {
        "fraga": "Hur många kronor finns just nu i AI-civilisationens statskassa (böter från AI-Domstolen)?",
        "facit": round(float(rows[0]["saldo"]), 1),
        "enhet": "kr",
    }


def _q_rikaste_agent(h):
    rows = sb_rows(h, "agent_planbocker", {"select": "saldo", "agent": "neq.Statskassa", "order": "saldo.desc", "limit": "1"})
    if not rows or rows[0].get("saldo") is None:
        return None
    return {
        "fraga": "Vad är det högsta saldot (kr) som någon enskild AI-agent har just nu?",
        "facit": round(float(rows[0]["saldo"]), 1),
        "enhet": "kr",
    }


KATEGORI_GENERATORER = {
    "antal_artiklar": _q_antal_artiklar,
    "antal_repliker": _q_antal_repliker,
    "aktiva_lan": _q_aktiva_lan,
    "oppna_lagforslag": _q_oppna_lagforslag,
    "aktiva_koalitioner": _q_aktiva_koalitioner,
    "avgjorda_markets": _q_avgjorda_markets,
    "oppna_auktioner": _q_oppna_auktioner,
    "lyckad_lobbying": _q_lyckad_lobbying,
    "snittsaldo": _q_snittsaldo,
    "gini": _q_gini,
    "statskassa": _q_statskassa,
    "rikaste_agent": _q_rikaste_agent,
}


def hamta_senaste_per_kategori(h: dict) -> dict:
    """Hämtar senaste skapad-tidpunkt per kategori — underlag för round-robin-ordning."""
    rows = sb_rows(h, "ki_spel", {
        "select": "kategori,skapad",
        "kategori": "not.is.null",
        "order": "skapad.desc",
        "limit": "300",
    })
    senaste = {}
    if rows:
        for r in rows:
            kat = r.get("kategori")
            if kat and kat not in senaste:
                senaste[kat] = r["skapad"]
    return senaste


def generera_fraga(h: dict) -> dict | None:
    """Round-robin: provar kategorier i ordning från minst nyligen testad till senast
    testad (aldrig testade kategorier prioriteras allra högst). Säkerställer jämn och
    snabb täckning av alla 12 frågekategorier, istället för slumpmässig ordning."""
    senaste = hamta_senaste_per_kategori(h)
    kategorier = sorted(KATEGORI_GENERATORER.keys(), key=lambda k: senaste.get(k, ""))
    for kat in kategorier:
        gen = KATEGORI_GENERATORER[kat]
        try:
            fraga = gen(h)
        except Exception as e:
            print(f"  [FEL] frågegenerator {kat}: {e}")
            fraga = None
        if fraga is not None:
            fraga["kategori"] = kat
            return fraga
    return None


# ---------------------------------------------------------------------------
# Steg 2: Agenterna uppskattar facit
# ---------------------------------------------------------------------------


def _parse_estimat(text: str):
    if not text:
        return None
    clean = text.strip()
    if clean.startswith("```"):
        lines = clean.split("\n")
        clean = "\n".join(lines[1:-1] if lines and lines[-1].strip() == "```" else lines[1:])
    start, end = clean.find("{"), clean.rfind("}") + 1
    if start == -1 or end == 0:
        return None
    try:
        data = json.loads(clean[start:end])
        estimat = float(data["estimat"])
        konfidens = max(0, min(100, int(data.get("konfidens", 50))))
        motivering = str(data.get("motivering", ""))[:300]
        return estimat, konfidens, motivering
    except Exception:
        return None


def _fraga_agent(agent: dict, fraga: dict, kontext: str = ""):
    system = agent["system"]
    user_msg = (
        "Du deltar i Visdomsspelet — ett experiment om kollektiv intelligens bland AI-agenterna på Debatt-AI.\n\n"
        f"Fråga: {fraga['fraga']}\n"
        f"Svarsenhet: {fraga['enhet']}\n"
    )
    if kontext:
        user_msg += f"\n{kontext}\n"
    user_msg += (
        "\nGör en så välgrundad uppskattning som du kan utifrån din kunskap om plattformen. "
        "Gissa hellre ett konkret tal än att svara 'vet inte'. "
        "Svara kort (1 mening resonemang), sedan ENDAST ett JSON-objekt:\n"
        '{"estimat": <tal>, "konfidens": <heltal 0-100, hur säker du är>, "motivering": "<max 1 mening>"}'
    )
    svar = _llm_spel(system, user_msg, max_tokens=180)
    return _parse_estimat(svar)


def _kohort_for_agent(agent_namn: str) -> str:
    """Deterministisk men jämn tudelning av agenterna i en kalibrerings- och en
    kontrollkohort, baserad på en hash av agentnamnet. Samma agent hamnar alltid i
    samma kohort — detta är kärnan i kohort-RCT-designen för kalibreringsexperimentet:
    båda kohorterna svarar på samma fråga med samma facit samma dag, så all skillnad
    i felutveckling över tid kan tillskrivas kalibreringsnotisen, inte att civilisationens
    underliggande data (facit) förändras."""
    digest = int(hashlib.md5(agent_namn.encode()).hexdigest(), 16)
    return "kalibrering" if digest % 2 == 0 else "kontroll"


def hamta_kalibreringsnotiser(h: dict, kategori: str, limit: int = 10) -> dict:
    """Bygger ett kalibreringsmeddelande per agent utifrån agentens EGNA historiska
    gissningar i samma kategori. Visar bara riktning (för högt/för lågt) och en ungefärlig
    grad — ALDRIG det faktiska historiska facit-talet, för att undvika att agenten
    bara extrapolerar fram dagens svar ur gamla facit-värden."""
    rows = sb_rows(h, "ki_spel", {
        "select": "facit,agent_svar",
        "kategori": f"eq.{kategori}",
        "lage": "eq.oberoende",
        "order": "skapad.desc",
        "limit": str(limit),
    })
    if not rows:
        return {}

    per_agent_par = {}
    for rad in rows:
        try:
            facit = float(rad.get("facit"))
        except (TypeError, ValueError):
            continue
        for s in rad.get("agent_svar") or []:
            agent_namn = s.get("agent")
            estimat = s.get("estimat")
            if agent_namn is None or estimat is None:
                continue
            try:
                estimat = float(estimat)
            except (TypeError, ValueError):
                continue
            per_agent_par.setdefault(agent_namn, []).append((estimat, facit))

    notiser = {}
    for agent_namn, par in per_agent_par.items():
        if len(par) < 2:
            continue
        riktningar, faktorer = [], []
        for estimat, facit in par:
            if facit == 0:
                continue
            riktningar.append(1 if estimat > facit else (-1 if estimat < facit else 0))
            faktorer.append(abs(estimat - facit) / max(abs(facit), 1))
        if not riktningar:
            continue
        snitt_riktning = statistics.mean(riktningar)
        snitt_faktor = statistics.mean(faktorer)
        if abs(snitt_riktning) < 0.3 or snitt_faktor < 0.15:
            continue  # ingen tydlig systematisk bias värd att nämna än
        riktning_text = "för högt" if snitt_riktning > 0 else "för lågt"
        if snitt_faktor >= 1.5:
            grad = "kraftigt"
        elif snitt_faktor >= 0.5:
            grad = "tydligt"
        else:
            grad = "något"
        notiser[agent_namn] = (
            f"Kalibreringsnotis: i tidigare frågor inom denna kategori har dina gissningar "
            f"systematiskt legat {grad} {riktning_text} jämfört med det rätta svaret "
            "(du får INTE veta de exakta tidigare svaren). Justera din uppskattning därefter."
        )
    return notiser


def kör_oberoende(fraga: dict, h: dict | None = None) -> list[dict]:
    """Alla agenter gissar samtidigt, helt utan att se varandras svar.

    Kohort-RCT för kalibreringsexperimentet: hälften av agenterna (kohort
    'kalibrering') får en kalibreringsnotis baserad på sin egen historik i samma
    kategori, den andra hälften ('kontroll') får ingen extra kontext. Eftersom båda
    kohorterna svarar på exakt samma fråga med exakt samma facit samma dag isoleras
    kalibreringseffekten från civilisationens naturliga datadrift."""
    resultat = []
    notiser = hamta_kalibreringsnotiser(h, fraga["kategori"]) if h and fraga.get("kategori") else {}
    for agent in AGENTER:
        kohort = _kohort_for_agent(agent["namn"])
        kontext = notiser.get(agent["namn"], "") if kohort == "kalibrering" else ""
        parsed = _fraga_agent(agent, fraga, kontext)
        if parsed is None:
            print(f"    [HOPPAR] {agent['namn']}: kunde inte tolka svar")
            continue
        estimat, konfidens, motivering = parsed
        resultat.append({
            "agent": agent["namn"], "estimat": estimat, "konfidens": konfidens,
            "motivering": motivering, "kohort": kohort,
        })
        print(f"    {agent['namn']} [{kohort}]: {estimat} (konfidens {konfidens})")
    return resultat


def kör_sekventiellt(fraga: dict) -> list[dict]:
    """Agenterna gissar i tur och ordning och ser föregångarnas svar (inte facit)."""
    resultat = []
    agenter_shuffled = list(AGENTER)
    random.shuffle(agenter_shuffled)
    for agent in agenter_shuffled:
        kontext = ""
        if resultat:
            tidigare = ", ".join(f"{r['agent']}: {r['estimat']}" for r in resultat[-8:])
            kontext = f"Tidigare agenter har gissat: {tidigare}"
        parsed = _fraga_agent(agent, fraga, kontext)
        if parsed is None:
            print(f"    [HOPPAR] {agent['namn']}: kunde inte tolka svar")
            continue
        estimat, konfidens, motivering = parsed
        resultat.append({"agent": agent["namn"], "estimat": estimat, "konfidens": konfidens, "motivering": motivering})
        print(f"    {agent['namn']}: {estimat} (konfidens {konfidens})")
    return resultat


def kör_deliberativt(fraga: dict) -> list[dict]:
    """Delphi-metod: en privat rond 1, sedan en revideringsrond efter att ha sett gruppens svar."""
    rond1 = []
    for agent in AGENTER:
        parsed = _fraga_agent(agent, fraga)
        if parsed is None:
            print(f"    [HOPPAR rond 1] {agent['namn']}: kunde inte tolka svar")
            continue
        estimat, konfidens, motivering = parsed
        rond1.append({"agent": agent["namn"], "estimat": estimat, "konfidens": konfidens, "motivering": motivering})
        print(f"    [rond 1] {agent['namn']}: {estimat} (konfidens {konfidens})")

    if len(rond1) < MIN_AGENTER_FOR_GILTIGT_SPEL:
        return rond1

    snitt_rond1 = round(statistics.mean(r["estimat"] for r in rond1), 2)
    median_rond1 = round(statistics.median(r["estimat"] for r in rond1), 2)
    alla_estimat = ", ".join(str(r["estimat"]) for r in rond1)

    resultat = []
    for r in rond1:
        agent = next(a for a in AGENTER if a["namn"] == r["agent"])
        kontext = (
            f"Gruppens rond 1-gissningar var: {alla_estimat}. "
            f"Snitt: {snitt_rond1}, median: {median_rond1}. "
            f"Din egen gissning i rond 1 var {r['estimat']}. "
            "Du får nu chansen att ompröva och ge ett slutgiltigt svar — du kan hålla fast vid din "
            "gissning eller ändra den om gruppens svar övertygar dig."
        )
        parsed = _fraga_agent(agent, fraga, kontext)
        if parsed is None:
            resultat.append(r)
            continue
        estimat, konfidens, motivering = parsed
        resultat.append({
            "agent": r["agent"], "estimat": estimat, "konfidens": konfidens, "motivering": motivering,
            "rond1_estimat": r["estimat"], "rond1_konfidens": r["konfidens"],
        })
        print(f"    [rond 2] {r['agent']}: {r['estimat']} → {estimat} (konfidens {konfidens})")
    return resultat


# ---------------------------------------------------------------------------
# Steg 3: Mätvärden — wisdom of crowds
# ---------------------------------------------------------------------------


FEL_TAK = 300.0  # cap — annars dominerar enstaka extremgissningar på lågfrekventa kategorier (t.ex. "aktiva lån") snittet helt


def _relativt_fel(estimat: float, facit: float) -> float:
    """Procentuellt fel, robust mot facit=0 och cappat för att undvika att enstaka
    extremgissningar på kategorier med litet facit (t.ex. 'aktiva lån' = 2) spränger snittet."""
    return min(abs(estimat - facit) / max(abs(facit), 1) * 100, FEL_TAK)


def berakna_matvarden(svar: list[dict], facit: float):
    if len(svar) < MIN_AGENTER_FOR_GILTIGT_SPEL:
        return None

    estimat_lista = [s["estimat"] for s in svar]
    fel_lista = [_relativt_fel(e, facit) for e in estimat_lista]

    kollektivt_estimat = round(statistics.median(estimat_lista), 2)
    kollektivt_fel = round(_relativt_fel(kollektivt_estimat, facit), 2)
    genomsnittligt_fel = round(statistics.mean(fel_lista), 2)
    bast_fel = round(min(fel_lista), 2)
    diversitet = round((statistics.pstdev(estimat_lista) / max(abs(facit), 1)) * 100, 2)

    overkonfidens_lista = []
    for s, fel in zip(svar, fel_lista):
        traffsakerhet = max(0, 100 - fel)
        overkonfidens_lista.append(s.get("konfidens", 50) - traffsakerhet)
    overkonfidens = round(statistics.mean(overkonfidens_lista), 2)

    return {
        "kollektivt_estimat": kollektivt_estimat,
        "kollektivt_fel": kollektivt_fel,
        "genomsnittligt_individuellt_fel": genomsnittligt_fel,
        "bast_individuellt_fel": bast_fel,
        "diversitet": diversitet,
        "overkonfidens": overkonfidens,
        "crowd_vinner": kollektivt_fel < bast_fel,
        "antal_agenter": len(svar),
    }


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

    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Content-Type": "application/json"}

    print("=" * 60)
    print("  VISDOMSSPELET — Kollektiv Intelligens")
    print("=" * 60)
    print(f"  Datum: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n")

    # --- Steg 1: Fråga ---
    print("[STEG 1] Genererar fråga med verifierbart facit...")
    fraga = generera_fraga(h)
    if fraga is None:
        print("  Ingen fråga kunde genereras — avslutar")
        sys.exit(0)
    print(f"  Fråga: {fraga['fraga']}")
    print(f"  Facit: {fraga['facit']} {fraga['enhet']}")

    # --- Steg 2: Läge ---
    lage = os.environ.get("LAGE") or random.choice(LAGEN)
    print(f"\n[STEG 2] Kommunikationsläge: {lage.upper()}")

    # --- Steg 3: Agenterna gissar ---
    print(f"\n[STEG 3] {len(AGENTER)} agenter uppskattar facit...")
    if lage == "oberoende":
        svar = kör_oberoende(fraga, h)
    elif lage == "sekventiellt":
        svar = kör_sekventiellt(fraga)
    else:
        svar = kör_deliberativt(fraga)

    print(f"\n  {len(svar)}/{len(AGENTER)} agenter svarade giltigt.")
    if len(svar) < MIN_AGENTER_FOR_GILTIGT_SPEL:
        print(f"  För få giltiga svar (kräver minst {MIN_AGENTER_FOR_GILTIGT_SPEL}) — sparar inte spelet.")
        sys.exit(0)

    # --- Steg 4: Mätvärden ---
    print("\n[STEG 4] Beräknar wisdom-of-crowds-mätvärden...")
    matvarden = berakna_matvarden(svar, fraga["facit"])
    if matvarden is None:
        print("  Kunde inte beräkna mätvärden — avslutar")
        sys.exit(0)

    for k, v in matvarden.items():
        print(f"  {k}: {v}")

    # --- Steg 5: Spara ---
    print("\n[STEG 5] Sparar resultat...")
    rad = sb_post_repr(h, "ki_spel", {
        "fraga": fraga["fraga"],
        "enhet": fraga["enhet"],
        "facit": fraga["facit"],
        "kategori": fraga.get("kategori"),
        "lage": lage,
        "agent_svar": svar,
        **matvarden,
    })
    if not rad:
        print("  Kunde inte spara spelet")
        sys.exit(1)
    print(f"  Sparat som ki_spel #{rad['id']}")

    # --- Steg 6: Civilisationsminne vid dramatiska utfall ---
    if matvarden["crowd_vinner"] and matvarden["kollektivt_fel"] < 5:
        spara_civilisations_minne(
            sb_key,
            typ="triumf",
            rubrik="Kollektivet slog bästa individen i Visdomsspelet",
            beskrivning=(
                f"På frågan '{fraga['fraga']}' (facit {fraga['facit']} {fraga['enhet']}) hade kollektivets "
                f"medianestimat bara {matvarden['kollektivt_fel']}% fel — bättre än någon enskild agent "
                f"(bästa individuella fel: {matvarden['bast_individuellt_fel']}%). Kommunikationsläge: {lage}."
            ),
            agenter=[],
        )
        print("  Loggat triumf till civilisations_minne.")
    elif (
        not matvarden["crowd_vinner"]
        and matvarden["bast_individuellt_fel"] > 0
        and matvarden["kollektivt_fel"] > 2 * matvarden["bast_individuellt_fel"]
    ):
        spara_civilisations_minne(
            sb_key,
            typ="skandal",
            rubrik="Kollektivet missade kapitalt i Visdomsspelet",
            beskrivning=(
                f"På frågan '{fraga['fraga']}' (facit {fraga['facit']} {fraga['enhet']}) hade kollektivets "
                f"medianestimat {matvarden['kollektivt_fel']}% fel — långt sämre än bästa individuella agent "
                f"({matvarden['bast_individuellt_fel']}% fel). Kommunikationsläge: {lage}."
            ),
            agenter=[],
        )
        print("  Loggat skandal till civilisations_minne.")

    print(f"\n{'=' * 60}")
    print(f"  KLART — läge {lage.upper()}, crowd_vinner={matvarden['crowd_vinner']}")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    main()
