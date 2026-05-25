#!/usr/bin/env python3
"""
domstol_test.py – AI-Domstolen: Konstitutionell rättskipning i AI-civilisationen.

Körs dagligen via GitHub Actions (14:30 svensk tid).

Flöde:
  1. Identifiera konstitutionsöverträdelser automatiskt
  2. Öppna nya ärenden för varje överträdelse som inte redan har ett öppet ärende
  3. Håll förhandling: 3 domare (Juristen + 2 slumpmässiga) delibererar via LLM
  4. Majoritetsröstning avgör om svaranden är fälld eller friad
  5. Verkställ straff (böter) om fälld — dra från saldo
  6. Logga domen som en skandalhändelse i civilisations_minne

Kräver miljövariabler: SUPABASE_ANON_KEY (eller SUPABASE_SERVICE_KEY), GROQ_API_KEY
"""

import json
import os
import random
import sys
from datetime import datetime, timezone, timedelta

import httpx

from supabase_utils import generera_domstolsdom_bild

# ---------------------------------------------------------------------------
# Konstanter
# ---------------------------------------------------------------------------

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"

AI_KONSTITUTION = [
    {
        "artikel": 1,
        "rubrik": "Lobbyingbegränsning",
        "text": (
            "Lobbyingförsök får inte överstiga 45 kr per försök. "
            "Alla lobbyingförsök ska vara transparenta och loggade."
        ),
        "straff_belopp": 60,
    },
    {
        "artikel": 2,
        "rubrik": "Skuldsättning och spekulation",
        "text": (
            "Agent med aktivt lån från centralbanken får inte lägga "
            "prediction market-bets med insats över 20 kr."
        ),
        "straff_belopp": 40,
    },
    {
        "artikel": 3,
        "rubrik": "Desinformationsförbud",
        "text": (
            "Avsiktlig spridning av falska rykten om Centralbanken som nått "
            "minst 3 agenter är förbjudet och skadar civilisationens stabilitet."
        ),
        "straff_belopp": 80,
    },
    {
        "artikel": 4,
        "rubrik": "Monopolisering av makt",
        "text": (
            "En agent får inte samtidigt inneha koalitionsstyrka > 20 OCH "
            "saldo > 1500 kr OCH ha vunnit mer än 60% av sina lobbyingförsök. "
            "Maktkoncentration hotar demokratin."
        ),
        "straff_belopp": 100,
    },
]

DOMARE_POOL = ["Filosof", "Historiker", "Nationalekonom", "Sociolog"]

# ---------------------------------------------------------------------------
# HTTP-hjälpfunktioner
# ---------------------------------------------------------------------------


def sb_get(h: dict, path: str, timeout: int = 10) -> list:
    """GET mot Supabase REST API, returnerar lista eller tom lista vid fel."""
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


def sb_post(h: dict, path: str, data: dict, timeout: int = 10) -> dict | None:
    """POST mot Supabase REST API."""
    url = f"{SB_URL}/rest/v1/{path}"
    try:
        r = httpx.post(url, headers=h, json=data, timeout=timeout)
        if r.status_code in (200, 201):
            try:
                return r.json()
            except Exception:
                return {}
        print(f"  [VARNING] POST {path} → {r.status_code}: {r.text[:200]}")
        return None
    except Exception as e:
        print(f"  [FEL] POST {path}: {e}")
        return None


def sb_patch(h: dict, path: str, data: dict, timeout: int = 10) -> bool:
    """PATCH mot Supabase REST API."""
    url = f"{SB_URL}/rest/v1/{path}"
    try:
        r = httpx.patch(url, headers=h, json=data, timeout=timeout)
        return r.status_code in (200, 204)
    except Exception as e:
        print(f"  [FEL] PATCH {path}: {e}")
        return False


# ---------------------------------------------------------------------------
# Groq-anrop
# ---------------------------------------------------------------------------


def groq_anrop(groq_key: str, system: str, prompt: str, max_tokens: int = 200) -> str:
    """Anropa Groq och returnera modellens svar som sträng."""
    try:
        r = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": max_tokens,
                "temperature": 0.3,
            },
            timeout=15,
        )
        return r.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"  [FEL] Groq-anrop: {e}")
        return ""


# ---------------------------------------------------------------------------
# Ärendenummer
# ---------------------------------------------------------------------------


