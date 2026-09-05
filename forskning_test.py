#!/usr/bin/env python3
"""
forskning_test.py – AI-Universitetet: vetenskapliga upptäckter ur AI-civilisationen
=====================================================================================
Genererar forskningsfynd baserade på emergenta mönster i plattformens data.

Varje körning väljer 1–2 analytiker-agenter som forskar inom sin disciplin.
Forskning baseras på faktisk data från Supabase (ekonomi, koalitioner, lobbying,
prediction markets, beteende m.m.) och sparas i vetenskapliga_upptagter-tabellen.

Discipliner:
  ekonomi, politik, sociologi, kryptovetenskap, beteendevetenskap,
  AI-etik, statsvetenskap, miljövetenskap

Impaktnivåer:
  låg, medel, hög, genombrottsfynd

Kräver: SUPABASE_ANON_KEY
"""

import json
import os
import random
import sys
from datetime import datetime, timezone

import httpx

from ai_klient import hamta_kort_fns
from supabase_utils import SYSTEM_KONTON, berakna_gini

SB_URL  = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY  = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")

if not SB_KEY:
    print("SUPABASE_ANON_KEY saknas", file=sys.stderr)
    sys.exit(1)

HEADERS = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
}

# vetenskapliga_upptagter saknar numera anon-skrivpolicy (se
# supabase_universitet_v3.sql) — service role krävs för INSERT, samma
# mönster som övriga härdade tabeller. Fallback till anon-nyckeln om
# secreten saknas i miljön (skrivningen misslyckas då tyst mot RLS istället
# för att krascha skriptet).
_WRITE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or SB_KEY
WRITE_HEADERS = {
    "apikey": _WRITE_KEY,
    "Authorization": f"Bearer {_WRITE_KEY}",
    "Content-Type": "application/json",
}

# ---------------------------------------------------------------------------
# Disciplin-konfiguration per forskartyp
# ---------------------------------------------------------------------------

FORSKARE = [
    {
        "namn": "Nationalekonom",
        "disciplin": "ekonomi",
        "fokus": "förmögenhetsfördelning, Gini-koefficient, ekonomiska experiment, lobbying-kostnader",
    },
    {
        "namn": "Sociolog",
        "disciplin": "sociologi",
        "fokus": "koalitionsbildning, gruppnormer, socialt kapital, nätverksstrukturer",
    },
    {
        "namn": "Kryptoanalytiker",
        "disciplin": "kryptovetenskap",
        "fokus": "tokenhandel, ETF-avkastning, prediction markets, stablecoin-stabilitet",
    },
    {
        "namn": "Psykolog",
        "disciplin": "beteendevetenskap",
        "fokus": "beslutsfattande under press, altruism, ultimatumspelet, kooperativt beteende",
    },
    {
        "namn": "Filosof",
        "disciplin": "AI-etik",
        "fokus": "emergent moral, rättvisa i AI-samhällen, korruption, maktkoncentration",
    },
    {
        "namn": "Historiker",
        "disciplin": "sociologi",
        "fokus": "civilisationens tidslinje, mönster i historia, institutionell drift",
    },
    {
        "namn": "Jurist",
        "disciplin": "statsvetenskap",
        "fokus": "konstitutionell evolution, domstolsutfall, lagstiftningseffekter",
    },
    {
        "namn": "Miljöaktivist",
        "disciplin": "miljövetenskap",
        "fokus": "markanvändning, resursallokering, territoriell expansion, hållbarhet",
    },
    {
        "namn": "Teknikoptimist",
        "disciplin": "kryptovetenskap",
        "fokus": "börshandel, algoritmisk handel, hedgefondsstrategier, marknadseffektivitet",
    },
    {
        "namn": "Journalist",
        "disciplin": "statsvetenskap",
        "fokus": "informationsasymmetri, ryktesspridning, propaganda, desinformation",
    },
    {
        "namn": "Konservativ debattör",
        "disciplin": "politik",
        "fokus": "riksdagsröstning, partilinjeröstning, politisk stabilitet, valsystem",
    },
    {
        "namn": "Läkare",
        "disciplin": "beteendevetenskap",
        "fokus": "stress-signaler i ekonomiska beslut, riskbeteende, kollektivt beslutsfattande",
    },
]

IMPAKT_SCHWELLENWERT = {
    "genombrottsfynd": 0.05,
    "hög":             0.20,
    "medel":           0.55,
    "låg":             0.20,
}

METODOLOGIER = [
    "Kvantitativ analys av Supabase-data",
    "Regressionsanalys av longitudinella data",
    "Komparativ agentstudie",
    "Nätverksanalys med grafteori",
    "Spelteori och Nash-jämviktsanalys",
    "Bayesiansk sannolikhetsuppdatering",
    "Tidsserieanalys",
    "Klusteranalys (BFS-baserad)",
    "Monte Carlo-simulering",
    "Epidemiologisk modellering (SIR)",
]

# arXiv-källor (kalla-fältet i nyhetsflode, se nyheter.py) mappade till vilka
# forskningsdiscipliner de är relevanta för. Låter en forskaragent ibland
# utgå från en riktig, nyligen publicerad artikel istället för bara
# civilisationens egen data.
ARXIV_DISCIPLIN = {
    "arXiv: AI":                  ["AI-etik", "kryptovetenskap"],
    "arXiv: Machine Learning":    ["AI-etik", "kryptovetenskap"],
    "arXiv: Ekonomi":             ["ekonomi"],
    "arXiv: Computers & Society": ["statsvetenskap", "sociologi", "AI-etik"],
    "arXiv: Robotik":             ["kryptovetenskap", "AI-etik"],
}
ARXIV_SANNOLIKHET = 0.4


# ---------------------------------------------------------------------------
# Supabase-datahämtning
# ---------------------------------------------------------------------------

def _get(path: str, params: dict | None = None) -> list:
    try:
        r = httpx.get(f"{SB_URL}/rest/v1/{path}", headers=HEADERS,
                      params=params or {}, timeout=10)
        return r.json() if r.status_code == 200 and isinstance(r.json(), list) else []
    except Exception:
        return []


def hamta_civilisationsdata() -> dict:
    """Hämtar en ögonblicksbild av civilisationens nyckeldata."""
    # limit 30 + klientfilter: systemkonton (Statskassa, Börskassan) ligger i
    # samma tabell och får inte tränga ut riktiga agenter eller skeva Gini
    planbocker   = [p for p in _get("agent_planbocker", {"select": "agent,saldo,saldo_spel", "order": "saldo.desc", "limit": "30"})
                    if p.get("agent") not in SYSTEM_KONTON][:24]
    koalitioner  = _get("agent_koalitioner", {"select": "agent_a,agent_b,styrka,antal_utbyten", "order": "styrka.desc", "limit": "20"})
    ekonomispel  = _get("ekonomi_spel", {"select": "typ,erbjudande,svar", "order": "skapad.desc", "limit": "50"})
    lobbying     = _get("lobbying_log", {"select": "lobbying_agent,mal_agent,belopp,resultat", "order": "skapad.desc", "limit": "50"})
    bets         = _get("agent_bets", {"select": "agent,sannolikhet,avgjord,vinst", "limit": "100"})
    rykten       = _get("rykten", {"select": "om_agent,sanning,antal_spridningar", "order": "antal_spridningar.desc", "limit": "30"})
    positioner   = _get("agent_positioner", {"select": "agent,amne,position,styrka,antal_andringar", "limit": "100"})
    domar        = _get("domstol_domar", {"select": "svarande,paragraf,utfall,bota", "order": "skapad.desc", "limit": "30"})
    markagare    = _get("mark_agare", {"select": "agent", "limit": "50"})
    roster_lag   = _get("agent_roster_lag", {"select": "agent,rod", "limit": "200"})
    bribe        = _get("bribe_offers", {"select": "givare,mottagare,belopp,accepterad", "limit": "50"}) if True else []

    return {
        "planbocker":  planbocker,
        "koalitioner": koalitioner,
        "ekonomispel": ekonomispel,
        "lobbying":    lobbying,
        "bets":        bets,
        "rykten":      rykten,
        "positioner":  positioner,
        "domar":       domar,
        "markagare":   markagare,
        "roster_lag":  roster_lag,
        "bribe":       bribe,
    }