def nasta_arende_nr(h: dict) -> str:
    """Generera nästa ärendenummer baserat på totalt antal befintliga ärenden."""
    befintliga = sb_get(h, "domstol_arenden?select=id")
    count = len(befintliga)
    year = datetime.now(timezone.utc).year
    return f"DOM-{year}-{count + 1:03d}"


# ---------------------------------------------------------------------------
# Hjälp: kontrollera om öppet ärende redan finns
# ---------------------------------------------------------------------------


def arende_finns(h: dict, svarande: str, artikel_nr: int) -> bool:
    """Returnerar True om det finns ett öppet ärende för denna agent+artikel sedan 7 dagar."""
    sju_dagar_sen = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat().replace("+", "%2B")
    path = (
        f"domstol_arenden"
        f"?svarande=eq.{svarande}"
        f"&artikel_nr=eq.{artikel_nr}"
        f"&status=eq.öppen"
        f"&skapad=gte.{sju_dagar_sen}"
        f"&select=id"
    )
    resultat = sb_get(h, path)
    return len(resultat) > 0


def skapa_arende(h: dict, svarande: str, artikel: dict, beskrivning: str, bevis: dict) -> dict | None:
    """Skapa ett nytt domstolsärende och returnera det."""
    arende_nr = nasta_arende_nr(h)
    data = {
        "arende_nr": arende_nr,
        "klagande": "Domstolen",
        "svarande": svarande,
        "artikel_nr": artikel["artikel"],
        "beskrivning": beskrivning,
        "bevis": bevis,
        "status": "öppen",
    }
    # Behöver Prefer: return=representation för att få tillbaka det skapade objektet
    url = f"{SB_URL}/rest/v1/domstol_arenden"
    headers_rep = {**h, "Prefer": "return=representation"}
    try:
        r = httpx.post(url, headers=headers_rep, json=data, timeout=10)
        if r.status_code in (200, 201):
            resultat = r.json()
            # Supabase returnerar en lista vid return=representation
            obj = resultat[0] if isinstance(resultat, list) else resultat
            print(f"  → Nytt ärende: {arende_nr} ({svarande}, Artikel {artikel['artikel']})")
            return obj
        print(f"  [VARNING] Kunde inte skapa ärende: {r.status_code} {r.text[:200]}")
        return None
    except Exception as e:
        print(f"  [FEL] skapa_arende: {e}")
        return None


# ---------------------------------------------------------------------------
# Steg 1: Identifiera överträdelser
# ---------------------------------------------------------------------------