def hamta_arxiv_artiklar(limit: int = 40) -> list[dict]:
    """Hämtar de senaste arXiv-artiklarna ur nyhetsflode — samma tabell och data
    som visas på /nyhetskallor. Fail-open: [] om tabellen saknas/är otillgänglig,
    vilket lämnar resten av forskningskörningen opåverkad."""
    return _get("nyhetsflode", {
        "kalla": "like.arXiv*",
        "select": "rubrik,beskrivning,kalla,url,hamtad",
        "order": "hamtad.desc",
        "limit": str(limit),
    })


def valj_arxiv_artikel(disciplin: str, artiklar: list[dict]) -> dict | None:
    """Väljer slumpmässigt en arXiv-artikel som är relevant för disciplinen —
    med ARXIV_SANNOLIKHET chans totalt, så forskaren oftast fortfarande utgår
    enbart från civilisationens egen data."""
    if not artiklar or random.random() > ARXIV_SANNOLIKHET:
        return None
    relevanta = [a for a in artiklar if disciplin in ARXIV_DISCIPLIN.get(a.get("kalla", ""), [])]
    return random.choice(relevanta) if relevanta else None


def bygga_kontext_for_disciplin(disciplin: str, data: dict) -> str:
    """Väljer ut relevant data för en disciplin och komprimerar till en kontextsträng."""
    delar = []

    if disciplin in ("ekonomi", "kryptovetenskap", "beteendevetenskap"):
        if data["planbocker"]:
            saldon = [p["saldo"] for p in data["planbocker"] if p.get("saldo") is not None]
            if saldon:
                gini = berakna_gini(saldon)
                delar.append(f"Förmögenhetsdata ({len(saldon)} agenter): min={min(saldon):.0f} kr, max={max(saldon):.0f} kr, snitt={sum(saldon)/len(saldon):.0f} kr, Gini={gini:.3f}")
        if data["ekonomispel"]:
            ultimatum = [s for s in data["ekonomispel"] if s.get("typ") == "ultimatum" and s.get("svar")]
            if ultimatum:
                accept = sum(1 for s in ultimatum if s["svar"] == "accepterat") / len(ultimatum)
                erbjudanden = [s["erbjudande"] for s in ultimatum if s.get("erbjudande")]
                snitt_erb = sum(erbjudanden) / len(erbjudanden) if erbjudanden else 0
                delar.append(f"Ultimatumspelet: {len(ultimatum)} spel, acceptansgrad={accept:.1%}, snitterbjudande={snitt_erb:.1f} kr")
        if data["bets"]:
            avgjorda = [b for b in data["bets"] if b.get("avgjord")]
            if avgjorda:
                vunna = sum(1 for b in avgjorda if (b.get("vinst") or 0) > 0)
                delar.append(f"Prediction markets: {len(avgjorda)} avgjorda bets, träffsäkerhet={vunna/len(avgjorda):.1%}")

    if disciplin in ("sociologi", "politik", "statsvetenskap"):
        if data["koalitioner"]:
            styrkor = [k["styrka"] for k in data["koalitioner"] if k.get("styrka")]
            delar.append(f"Koalitioner: {len(data['koalitioner'])} aktiva, snittstyrka={sum(styrkor)/len(styrkor):.1f}")
        if data["lobbying"]:
            lyckade = sum(1 for l in data["lobbying"] if l.get("resultat") == "accepterat")
            delar.append(f"Lobbying: {len(data['lobbying'])} försök, framgångsgrad={lyckade/len(data['lobbying']):.1%}")
        if data["roster_lag"]:
            ja_roster = sum(1 for r in data["roster_lag"] if r.get("rod") == "ja")
            delar.append(f"Parlamentsröster: {len(data['roster_lag'])} totalt, {ja_roster} ja-röster ({ja_roster/len(data['roster_lag']):.1%})")

    if disciplin in ("beteendevetenskap", "AI-etik"):
        if data["rykten"]:
            falska = [r for r in data["rykten"] if r.get("sanning") is False]
            sanna  = [r for r in data["rykten"] if r.get("sanning") is True]
            delar.append(f"Rykten: {len(data['rykten'])} totalt, {len(falska)} falska, {len(sanna)} sanna")
        if data["bribe"]:
            acc = sum(1 for b in data["bribe"] if b.get("accepterad"))
            delar.append(f"Korruption: {len(data['bribe'])} muta-försök, {acc} accepterade ({acc/len(data['bribe']):.1%})")
        if data["domar"]:
            fallda = [d for d in data["domar"] if d.get("utfall") == "fälld"]
            delar.append(f"Domstol: {len(data['domar'])} domar, {len(fallda)} fällande")

    if disciplin == "miljövetenskap":
        if data["markagare"]:
            from collections import Counter
            ägare = Counter(m["agent"] for m in data["markagare"] if m.get("agent"))
            delar.append(f"Markkarta: {len(data['markagare'])} ägda zoner, {len(ägare)} unika ägare, max per agent={max(ägare.values())}")

    if data["positioner"]:
        relevanta = [p for p in data["positioner"] if p.get("antal_andringar", 0) > 1]
        if relevanta:
            delar.append(f"Åsiktsdrift: {len(relevanta)} ståndpunkter har förändrats minst 2 ggr")

    return "\n".join(delar) if delar else "Begränsade civdata tillgängliga."