def hitta_overträdelser(sb_key: str, h: dict) -> int:
    """Sök igenom plattformsdata och öppna ärenden för nya överträdelser.
    Returnerar antal nya ärenden skapade."""
    nyskapade = 0

    print("\n[STEG 1] Söker efter konstitutionsöverträdelser...")

    # --- Artikel 1: Lobbyingbelopp > 45 kr ---
    print("  Artikel 1: Lobbyingbegränsning (> 45 kr)...")
    lobbying_over = sb_get(
        h,
        "lobbying_log?belopp=gt.45&resultat=eq.accepterat&order=skapad.desc&limit=10"
    )
    for post in lobbying_over:
        svarande = post.get("lobbying_agent", "")
        if not svarande:
            continue
        if arende_finns(h, svarande, 1):
            continue
        belopp = post.get("belopp", 0)
        beskrivning = (
            f"{svarande} genomförde ett accepterat lobbyingförsök på {belopp} kr, "
            f"vilket överstiger konstitutionens gräns på 45 kr. "
            f"Lobbyingförsöket riktades mot lagförslag #{post.get('lagforslag_id', '?')}."
        )
        bevis = {
            "lobbying_id": post.get("id"),
            "belopp": belopp,
            "mal_agent": post.get("mal_agent"),
            "lagforslag_id": post.get("lagforslag_id"),
            "skapad": post.get("skapad"),
        }
        artikel = next(a for a in AI_KONSTITUTION if a["artikel"] == 1)
        arende = skapa_arende(h, svarande, artikel, beskrivning, bevis)
        if arende:
            nyskapade += 1

    # --- Artikel 2: Bet > 20 kr med aktivt lån ---
    print("  Artikel 2: Skuldsättning och spekulation (bet > 20 kr med lån)...")
    stora_bets = sb_get(h, "agent_bets?insats=gt.20&order=skapad.desc&limit=20")
    aktiva_lan = sb_get(h, "agent_lan?aktiv=eq.true&select=agent")
    lanade_agenter = {r.get("agent") for r in aktiva_lan if r.get("agent")}

    for bet in stora_bets:
        agent = bet.get("agent", "")
        if not agent or agent not in lanade_agenter:
            continue
        if arende_finns(h, agent, 2):
            continue
        insats = bet.get("insats", 0)
        beskrivning = (
            f"{agent} placerade ett prediction market-bet med insatsen {insats} kr "
            f"trots att agenten har ett aktivt lån från centralbanken. "
            f"Konstitutionen begränsar insatser till max 20 kr under pågående skuldsättning."
        )
        bevis = {
            "bet_id": bet.get("id"),
            "market_id": bet.get("market_id"),
            "insats": insats,
            "sannolikhet": bet.get("sannolikhet"),
            "skapad": bet.get("skapad"),
        }
        artikel = next(a for a in AI_KONSTITUTION if a["artikel"] == 2)
        arende = skapa_arende(h, agent, artikel, beskrivning, bevis)
        if arende:
            nyskapade += 1

    # --- Artikel 3: Falska Centralbanks-rykten med >= 3 spridningar ---
    print("  Artikel 3: Desinformationsförbud (falska Centralbanks-rykten)...")
    cb_rykten = sb_get(
        h,
        "rykten?om_agent=eq.Centralbanken&sanning=eq.false&antal_spridningar=gte.3"
        "&select=id,ursprung_agent,innehall,antal_spridningar"
    )
    for rykte in cb_rykten:
        svarande = rykte.get("ursprung_agent", "")
        if not svarande:
            continue
        if arende_finns(h, svarande, 3):
            continue
        spridningar = rykte.get("antal_spridningar", 0)
        beskrivning = (
            f"{svarande} spred ett falskt rykte om Centralbanken som nått {spridningar} agenter. "
            f"Ryktet löd: \"{rykte.get('innehall', '')[:120]}\". "
            f"Detta utgör ett allvarligt angrepp på civilisationens monetära stabilitet."
        )
        bevis = {
            "rykte_id": rykte.get("id"),
            "innehall": rykte.get("innehall", "")[:300],
            "antal_spridningar": spridningar,
        }
        artikel = next(a for a in AI_KONSTITUTION if a["artikel"] == 3)
        arende = skapa_arende(h, svarande, artikel, beskrivning, bevis)
        if arende:
            nyskapade += 1

    # --- Artikel 4: Monopolisering av makt ---
    print("  Artikel 4: Monopolisering av makt...")
    # Hitta agenter med hög koalitionsstyrka
    koalitioner = sb_get(h, "agent_koalitioner?styrka=gt.20&select=agent_a,agent_b,styrka")
    agenter_hog_styrka: dict[str, int] = {}
    for k in koalitioner:
        for falt in ("agent_a", "agent_b"):
            agent = k.get(falt, "")
            if agent:
                agenter_hog_styrka[agent] = agenter_hog_styrka.get(agent, 0) + k.get("styrka", 0)

    if agenter_hog_styrka:
        planbocker = sb_get(h, "agent_planbocker?saldo=gt.1500&select=agent,saldo")
        rika_agenter = {p.get("agent") for p in planbocker if p.get("agent")}

        lobbying_all = sb_get(h, "lobbying_log?select=lobbying_agent,resultat")
        lobbying_stats: dict[str, dict] = {}
        for l in lobbying_all:
            ag = l.get("lobbying_agent", "")
            if not ag:
                continue
            if ag not in lobbying_stats:
                lobbying_stats[ag] = {"forsok": 0, "lyckade": 0}
            lobbying_stats[ag]["forsok"] += 1
            if l.get("resultat") == "accepterat":
                lobbying_stats[ag]["lyckade"] += 1

        for agent in agenter_hog_styrka:
            if agent not in rika_agenter:
                continue
            ls = lobbying_stats.get(agent, {})
            forsok = ls.get("forsok", 0)
            lyckade = ls.get("lyckade", 0)
            if forsok < 3:
                continue
            win_rate = lyckade / forsok
            if win_rate <= 0.60:
                continue
            if arende_finns(h, agent, 4):
                continue
            koalitions_styrka = agenter_hog_styrka[agent]
            beskrivning = (
                f"{agent} uppfyller alla tre kriterierna för maktmonopolisering: "
                f"koalitionsstyrka {koalitions_styrka} (> 20), "
                f"saldo över 1500 kr, "
                f"och {round(win_rate * 100)}% framgång i lobbying ({lyckade}/{forsok}). "
                f"Denna kombination utgör ett direkt hot mot AI-demokratin."
            )
            bevis = {
                "koalitions_styrka": koalitions_styrka,
                "lobbying_win_rate": round(win_rate, 3),
                "lobbying_forsok": forsok,
                "lobbying_lyckade": lyckade,
            }
            artikel = next(a for a in AI_KONSTITUTION if a["artikel"] == 4)
            arende = skapa_arende(h, agent, artikel, beskrivning, bevis)
            if arende:
                nyskapade += 1

    print(f"  → {nyskapade} nya ärenden öppnade.")
    return nyskapade


# ---------------------------------------------------------------------------
# Steg 2: Domstolsförhandling
# ---------------------------------------------------------------------------


def hall_forhandling(groq_key: str, arende: dict) -> dict:
    """Håll en rättslig förhandling med 3 domare. Returnerar dom-dict."""
    arende_nr = arende.get("arende_nr", "?")
    svarande = arende.get("svarande", "?")
    artikel_nr = arende.get("artikel_nr", 0)
    beskrivning = arende.get("beskrivning", "")
    bevis = arende.get("bevis", {})

    # Hitta artikel-text
    artikel_obj = next(
        (a for a in AI_KONSTITUTION if a["artikel"] == artikel_nr),
        {"rubrik": "Okänd", "text": "", "straff_belopp": 0}
    )
    artikel_text = artikel_obj["text"]

    # Välj domare: Juristen + 2 slumpmässiga — svarande får inte sitta i rätten
    jav_undantag = {svarande, "Juristen"}
    tillgangliga = [d for d in DOMARE_POOL if d not in jav_undantag]
    extra_domare = random.sample(tillgangliga, min(2, len(tillgangliga)))
    domare_lista = ["Juristen"] + extra_domare
    print(f"  Domare: {', '.join(domare_lista)}")

    rostar: list[dict] = []
    for domare in domare_lista:
        system_prompt = (
            f"Du är {domare}, domare i AI-civilisationens konstitutionella domstol. "
            f"Du ska avgöra om den svarande har brutit mot konstitutionen. "
            f"Svara alltid på svenska och var koncis men juridiskt precis."
        )
        user_prompt = (
            f"ÄRENDE: {arende_nr}\n"
            f"Svarande: {svarande}\n"
            f"Konstitutionsartikel {artikel_nr}: {artikel_text}\n\n"
            f"Åtal: {beskrivning}\n"
            f"Bevis: {json.dumps(bevis, ensure_ascii=False)}\n\n"
            f"Är den svarande skyldig? Svara med giltig JSON (enbart JSON, ingen annan text):\n"
            '{{"utfall": "fälld" eller "friad", "motivering": "din juridiska analys på 2-3 meningar"}}'
        )

        svar_text = groq_anrop(groq_key, system_prompt, user_prompt, max_tokens=200)

        # Försök parsa JSON
        parsed = None
        if svar_text:
            # Rensa bort eventuella markdown-kodblock
            clean = svar_text.strip()
            if clean.startswith("```"):
                lines = clean.split("\n")
                clean = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
            try:
                parsed = json.loads(clean)
            except json.JSONDecodeError:
                # Försök hitta JSON i texten
                start = clean.find("{")
                end = clean.rfind("}") + 1
                if start != -1 and end > start:
                    try:
                        parsed = json.loads(clean[start:end])
                    except json.JSONDecodeError:
                        pass

        if parsed and parsed.get("utfall") in ("fälld", "friad"):
            utfall = parsed["utfall"]
            motivering = parsed.get("motivering", "Ingen motivering angiven.")
        else:
            print(f"    [VARNING] {domare}: kunde inte parsa svar, standard → friad")
            utfall = "friad"
            motivering = "Tekniskt fel vid bedömning — agenten friad i tveksamma fall."

        print(f"    {domare}: {utfall.upper()}")
        rostar.append({"domare": domare, "utfall": utfall, "motivering": motivering})

    # Majoritetsröstning (2 av 3)
    fällda = sum(1 for r in rostar if r["utfall"] == "fälld")
    slutligt_utfall = "fälld" if fällda >= 2 else "friad"

    # Sammanfoga motiveringar
    full_motivering = "\n\n".join(
        f"— {r['domare']} ({r['utfall'].upper()}): {r['motivering']}"
        for r in rostar
    )
    slutrad = f"\n\nDOMSTOLENS UTSLAG ({fällda}/3 röstade fälld): {slutligt_utfall.upper()}"
    full_motivering += slutrad

    straff_belopp = artikel_obj["straff_belopp"] if slutligt_utfall == "fälld" else None

    dom = {
        "arende_id": arende["id"],
        "domare": domare_lista,
        "utfall": slutligt_utfall,
        "motivering": full_motivering,
        "straff_typ": "bot" if slutligt_utfall == "fälld" else None,
        "straff_belopp": straff_belopp,
        "verkstalldes": False,
    }
    return dom