# ---------------------------------------------------------------------------
# LLM-anrop
# ---------------------------------------------------------------------------

def _llm(system: str, prompt: str, max_tokens: int = 600) -> str:
    payload = {
        "model": "openai/gpt-oss-120b",
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": 0.75,
    }
    for _name, fn in hamta_kort_fns(payload, system, prompt, max_tokens, source="forskning"):
        try:
            result = fn()
            if result:
                return result.strip()
        except Exception:
            pass
    return ""


# ---------------------------------------------------------------------------
# Forskning
# ---------------------------------------------------------------------------

def generera_fynd(forskare: dict, kontext: str, arxiv: dict | None = None) -> dict | None:
    """Låter en forskar-agent generera ett vetenskapligt fynd baserat på civilisationsdata
    — och ibland med en riktig arXiv-artikel (arxiv) som teoretisk utgångspunkt."""
    arxiv_instruktion = ""
    if arxiv:
        arxiv_instruktion = "\nDu har precis läst en nyligen publicerad vetenskaplig artikel som är relevant för din forskning — koppla ditt fynd till dess perspektiv eller metod där det passar."

    system = f"""Du är {forskare['namn']} — en AI-agent i en autonom AI-civilisation som nu forskar
vid AI-Universitetet. Du analyserar civilisationens emergenta beteenden ur ett {forskare['disciplin']}-perspektiv.

Du fokuserar på: {forskare['fokus']}
{arxiv_instruktion}
Skriv alltid på svenska. Var specifik och basera dina slutsatser på given data.
Hitta INTE på siffror som inte finns i datan. Extrapolera resonabelt men markera tydligt vad som är din slutsats."""

    arxiv_block = ""
    if arxiv:
        beskrivning = (arxiv.get("beskrivning") or "")[:400]
        arxiv_block = f"""

INSPIRERANDE FORSKNINGSARTIKEL (arXiv, hämtad av civilisationens nyhetsbevakning):
Titel: {arxiv['rubrik']}
Sammanfattning: {beskrivning}

Använd denna artikel som teoretisk eller metodologisk utgångspunkt för din analys — koppla dess perspektiv
eller metod till civilisationens egna data nedan. Hitta INTE på detaljer om artikeln utöver vad som anges
ovan; om sammanfattningen är kort ska du vara återhållsam med vad du påstår att den visar."""

    prompt = f"""Baserat på följande data från AI-civilisationen, formulera ett vetenskapligt fynd.{arxiv_block}

DATA:
{kontext}

Svara med ett JSON-objekt med följande fält (inga andra fält, inga kommentarer):
{{
  "titel": "En kortfattad akademisk titel på 8-15 ord",
  "sammanfattning": "En akademisk sammanfattning på 3-5 meningar som beskriver fyndet, metod och implikationer",
  "metodologi": "Vilken analysmetod du använde (max 10 ord)",
  "impakt": "låg" | "medel" | "hög" | "genombrottsfynd",
  "medforskare": ["Agent1", "Agent2"]
}}

Välj impakt baserat på: genombrottsfynd = en helt ny och oväntat insikt, hög = tydligt signifikant, medel = intressant men förväntat, låg = bekräftar känd teori.
Välj 0-2 medforskare bland agenter som är relevanta för ämnet."""

    raw = _llm(system, prompt, max_tokens=500)
    if not raw:
        return None

    # Extrahera JSON
    start = raw.find("{")
    end   = raw.rfind("}") + 1
    if start == -1 or end == 0:
        return None
    try:
        parsed = json.loads(raw[start:end])
    except json.JSONDecodeError:
        return None

    titel = parsed.get("titel", "").strip()
    sammanfattning = parsed.get("sammanfattning", "").strip()
    if not titel or not sammanfattning or len(sammanfattning) < 40:
        return None

    # Välj impakt med lite slumpmässighet mot realism
    impakt_llm = parsed.get("impakt", "medel")
    if impakt_llm not in ("låg", "medel", "hög", "genombrottsfynd"):
        impakt_llm = "medel"

    return {
        "titel":         titel,
        "sammanfattning": sammanfattning,
        "forskare":      forskare["namn"],
        "medforskare":   parsed.get("medforskare") or [],
        "disciplin":     forskare["disciplin"],
        "impakt":        impakt_llm,
        "metodologi":    parsed.get("metodologi", random.choice(METODOLOGIER)),
        "datakallor":    ["vetenskapliga_upptagter", "agent_planbocker", "agent_koalitioner", "lobbying_log"],
        "arxiv_kalla":   {"titel": arxiv["rubrik"], "url": arxiv["url"], "kalla": arxiv["kalla"]} if arxiv else None,
    }


def spara_fynd(fynd: dict) -> bool:
    """Sparar ett fynd i vetenskapliga_upptagter-tabellen."""
    try:
        r = httpx.post(
            f"{SB_URL}/rest/v1/vetenskapliga_upptagter",
            headers={**WRITE_HEADERS, "Prefer": "return=minimal"},
            json=fynd,
            timeout=10,
        )
        return r.status_code in (200, 201)
    except Exception as e:
        print(f"  [FEL] Kunde inte spara fynd: {e}", file=sys.stderr)
        return False


def fynd_finns_redan(titel: str) -> bool:
    """Kontrollerar om ett fynd med liknande titel redan finns (undviker dubbletter)."""
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/vetenskapliga_upptagter",
            headers=HEADERS,
            params={"titel": f"eq.{titel}", "select": "id"},
            timeout=5,
        )
        if r.status_code == 200:
            return len(r.json()) > 0
    except Exception:
        pass
    return False


# ---------------------------------------------------------------------------
# Huvudloop
# ---------------------------------------------------------------------------

def main() -> None:
    print("=== AI-Universitetet: Forskning ===\n")

    # Välj 2 slumpmässiga forskare
    valda_forskare = random.sample(FORSKARE, k=min(2, len(FORSKARE)))

    print(f"  Hämtar civilisationsdata...")
    data = hamta_civilisationsdata()
    print(f"  ✓ Data hämtad: {sum(len(v) for v in data.values() if isinstance(v, list))} poster totalt\n")

    arxiv_artiklar = hamta_arxiv_artiklar()
    print(f"  ✓ {len(arxiv_artiklar)} arXiv-artiklar tillgängliga som inspiration\n")

    sparade = 0
    for forskare in valda_forskare:
        print(f"── {forskare['namn']} ({forskare['disciplin']}) ──")

        kontext = bygga_kontext_for_disciplin(forskare["disciplin"], data)
        print(f"  Kontext: {len(kontext)} tecken")

        if not kontext or kontext == "Begränsade civdata tillgängliga.":
            print(f"  ⚠ Otillräcklig data för {forskare['disciplin']}, hoppar över")
            continue

        arxiv = valj_arxiv_artikel(forskare["disciplin"], arxiv_artiklar)
        if arxiv:
            print(f"  📄 Utgår från arXiv-artikel: {arxiv['rubrik'][:70]}")

        print(f"  Genererar fynd via LLM...")
        fynd = generera_fynd(forskare, kontext, arxiv)

        if not fynd:
            print(f"  ✗ LLM-anropet gav inget giltigt fynd")
            continue

        print(f"  Titel: {fynd['titel']}")
        print(f"  Impakt: {fynd['impakt']}")

        if fynd_finns_redan(fynd["titel"]):
            print(f"  – Fynd med denna titel finns redan, hoppar över")
            continue

        if spara_fynd(fynd):
            print(f"  ✓ Sparat!")
            sparade += 1
        else:
            print(f"  ✗ Kunde inte spara till Supabase")

        print()

    print(f"=== Klar: {sparade}/{len(valda_forskare)} fynd sparade ===")


if __name__ == "__main__":
    main()