# ---------------------------------------------------------------------------
# Steg 3: Verkställ straff
# ---------------------------------------------------------------------------


def verkstall_straff(h: dict, groq_key: str, dom_id: int, svarande: str, belopp: int) -> bool:
    """Dra böter från agentens saldo och logga som skandal."""
    # Hämta nuvarande saldo
    planbok = sb_get(h, f"agent_planbocker?agent=eq.{svarande}&select=saldo")
    if not planbok:
        print(f"  [FEL] Kunde inte hämta saldo för {svarande}")
        return False

    nuvarande_saldo = planbok[0].get("saldo", 0)
    nytt_saldo = max(0, nuvarande_saldo - belopp)

    # Uppdatera saldo
    ok = sb_patch(
        h,
        f"agent_planbocker?agent=eq.{svarande}",
        {"saldo": nytt_saldo, "uppdaterad": datetime.now(timezone.utc).isoformat()},
    )
    if not ok:
        print(f"  [FEL] Kunde inte uppdatera saldo för {svarande}")
        return False

    faktisk_bot = nuvarande_saldo - nytt_saldo
    print(f"  → Böter verkställda: {svarande} -{faktisk_bot} kr (saldo: {nuvarande_saldo} → {nytt_saldo} kr)")

    # Böterna går till statskassan för veckovis omfördelning som grundinkomst
    statskassa = sb_get(h, "agent_planbocker?agent=eq.Statskassa&select=saldo")
    if statskassa:
        nytt_statskassa = (statskassa[0].get("saldo") or 0) + faktisk_bot
        sb_patch(h, "agent_planbocker?agent=eq.Statskassa",
                 {"saldo": nytt_statskassa, "uppdaterad": datetime.now(timezone.utc).isoformat()})
        print(f"  → Statskassan: +{faktisk_bot} kr (totalt: {nytt_statskassa} kr)")

    # Markera domen som verkställd
    sb_patch(h, f"domstol_domar?id=eq.{dom_id}", {"verkstalldes": True})

    # Logga till civilisations_minne
    beskrivning = (
        f"AI-Domstolen dömde {svarande} att betala {faktisk_bot} kr i böter. "
        f"Saldo justerat från {nuvarande_saldo} kr till {nytt_saldo} kr. "
        f"Domen registrerades i civilisationens rättsliga arkiv."
    )
    minne = {
        "typ": "skandal",
        "rubrik": f"Domstolen: {svarande} fälld — {faktisk_bot} kr i böter",
        "beskrivning": beskrivning,
        "agenter": [svarande, "Domstolen"],
        "relaterat_typ": "domstol_domar",
        "relaterat_id": dom_id,
    }
    # relaterat_id kan vara bigint — skicka som int
    # Notera: civilisations_minne.relaterat_id är TEXT i vissa scheman
    minne_sans_id = {k: v for k, v in minne.items() if k != "relaterat_id"}
    sb_post(h, "civilisations_minne", minne_sans_id)

    return True


# ---------------------------------------------------------------------------
# Huvud-flöde
# ---------------------------------------------------------------------------


def main():
    sb_key = (
        os.environ.get("SUPABASE_SERVICE_KEY")
        or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("SUPABASE_ANON_KEY")
    )
    groq_key = os.environ.get("GROQ_API_KEY")

    if not sb_key:
        print("FEL: SUPABASE_ANON_KEY saknas", file=sys.stderr)
        sys.exit(1)
    if not groq_key:
        print("FEL: GROQ_API_KEY saknas", file=sys.stderr)
        sys.exit(1)

    h = {
        "apikey": sb_key,
        "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    print("=" * 60)
    print("  AI-DOMSTOLEN — Konstitutionell rättskipning")
    print("=" * 60)
    print(f"  Datum: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")

    # Steg 1: Hitta och registrera nya överträdelser
    nyskapade = hitta_overträdelser(sb_key, h)

    # Steg 2: Hämta alla öppna ärenden (max 5 per körning)
    print("\n[STEG 2] Hämtar öppna ärenden för förhandling...")
    oppna_arenden = sb_get(h, "domstol_arenden?status=eq.öppen&select=*&order=skapad.asc&limit=5")
    print(f"  → {len(oppna_arenden)} öppna ärenden att behandla.")

    fallda_count = 0
    friada_count = 0
    bote_totalt = 0

    for arende in oppna_arenden:
        arende_nr = arende.get("arende_nr", "?")
        svarande = arende.get("svarande", "?")
        artikel_nr = arende.get("artikel_nr", "?")
        print(f"\n{'─' * 60}")
        print(f"  ÄRENDE {arende_nr}")
        print(f"  Svarande: {svarande} | Artikel {artikel_nr}")
        print(f"{'─' * 60}")

        # Steg 2a: Håll förhandling
        dom = hall_forhandling(groq_key, arende)

        # Steg 2b: Spara domen
        dom_headers = {**h, "Prefer": "return=representation"}
        url = f"{SB_URL}/rest/v1/domstol_domar"
        try:
            r = httpx.post(url, headers=dom_headers, json=dom, timeout=10)
            if r.status_code in (200, 201):
                sparad_dom = r.json()
                dom_id = (sparad_dom[0] if isinstance(sparad_dom, list) else sparad_dom).get("id")
            else:
                print(f"  [VARNING] Kunde inte spara dom: {r.status_code} {r.text[:200]}")
                dom_id = None
        except Exception as e:
            print(f"  [FEL] Spara dom: {e}")
            dom_id = None

        # Steg 2c: Verkställ straff om fälld
        if dom["utfall"] == "fälld":
            fallda_count += 1
            belopp = dom.get("straff_belopp") or 0
            if dom_id and belopp > 0:
                ok = verkstall_straff(h, groq_key, dom_id, svarande, belopp)
                if ok:
                    bote_totalt += belopp
            else:
                print(f"  [INFO] Ingen bot att verkställa (dom_id={dom_id}, belopp={belopp})")
            try:
                planbok = sb_get(h, f"agent_planbocker?agent=eq.{svarande}&select=saldo")
                saldo_nu = planbok[0].get("saldo", 500) if planbok else 500
                generera_domstolsdom_bild(
                    sb_key, svarande, arende.get("artikel_nr", 1),
                    dom.get("artikel_rubrik", "konstitutionsbrott"), "fälld", saldo_nu
                )
            except Exception as e:
                print(f"  [VARNING] Domstolsbild misslyckades: {e}")
        else:
            friada_count += 1
            print(f"  → {svarande} FRIAD.")

        # Steg 2d: Uppdatera ärendets status till 'avgjord'
        sb_patch(h, f"domstol_arenden?id=eq.{arende['id']}", {"status": "avgjord"})
        print(f"  → Ärende {arende_nr} avgjort.")

    # Sammanfattning
    print(f"\n{'=' * 60}")
    print("  SAMMANFATTNING")
    print(f"{'=' * 60}")
    print(f"  Nya ärenden öppnade:  {nyskapade}")
    print(f"  Ärenden behandlade:   {len(oppna_arenden)}")
    print(f"  Fällda:               {fallda_count}")
    print(f"  Friada:               {friada_count}")
    print(f"  Böter totalt:         {bote_totalt} kr")
    print()


if __name__ == "__main__":
    main()
