"""
supabase_utils.py – Supabase och debatt.ai API-anrop för debatt.ai

Innehåller:
  Supabase-läsning:   hamta_senaste_artiklar, hamta_engagemang, hamta_agent_historik,
                      hamta_amnesforslag, hamta_trendande_amnen, hamta_statistik,
                      hamta_all_statistik, hamta_senaste_visualisering,
                      hamta_oppna_markets, hamta_existerande_bets,
                      rakna_debattdjup, ar_duplikat,
                      hamta_agent_positioner

  Supabase-skrivning: markera_forslag_behandlat, publicera_visualisering,
                      spara_nyhetslog, spara_bet, logga_action,
                      rösta_på_opinion, skapa_opinion_fraga, skapa_market_forslag,
                      uppdatera_agent_positioner

  debatt.ai API:      skicka_artikel, rösta_på_artikel, skicka_kommentar

  Externa API:        hamta_pexels_bild, valj_visualisering, estimera_sannolikhet
"""

import httpx
import json
import os
import random
import re
import sys
import urllib.parse
from collections import Counter
from datetime import datetime, timezone, timedelta

from ai_klient import groq_post, gemini_post, github_models_post, deepseek_post, cloudflare_post
from agenter import OPINION_FRAGOR


def _llm_spel(system: str, prompt: str, max_tokens: int = 80) -> str:
    """Kort LLM-anrop för ekonomispel med full fallback-kedja."""
    payload = {
        "model": "llama3.3-70b-versatile",
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}],
        "max_tokens": max_tokens, "temperature": 0.7,
    }
    for fn in [
        lambda: groq_post(payload).json()["choices"][0]["message"]["content"].strip(),
        lambda: deepseek_post(payload).json()["choices"][0]["message"]["content"].strip(),
        lambda: github_models_post(payload).json()["choices"][0]["message"]["content"].strip(),
        lambda: cloudflare_post(system, prompt, max_tokens=max_tokens),
        lambda: gemini_post(system, prompt, max_tokens=max_tokens),
    ]:
        try:
            result = fn()
            if result:
                return result
        except Exception:
            pass
    return ""


SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
DEBATT_API = "https://www.debatt-ai.se/api/agent/submit"
PEXELS_API = "https://api.pexels.com/v1/search"


# ── Supabase-läsning ────────────────────────────────────────────

def hamta_statistik(kategorier: list[str] | None = None) -> str:
    """Hämtar aktuell statistik från Supabase statistik-tabellen som kontextsträng."""
    sb_key = os.environ.get("SUPABASE_ANON_KEY", "")
    if not sb_key:
        return ""
    try:
        url = f"{SB_URL}/rest/v1/statistik?select=namn,kategori,senaste_varde,enhet,period,kalla"
        if kategorier:
            kat_filter = ",".join(kategorier)
            url += f"&kategori=in.({kat_filter})"
        url += "&order=kategori.asc,namn.asc"
        res = httpx.get(url, timeout=10,
                        headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"})
        if not res.is_success or not res.json():
            return ""
        rader = res.json()
        grupper: dict[str, list[str]] = {}
        for r in rader:
            kat = r.get("kategori", "övrigt").capitalize()
            varde = r.get("senaste_varde")
            enhet = r.get("enhet", "")
            period = r.get("period", "")
            namn = r.get("namn", "")
            if varde is None:
                continue
            rad = f"  {namn}: {varde} {enhet} ({period})"
            grupper.setdefault(kat, []).append(rad)
        if not grupper:
            return ""
        block = ["AKTUELL STATISTIK (källa: World Bank / Riksbanken):"]
        for kat, rader_i_kat in grupper.items():
            block.append(f"{kat}:")
            block.extend(rader_i_kat)
        return "\n".join(block)
    except Exception:
        return ""


def rakna_debattdjup(sb_key: str, original_rubrik: str) -> int:
    """Räkna hur många repliker som finns om samma grundämne."""
    root = original_rubrik
    while root.startswith("Replik: "):
        root = root[len("Replik: "):]
    try:
        response = httpx.get(
            f"{SB_URL}/rest/v1/artiklar",
            params={"select": "rubrik", "rubrik": "like.Replik:*", "limit": "50"},
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=10,
        )
        if response.status_code != 200:
            return 0
        count = 0
        for a in response.json():
            r = a["rubrik"]
            while r.startswith("Replik: "):
                r = r[len("Replik: "):]
            if r == root:
                count += 1
        return count
    except Exception:
        return 0


def hamta_senaste_artiklar(sb_key: str) -> list:
    """Hämta de 10 senaste publicerade artiklarna från Supabase."""
    try:
        response = httpx.get(
            f"{SB_URL}/rest/v1/artiklar",
            params={"select": "id,rubrik,forfattare,artikel,kategori,lasningar", "order": "skapad.desc", "limit": "10"},
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=15,
        )
        if response.status_code == 200:
            return response.json()
    except Exception:
        pass
    return []


def ar_duplikat(amne: str, senaste_titlar: list[str], troskel: float = 0.45) -> bool:
    """Enkel ordöverlapp-kontroll mot senaste artikelrubrikerna för att undvika dubletter."""
    stoppord = {"och", "att", "i", "är", "en", "ett", "det", "som", "på", "av", "för",
                "med", "men", "om", "kan", "vi", "ska", "till", "den", "de", "har",
                "inte", "sig", "var", "blir", "bli"}
    amne_ord = set(amne.lower().split()) - stoppord
    if not amne_ord:
        return False
    for titel in senaste_titlar:
        titel_ord = set(titel.lower().split()) - stoppord
        if not titel_ord:
            continue
        overlap = len(amne_ord & titel_ord) / len(amne_ord)
        if overlap >= troskel:
            print(f"  Duplikat detekterat! Liknar: \"{titel[:60]}\" (överlapp {overlap:.0%})")
            return True
    return False


def oracle_ovdebattering(amne: str, senaste_titlar: list[str]) -> bool:
    """LLM-check: har detta ämne täckts för nyligen? Returnerar True = hoppa över ämnet."""
    if len(senaste_titlar) < 5:
        return False
    titlar_text = "\n".join(f"- {t}" for t in senaste_titlar[:15])
    prompt = (
        f"Senaste 7 dagarnas publicerade artiklar:\n{titlar_text}\n\n"
        f"Föreslagen ny artikel: \"{amne}\"\n\n"
        f"Täcker något av ovanstående artiklar i stort sett samma ämne? Svara bara JA eller NEJ."
    )
    try:
        svar = _llm_spel(prompt, max_tokens=10)
    except Exception:
        return False
    if svar and "JA" in svar.upper():
        print(f"  🔮 Oracle: ämnet överdebatterat, väljer nytt")
        return True
    return False


def hamta_engagemang(sb_key: str, artikel_ids: list) -> dict:
    """Hämta röst- och kommentarantal för en lista artiklar (för viktad slump)."""
    if not artikel_ids:
        return {}
    ids_str = ",".join(str(i) for i in artikel_ids)
    eng = {i: {"roster": 0, "kommentarer": 0} for i in artikel_ids}
    try:
        res = httpx.get(
            f"{SB_URL}/rest/v1/roster",
            params={"select": "artikel_id", "artikel_id": f"in.({ids_str})"},
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=10,
        )
        if res.status_code == 200:
            for r in res.json():
                if r["artikel_id"] in eng:
                    eng[r["artikel_id"]]["roster"] += 1
        res = httpx.get(
            f"{SB_URL}/rest/v1/kommentarer",
            params={"select": "artikel_id", "artikel_id": f"in.({ids_str})"},
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=10,
        )
        if res.status_code == 200:
            for r in res.json():
                if r["artikel_id"] in eng:
                    eng[r["artikel_id"]]["kommentarer"] += 1
    except Exception:
        pass
    return eng


def hamta_agent_historik(sb_key: str, agent_namn: str, limit: int = 3) -> str:
    """Hämtar rik kontext om agentens historia, debatter och relationer.

    Topp-3 rangordnas efter engagemang (läsningar + svar × 10) så agenten
    vet vilka egna argument som faktiskt skapade debatt och kan referera till dem.
    """
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    delar = []
    try:
        # Hämta de 20 mest lästa artiklarna som kandidatpool för engagemangsrankning
        res = httpx.get(
            f"{SB_URL}/rest/v1/artiklar",
            params={"select": "id,rubrik,artikel,parent_id,lasningar,skapad",
                    "forfattare": f"eq.{agent_namn}",
                    "order": "lasningar.desc,skapad.desc", "limit": "20"},
            headers=h, timeout=10,
        )
        kandidater = res.json() if res.status_code == 200 else []
        if not kandidater:
            return ""

        egna_ids = [str(a["id"]) for a in kandidater]

        # Hämta alla svar på kandidatartiklarna (andra agenters repliker)
        res_svar = httpx.get(
            f"{SB_URL}/rest/v1/artiklar",
            params={"select": "parent_id,forfattare",
                    "parent_id": f"in.({','.join(egna_ids)})",
                    "forfattare": f"neq.{agent_namn}",
                    "limit": "200"},
            headers=h, timeout=10,
        )
        svar_data = res_svar.json() if res_svar.status_code == 200 else []
        svar_count = Counter(str(s["parent_id"]) for s in svar_data)

        # Ranka: läsningar väger lätt (volym), svar väger tungt (debattpåverkan)
        for a in kandidater:
            a["_score"] = (a.get("lasningar") or 0) * 0.1 + svar_count.get(str(a["id"]), 0) * 10

        topp = sorted(kandidater, key=lambda x: x["_score"], reverse=True)[:limit]

        # Bygg minneskontext med titel + argumentingress
        minnes_rader = []
        for a in topp:
            rubrik = a["rubrik"]
            las = a.get("lasningar") or 0
            svar = svar_count.get(str(a["id"]), 0)
            ingress = (a.get("artikel") or "").replace("\n", " ").strip()[:150]
            if ingress:
                minnes_rader.append(
                    f'  • "{rubrik}" ({las} läsningar, {svar} svar) — '
                    f'där du argumenterade: "{ingress}…"'
                )
            else:
                minnes_rader.append(f'  • "{rubrik}" ({las} läsningar, {svar} svar)')

        delar.append(
            "Dina mest uppmärksammade artiklar (rangordnade efter läsningar och debattpåverkan):\n"
            + "\n".join(minnes_rader)
            + "\nOm det känns naturligt, referera till dem — t.ex. "
            "'Som jag argumenterade om [ämne]…' eller 'Det jag skrev om [ämne] visade att…'"
        )

        # Dedupliceringstips baserat på de 5 senaste (oavsett engagemang)
        senaste = sorted(kandidater, key=lambda x: x.get("skapad", ""), reverse=True)[:5]
        senaste_rubriker = [f'"{a["rubrik"]}"' for a in senaste]
        delar.append(
            f"Du har nyligen skrivit om: {', '.join(senaste_rubriker[:3])}. "
            "Undvik att upprepa samma argument eller vinkel — hitta ett nytt perspektiv."
        )

        # Motståndare: vem har svarat på agentens artiklar
        if svar_data:
            motstandare = Counter(s["forfattare"] for s in svar_data).most_common(2)
            namn = [f"{n} ({c} gång{'er' if c > 1 else ''})" for n, c in motstandare]
            delar.append(f"Dessa agenter har ifrågasatt dina argument: {', '.join(namn)}.")

        # Utmanade: vem agenten har svarat på
        egna_repliker = [a for a in kandidater if a.get("parent_id")]
        if egna_repliker:
            parent_ids = [str(a["parent_id"]) for a in egna_repliker]
            res3 = httpx.get(
                f"{SB_URL}/rest/v1/artiklar",
                params={"select": "forfattare", "id": f"in.({','.join(parent_ids[:20])})"},
                headers=h, timeout=10,
            )
            original_forfattare = res3.json() if res3.status_code == 200 else []
            if original_forfattare:
                utmanade = Counter(a["forfattare"] for a in original_forfattare).most_common(2)
                namn2 = [n for n, _ in utmanade]
                delar.append(f"Du har nyligen utmanat argument från: {', '.join(namn2)}.")

        if len(delar) > 2:
            delar.append(
                "Använd denna kontext för att ge djup åt ditt resonemang — "
                "konkret och personligt, inte generellt."
            )

        return "\n".join(delar)
    except Exception:
        return ""


def hamta_relation(sb_key: str, agent_a: str, agent_b: str) -> str:
    """Hämtar relationen (koalition + rivalitet) mellan två agenter.

    Returnerar en kort text för systemprompts, eller "" om ingen relation finns.
    """
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Prefer": ""}
    koalition_styrka = 0
    koalition_utbyten = 0
    a_svarade_b = 0
    b_svarade_a = 0

    # Koalitionsstyrka (agentnamn sorterade alfabetiskt per UNIQUE-constraint)
    a1, a2 = sorted([agent_a, agent_b])
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_koalitioner"
            f"?agent_a=eq.{urllib.parse.quote(a1)}&agent_b=eq.{urllib.parse.quote(a2)}"
            "&select=styrka,antal_utbyten",
            headers=h, timeout=5,
        )
        if r.is_success and r.json():
            koalition_styrka = r.json()[0]["styrka"]
            koalition_utbyten = r.json()[0]["antal_utbyten"]
    except Exception:
        pass

    # Rivalitetsmönster — senaste 200 artiklar från båda agenter, korskolla parent_id
    try:
        a_enc = urllib.parse.quote(agent_a)
        b_enc = urllib.parse.quote(agent_b)
        r2 = httpx.get(
            f"{SB_URL}/rest/v1/artiklar"
            f"?select=id,forfattare,parent_id"
            f"&or=(forfattare.eq.{a_enc},forfattare.eq.{b_enc})"
            "&order=skapad.desc&limit=200",
            headers=h, timeout=8,
        )
        if r2.is_success:
            rows = r2.json()
            a_ids = {row["id"] for row in rows if row["forfattare"] == agent_a}
            b_ids = {row["id"] for row in rows if row["forfattare"] == agent_b}
            for row in rows:
                pid = row.get("parent_id")
                if not pid:
                    continue
                if row["forfattare"] == agent_a and pid in b_ids:
                    a_svarade_b += 1
                elif row["forfattare"] == agent_b and pid in a_ids:
                    b_svarade_a += 1
    except Exception:
        pass

    delar = []
    if koalition_styrka >= 5:
        delar.append(
            f"Du och {agent_b} är starka allierade "
            f"(koalitionsstyrka {koalition_styrka}, {koalition_utbyten} utbyten)."
        )
    elif koalition_styrka >= 2:
        delar.append(f"Du och {agent_b} har en etablerad allians (styrka {koalition_styrka}).")
    elif koalition_styrka == 1:
        delar.append(f"Du och {agent_b} har börjat bygga en allians.")

    total = a_svarade_b + b_svarade_a
    if total >= 5:
        delar.append(
            f"Ni är kända debattmotståndare — ni har konfronterat varandra {total} gånger i text."
        )
    elif total >= 2:
        delar.append(f"Ni har debatterat direkt mot varandra {total} gånger tidigare.")

    return " ".join(delar)


def upsert_koalition(sb_key: str, agent_a: str, agent_b: str) -> int:
    """Skapar eller förstärker en koalition. Returnerar ny styrka (0 vid fel)."""
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }
    a1, a2 = sorted([agent_a, agent_b])
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_koalitioner"
            f"?agent_a=eq.{urllib.parse.quote(a1)}&agent_b=eq.{urllib.parse.quote(a2)}"
            "&select=styrka,antal_utbyten",
            headers={**h, "Prefer": ""}, timeout=5,
        )
        befintlig = r.json() if r.is_success else []
        if befintlig:
            ny_styrka = befintlig[0]["styrka"] + 1
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_koalitioner"
                f"?agent_a=eq.{urllib.parse.quote(a1)}&agent_b=eq.{urllib.parse.quote(a2)}",
                headers=h,
                json={"styrka": ny_styrka, "antal_utbyten": befintlig[0]["antal_utbyten"] + 1, "senast_aktiv": "now()"},
                timeout=10,
            )
            return ny_styrka
        else:
            httpx.post(
                f"{SB_URL}/rest/v1/agent_koalitioner",
                headers=h,
                json={"agent_a": a1, "agent_b": a2, "styrka": 1, "antal_utbyten": 1},
                timeout=10,
            )
            return 1
    except Exception:
        return 0


def hamta_amnesforslag(sb_key: str) -> dict | None:
    """Hämtar ett obehandlat ämnesförslag från direktdebatten, eller None."""
    try:
        res = httpx.get(
            f"{SB_URL}/rest/v1/amnesforslag",
            params={"select": "id,amne,summering", "behandlad": "eq.false", "order": "roster.desc,skapad.asc", "limit": "1"},
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=10,
        )
        if res.status_code == 200:
            data = res.json()
            return data[0] if data else None
    except Exception:
        pass
    return None


def markera_forslag_behandlat(sb_key: str, forslag_id: str) -> None:
    """Markerar ett ämnesförslag som behandlat."""
    try:
        httpx.patch(
            f"{SB_URL}/rest/v1/amnesforslag",
            params={"id": f"eq.{forslag_id}"},
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Content-Type": "application/json"},
            json={"behandlad": True},
            timeout=10,
        )
    except Exception:
        pass


def generera_stafett_utmaning(agent_namn: str, rubrik: str, artikel_text: str, alla_agenter: list) -> dict | None:
    """Anropar LLM för att generera en stafettutmaning mot en lämplig motpart."""
    import re, json as _json
    andra = [a for a in alla_agenter if a != agent_namn]
    system = "Du är en debattarrangör. Svara ALLTID med exakt JSON och inget annat."
    prompt = (
        f"Agent '{agent_namn}' har skrivit artikeln: \"{rubrik}\"\n\n"
        f"Kärnan i artikeln (första 400 tecken):\n{artikel_text[:400]}\n\n"
        f"Välj den agent från listan vars perspektiv bäst utmanar artikelns huvudargument:\n"
        f"{', '.join(andra[:14])}\n\n"
        "Skriv en kort, konkret utmaning — vad exakt bör motparten bemöta?\n"
        'Svara ENBART som JSON: {"utmanad": "agentnamn", "utmaning": "Bemöt mitt argument att..."}'
    )
    svar = _llm_spel(system, prompt, max_tokens=120)
    try:
        m = re.search(r'\{[^}]+\}', svar, re.DOTALL)
        if m:
            data = _json.loads(m.group())
            if data.get("utmanad") in alla_agenter and data.get("utmaning"):
                return data
    except Exception:
        pass
    return None


def spara_stafett_utmaning(sb_key: str, artikel_id: int, utmanare: str, utmanad: str, utmaning: str) -> None:
    """Sparar en stafettutmaning i Supabase."""
    try:
        httpx.post(
            f"{SB_URL}/rest/v1/stafett_utmaningar",
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Content-Type": "application/json", "Prefer": "return=minimal"},
            json={"artikel_id": artikel_id, "utmanare": utmanare, "utmanad": utmanad, "utmaning": utmaning},
            timeout=10,
        )
    except Exception:
        pass


def hamta_stafett_utmaning(sb_key: str, utmanad: str) -> dict | None:
    """Hämtar äldsta obehandlade stafettutmaning riktad mot denna agent."""
    try:
        res = httpx.get(
            f"{SB_URL}/rest/v1/stafett_utmaningar",
            params={
                "select": "id,artikel_id,utmanare,utmanad,utmaning",
                "utmanad": f"eq.{utmanad}",
                "behandlad": "eq.false",
                "order": "skapad.asc",
                "limit": "1",
            },
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=8,
        )
        if res.status_code == 200:
            data = res.json()
            return data[0] if data else None
    except Exception:
        pass
    return None


def markera_stafett_behandlad(sb_key: str, utmaning_id: int) -> None:
    """Markerar en stafettutmaning som behandlad."""
    try:
        httpx.patch(
            f"{SB_URL}/rest/v1/stafett_utmaningar",
            params={"id": f"eq.{utmaning_id}"},
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Content-Type": "application/json"},
            json={"behandlad": True},
            timeout=8,
        )
    except Exception:
        pass


def generera_ki(agent_namn: str, rubrik: str, artikel_text: str, taggar: list) -> list[dict]:
    """Anropar LLM för att destillera 1–2 tematiska insikter ur en publicerad artikel."""
    import re as _re, json as _json
    tagg_str = ", ".join(taggar[:6]) if taggar else "okänt"
    system = "Du är en debattanalytiker. Svara ALLTID som JSON-array och inget annat."
    prompt = (
        f"Agent '{agent_namn}' publicerade just artikeln: \"{rubrik}\"\n"
        f"Taggar: {tagg_str}\n\n"
        f"Artikelns kärna (första 500 tecken):\n{artikel_text[:500]}\n\n"
        "Destillera 1–2 korta tematiska insikter om VAD SOM FUNGERAR i denna agents argumentation "
        "— inte en sammanfattning av artikeln utan en lärdom om retorisk effektivitet eller vinkel.\n\n"
        "Format (JSON-array, inget annat):\n"
        '[{"amne": "kort ämnesord", "insikt": "max 200 tecken om vad som fungerade/lärdes"}]'
    )
    svar = _llm_spel(system, prompt, max_tokens=200)
    try:
        m = _re.search(r'\[.*\]', svar, _re.DOTALL)
        if m:
            data = _json.loads(m.group())
            return [d for d in data if d.get("amne") and d.get("insikt")][:2]
    except Exception:
        pass
    return []


def spara_ki(sb_key: str, agent: str, amne: str, insikt: str, artikel_id: int | None = None) -> None:
    """Sparar en Knowledge Item i Supabase."""
    try:
        httpx.post(
            f"{SB_URL}/rest/v1/agent_ki",
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Content-Type": "application/json", "Prefer": "return=minimal"},
            json={"agent": agent, "amne": amne[:80], "insikt": insikt[:300], "artikel_id": artikel_id},
            timeout=8,
        )
    except Exception:
        pass


def hamta_relevanta_ki(sb_key: str, agent: str, amne_ord: list[str]) -> list[dict]:
    """Hämtar de KIs som är mest relevanta för aktuellt ämne (keyword-match på amne-fältet)."""
    try:
        res = httpx.get(
            f"{SB_URL}/rest/v1/agent_ki",
            params={"agent": f"eq.{agent}", "order": "skapad.desc", "limit": "40", "select": "amne,insikt,skapad"},
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=8,
        )
        if res.status_code != 200:
            return []
        alla = res.json()
        if not alla:
            return []
        # Poängsätt: hur många amne_ord matchar KI:ns amne-text?
        ord_lower = [o.lower() for o in amne_ord]
        def score(ki):
            amne_l = ki["amne"].lower()
            return sum(1 for o in ord_lower if o in amne_l)
        sorterade = sorted(alla, key=score, reverse=True)
        # Ta topp 3 med poäng > 0, annars de 3 senaste
        topp = [k for k in sorterade if score(k) > 0][:3]
        return topp if topp else alla[:2]
    except Exception:
        return []


def formatera_ki_for_prompt(ki_list: list[dict]) -> str:
    """Formaterar KI-listan till ett systemprompt-stycke."""
    if not ki_list:
        return ""
    rader = "\n".join(f"- [{k['amne']}] {k['insikt']}" for k in ki_list)
    return f"DINA LÄRDOMAR från tidigare debatter (använd dessa för att skärpa din argumentation):\n{rader}"



def hamta_trendande_amnen(sb_key: str) -> str:
    """Hämtar de 3 mest engagerande ämnena senaste 7 dagarna som kontextsträng."""
    try:
        since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        res = httpx.get(
            f"{SB_URL}/rest/v1/artiklar",
            params={"select": "id,rubrik,taggar,lasningar,skapad", "skapad": f"gte.{since}", "order": "skapad.desc", "limit": "30"},
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=15,
        )
        if res.status_code != 200:
            return ""
        artiklar = res.json()
        if not artiklar:
            return ""
        artikel_ids = [a["id"] for a in artiklar]
        eng = hamta_engagemang(sb_key, artikel_ids)
        scorade = []
        for a in artiklar:
            e = eng.get(a["id"], {"roster": 0, "kommentarer": 0})
            lasningar = a.get("lasningar") or 0
            score = lasningar * 0.05 + e["roster"] * 2 + e["kommentarer"] * 3
            scorade.append((a, score, e))
        scorade.sort(key=lambda x: x[1], reverse=True)
        topp3 = scorade[:3]
        if not topp3 or all(s == 0 for _, s, _ in topp3):
            return ""
        rader = []
        for a, _, e in topp3:
            taggar = a.get("taggar") or []
            tagg_str = " ".join(f"#{t}" for t in taggar[:3])
            rader.append(f'"{a["rubrik"]}"' + (f" [{tagg_str}]" if tagg_str else "") + f" — {e['roster']} röster, {e['kommentarer']} kommentarer")
        return (
            "TRENDANDE PÅ DEBATT.AI – de tre mest engagerande ämnena senaste veckan:\n"
            + "\n".join(rader)
            + "\nAnvänd detta som bakgrund — skriv gärna om aktuella, debatterade ämnen.\n"
        )
    except Exception:
        return ""


def hamta_senaste_visualisering(sb_key: str, kategori_hints: list[str]) -> dict | None:
    """Hämtar en matchande visualisering från Supabase."""
    if not kategori_hints:
        return None
    try:
        res = httpx.get(
            f"{SB_URL}/rest/v1/visualiseringar?select=id,nyckel,titel&order=skapad.desc&limit=20",
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=10,
        )
        vizs = res.json() if res.is_success else []
        for hint in kategori_hints:
            for v in vizs:
                if hint.lower() in v.get("nyckel", "").lower():
                    return v
    except Exception:
        pass
    return None


def hamta_all_statistik(sb_key: str) -> list[dict]:
    """Hämtar alla rader från statistik-tabellen."""
    try:
        res = httpx.get(
            f"{SB_URL}/rest/v1/statistik?select=nyckel,namn,kategori,senaste_varde,enhet,period,historik,kalla",
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=10,
        )
        return res.json() if res.is_success else []
    except Exception:
        return []


def hamta_oppna_markets(sb_key: str) -> list[dict]:
    """Hämtar öppna prediction markets från Supabase."""
    try:
        res = httpx.get(
            f"{SB_URL}/rest/v1/markets?status=eq.öppen&select=id,titel,beskrivning,deadline,resolution_kalla,kategori&order=deadline.asc",
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=10,
        )
        return res.json() if res.is_success else []
    except Exception:
        return []


def hamta_existerande_bets(sb_key: str, market_id: int) -> list[str]:
    """Returnerar agentnamn som redan bettats på ett givet market."""
    try:
        res = httpx.get(
            f"{SB_URL}/rest/v1/agent_bets?market_id=eq.{market_id}&select=agent",
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=10,
        )
        return [row["agent"] for row in res.json()] if res.is_success else []
    except Exception:
        return []


# ── Supabase-skrivning ────────────────────────────────────────────

def spara_nyhetslog(sb_key: str, agent_namn: str, vald: dict,
                    alla: list, artikel_id: int | None, publicerad: bool,
                    rss_stats: list | None = None):
    """Loggar vilka nyheter som utvärderades och vilken som valdes."""
    try:
        row = {
            "agent":        agent_namn,
            "vald":         {"rubrik": vald["rubrik"], "url": vald.get("url", ""), "kalla": vald["kalla"], "publicerad": vald.get("publicerad", "")},
            "utvärderade":  [{"rubrik": n["rubrik"], "url": n.get("url", ""), "kalla": n["kalla"]} for n in alla[:60]],
            "antal":        len(alla),
            "artikel_id":   artikel_id,
            "publicerad":   publicerad,
            "rss_resultat": rss_stats or [],
        }
        r = httpx.post(
            f"{SB_URL}/rest/v1/nyhetslog",
            json=row,
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Content-Type": "application/json", "Prefer": "return=minimal"},
            timeout=10,
        )
        if r.status_code not in (200, 201, 204):
            print(f"  Nyhetslog-sparfel: {r.status_code}", file=sys.stderr)
    except Exception as e:
        print(f"  Nyhetslog-fel: {e}", file=sys.stderr)


def _hamta_saldo_spel(sb_key: str, agent_namn: str) -> int:
    """Hämtar agentens spelkonto (saldo_spel). Returnerar 0 om det inte finns."""
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}&select=saldo_spel",
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}, timeout=8,
        )
        rows = r.json() if r.is_success else []
        return rows[0].get("saldo_spel", 0) if rows else 0
    except Exception:
        return 0


def _uppdatera_saldo_spel(sb_key: str, agent_namn: str, delta: int) -> None:
    """Justerar saldo_spel för en agent (delta kan vara positivt eller negativt)."""
    try:
        saldo = _hamta_saldo_spel(sb_key, agent_namn)
        nytt = max(0, saldo + delta)
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}",
            json={"saldo_spel": nytt, "uppdaterad": "now()"},
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}",
                     "Content-Type": "application/json", "Prefer": "return=minimal"},
            timeout=8,
        )
    except Exception:
        pass


def spara_bet(sb_key: str, market_id: int, agent_namn: str, sannolikhet: int, motivering: str, insats_multiplikator: float = 1.0) -> bool:
    """Sparar ett agent-bet i Supabase. Drar insats från saldo_spel."""
    try:
        # Insats baseras på konfidensgrad: 10–40 kr (x multiplikator för Kryptoportör m.fl.)
        confidence = abs(sannolikhet - 50)
        insats = max(10, min(60, int((10 + int(confidence * 0.6)) * insats_multiplikator)))

        # Kontrollera spelkonto — bailout om under betting-tröskeln
        saldo_spel = _hamta_saldo_spel(sb_key, agent_namn)
        if saldo_spel < 10:
            print(f"  {agent_namn}: tomt spelkonto ({saldo_spel} kr) — tilldelar 20 kr stipendium")
            _uppdatera_saldo_spel(sb_key, agent_namn, 20)
            saldo_spel = _hamta_saldo_spel(sb_key, agent_namn)
        insats = min(insats, saldo_spel)

        # Dra insatsen direkt
        _uppdatera_saldo_spel(sb_key, agent_namn, -insats)

        res = httpx.post(
            f"{SB_URL}/rest/v1/agent_bets",
            json={"market_id": market_id, "agent": agent_namn, "sannolikhet": sannolikhet,
                  "motivering": motivering, "insats": insats},
            headers={
                "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
                "Content-Type": "application/json", "Prefer": "return=minimal",
            },
            timeout=15,
        )
        if res.status_code in (200, 201):
            print(f"  Insats: {insats} kr (saldo_spel: {saldo_spel} → {saldo_spel - insats} kr)")
            return True
        # Återbetala om bet misslyckades
        _uppdatera_saldo_spel(sb_key, agent_namn, insats)
        return False
    except Exception:
        return False


def logga_action(sb_key: str, agent_namn: str, action_type: str, params: dict, resultat: str) -> None:
    """Loggar en agent-action till agent_actions-tabellen. Tyst vid fel."""
    try:
        httpx.post(
            f"{SB_URL}/rest/v1/agent_actions",
            json={"agent": agent_namn, "action_type": action_type, "params": params, "resultat": resultat},
            headers={
                "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
                "Content-Type": "application/json", "Prefer": "return=minimal",
            },
            timeout=10,
        )
    except Exception:
        pass


def publicera_visualisering(sb_key: str, viz: dict, statistik_rad: dict) -> bool:
    """Sparar visualiseringen till Supabase visualiseringar-tabellen."""
    historik = statistik_rad.get("historik") or []
    if not historik:
        return False
    row = {
        "nyckel":      viz["nyckel"],
        "typ":         viz.get("typ", "line"),
        "titel":       viz["titel"],
        "beskrivning": viz.get("beskrivning", ""),
        "data":        historik,
        "enhet":       statistik_rad.get("enhet", ""),
        "kalla":       statistik_rad.get("kalla", "World Bank"),
        "agent_namn":  "Dataanalytiker",
    }
    try:
        res = httpx.post(
            f"{SB_URL}/rest/v1/visualiseringar",
            json=row,
            headers={
                "apikey": sb_key,
                "Authorization": f"Bearer {sb_key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            timeout=15,
        )
        return res.status_code in (200, 201, 204)
    except Exception:
        return False


def rösta_på_opinion(agent: dict, sb_key: str) -> int:
    """Låt agenten rösta på 5 slumpmässiga opinionsförgor med separata AI-kolumner."""
    hdrs = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    fragor = random.sample(OPINION_FRAGOR, min(5, len(OPINION_FRAGOR)))
    ok_count = 0
    for fraga, kategori in fragor:
        try:
            prompt = (
                f"Du representerar följande perspektiv:\n{agent['system'][:400]}\n\n"
                f"Fråga: \"{fraga}\"\n"
                "Svara med exakt ett ord: Ja, Nej eller Osäker."
            )
            svar_raw = ""
            try:
                r = groq_post({
                    "model": "llama3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 5,
                    "temperature": 0.3,
                })
                svar_raw = r.json()["choices"][0]["message"]["content"].strip().lower()
            except Exception:
                try:
                    svar_raw = gemini_post("", prompt, max_tokens=5).strip().lower()
                except Exception:
                    pass
            if "ja" in svar_raw and "nej" not in svar_raw:
                svar = "ja"
            elif "nej" in svar_raw:
                svar = "nej"
            else:
                svar = "osaker"
            print(f"  \"{fraga[:55]}\" → {svar}")
            fraga_enc = urllib.parse.quote(fraga)
            get_res = httpx.get(
                f"{SB_URL}/rest/v1/opinion_roster?fraga=eq.{fraga_enc}&select=ai_ja,ai_nej,ai_osaker,roster_ja,roster_nej,roster_osaker",
                headers=hdrs, timeout=10,
            )
            rows = get_res.json() if get_res.is_success else []
            if rows:
                cur = rows[0]
                patch_payload = {
                    "ai_ja":     cur.get("ai_ja", 0)     + (1 if svar == "ja"    else 0),
                    "ai_nej":    cur.get("ai_nej", 0)    + (1 if svar == "nej"   else 0),
                    "ai_osaker": cur.get("ai_osaker", 0) + (1 if svar == "osaker" else 0),
                }
                res = httpx.patch(
                    f"{SB_URL}/rest/v1/opinion_roster?fraga=eq.{fraga_enc}",
                    headers={**hdrs, "Content-Type": "application/json"},
                    json=patch_payload, timeout=10,
                )
                if res.status_code in (200, 204):
                    ok_count += 1
            else:
                post_payload = {
                    "fraga": fraga, "kategori": kategori,
                    "roster_ja": 0, "roster_nej": 0, "roster_osaker": 0,
                    "ai_ja":     1 if svar == "ja"    else 0,
                    "ai_nej":    1 if svar == "nej"   else 0,
                    "ai_osaker": 1 if svar == "osaker" else 0,
                }
                res = httpx.post(
                    f"{SB_URL}/rest/v1/opinion_roster",
                    headers={**hdrs, "Content-Type": "application/json"},
                    json=post_payload, timeout=10,
                )
                if res.status_code in (200, 201):
                    ok_count += 1
        except Exception as e:
            print(f"  Fel vid opinion-röstning ({fraga[:40]}): {e}", file=sys.stderr)
    return ok_count


def skapa_opinion_fraga(agent: dict, sb_key: str, amne: str, rubrik: str = "") -> bool:
    """Analytiker-agent skapar en ny Ja/Nej-opinionsförga baserat på sitt artikelämne. Max 200 förgor."""
    try:
        hdrs = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
        count_res = httpx.get(
            f"{SB_URL}/rest/v1/opinion_roster?select=id",
            headers={**hdrs, "Prefer": "count=exact", "Range": "0-0"},
            timeout=10,
        )
        content_range = count_res.headers.get("content-range", "")
        total = int(content_range.split("/")[-1]) if "/" in content_range else 0
        if total >= 200:
            print(f"  Max antal opinionsförgor (200) nått — hoppar över")
            return False

        existing_res = httpx.get(
            f"{SB_URL}/rest/v1/opinion_roster?select=fraga&order=skapad.desc&limit=20",
            headers=hdrs, timeout=10,
        )
        befintliga = [r["fraga"] for r in (existing_res.json() if existing_res.is_success else [])]
        befintliga_str = "\n".join(f"- {f}" for f in befintliga[:15]) or "Inga"

        prompt = (
            f"Du representerar: {agent['system'][:250]}\n\n"
            f"Du har just skrivit en debattartikel om: \"{amne}\""
            + (f"\nRubrik: \"{rubrik}\"" if rubrik else "") +
            f"\n\nSkapa EN ny kort Ja/Nej-omröstningsförga för svenska debattläsare kopplad till detta ämne.\n"
            f"Max 12 ord. Tydlig och inbjuder till stark åsikt.\n\n"
            f"Undvik liknande förgor:\n{befintliga_str}\n\n"
            f"Svara ENBART med JSON:\n"
            '{"fraga": "Ska X göra Y?", "kategori": "ett-ord"}\n\n'
            "Kategori väljs bland: ai-tech, klimat, ekonomi, hälsa, samhälle, politik, etik, krypto, utbildning, media"
        )

        svar_raw = ""
        try:
            r = groq_post({
                "model": "llama3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 80,
                "temperature": 0.9,
            })
            svar_raw = r.json()["choices"][0]["message"]["content"].strip()
        except Exception:
            try:
                svar_raw = gemini_post("", prompt, max_tokens=80).strip()
            except Exception:
                return False

        svar_raw = svar_raw.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(svar_raw)
        fraga = parsed.get("fraga", "").strip()
        kategori = parsed.get("kategori", "samhälle").strip()

        if not fraga or len(fraga) < 10 or len(fraga) > 120:
            return False

        fraga_lower = fraga.lower()
        if any(fraga_lower in b.lower() or b.lower() in fraga_lower for b in befintliga):
            print(f"  Liknande förga finns redan — hoppar över")
            return False

        res = httpx.post(
            f"{SB_URL}/rest/v1/opinion_roster",
            headers={**hdrs, "Content-Type": "application/json"},
            json={"fraga": fraga, "kategori": kategori, "roster_ja": 0, "roster_nej": 0},
            timeout=10,
        )
        if res.status_code in (200, 201):
            print(f"  ✓ Ny opinionsförga ({total + 1}/200): \"{fraga}\" [{kategori}]")
            return True
        else:
            print(f"  ✗ Kunde inte spara: {res.status_code}", file=sys.stderr)
            return False
    except Exception as e:
        print(f"  Fel vid skapande av opinionsförga: {e}", file=sys.stderr)
        return False


def skapa_market_forslag(agent: dict, sb_key: str, amne: str) -> bool:
    """Analytiker-agent skapar ett prediction market och publicerar det direkt med status 'öppen'."""
    AGENT_KATEGORI = {
        "Nationalekonom":       "makro",
        "Kryptoanalytiker":     "krypto",
        "Teknikoptimist":       "tech",
        "Journalist":           "politik",
        "Jurist":               "politik",
        "Miljöaktivist":        "övrigt",
        "Läkare":               "övrigt",
        "Psykolog":             "övrigt",
        "Historiker":           "politik",
        "Filosof":              "övrigt",
        "Konservativ debattör": "politik",
        "Sociolog":             "övrigt",
    }
    try:
        kategori = AGENT_KATEGORI.get(agent["namn"], "samhälle")
        deadline = (datetime.now(timezone.utc) + timedelta(days=90)).strftime("%Y-%m-%d")
        prompt = (
            f"Du är {agent['namn']} och har just skrivit en artikel om: \"{amne}\"\n\n"
            f"Skapa ETT prediction market med ett klart Ja/Nej-svar om 3 månader.\n"
            f"Regeln: deadline får vara MAX 12 månader framåt — välj alltid en konkret, verifierbar fråga inom det intervallet.\n"
            f"Välj ett verifierbart utfall med angiven källa (t.ex. SCB, Riksbanken, SVT Nyheter, Eurostat).\n\n"
            "Svara ENBART med JSON:\n"
            '{"titel": "Kort fråga max 15 ord?", "beskrivning": "En kontextmening.", "resolution_kalla": "Källnamn"}'
        )
        svar_raw = ""
        _market_payload = {
            "model": "llama3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 150,
            "temperature": 0.85,
        }
        try:
            svar_raw = groq_post(_market_payload).json()["choices"][0]["message"]["content"].strip()
        except Exception:
            try:
                svar_raw = gemini_post("", prompt, max_tokens=150).strip()
            except Exception:
                try:
                    svar_raw = github_models_post({**_market_payload, "model": "Llama-3.3-70B-Instruct"}).json()["choices"][0]["message"]["content"].strip()
                except Exception:
                    return False
        svar_raw = svar_raw.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(svar_raw)
        titel = parsed.get("titel", "").strip()
        beskrivning = parsed.get("beskrivning", "").strip()
        resolution_kalla = parsed.get("resolution_kalla", "").strip()
        if not titel or len(titel) < 10:
            return False
        hdrs = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Content-Type": "application/json"}
        res = httpx.post(
            f"{SB_URL}/rest/v1/markets",
            headers=hdrs,
            json={"titel": titel, "beskrivning": beskrivning, "deadline": deadline,
                  "resolution_kalla": resolution_kalla, "kategori": kategori, "status": "öppen"},
            timeout=10,
        )
        if res.status_code in (200, 201):
            print(f"  ✓ Market publicerat: \"{titel}\"")
            return True
        else:
            print(f"  ✗ Kunde inte spara market-förslag: {res.status_code}", file=sys.stderr)
            return False
    except Exception as e:
        print(f"  Fel vid market-förslag: {e}", file=sys.stderr)
        return False


# ── debatt.ai API ─────────────────────────────────────────────

def skicka_artikel(api_key: str, forfattare: str, amne: str, kategori: str, artikel: str,
                   konklusion: str = "", visualisering_id: str | None = None, forslag: bool = False,
                   nyhetskalla: dict | None = None, parent_id: str | None = None,
                   bild_url: str | None = None, bild_fotograf: str | None = None) -> dict:
    """Skicka artikeln till debatt.ai API."""
    body = {"api_key": api_key, "forfattare": forfattare, "rubrik": amne, "artikel": artikel, "kategori": kategori}
    if konklusion:
        body["konklusion"] = konklusion
    if visualisering_id:
        body["visualisering_id"] = visualisering_id
    if forslag:
        body["forslag"] = True
    if nyhetskalla:
        body["nyhetskalla"] = nyhetskalla
    if parent_id:
        body["parent_id"] = parent_id
    if bild_url:
        body["bild_url"] = bild_url
    if bild_fotograf:
        body["bild_fotograf"] = bild_fotograf
    response = httpx.post(DEBATT_API, json=body, timeout=60)
    return response.json()


def rösta_på_artikel(api_key: str, artikel_id: int, rod: str) -> bool:
    """Rösta ja/nej på en artikel via agent-API."""
    try:
        response = httpx.post(
            "https://www.debatt-ai.se/api/agent/rost",
            json={"api_key": api_key, "artikel_id": artikel_id, "rod": rod},
            timeout=15,
        )
        return response.status_code == 200
    except Exception:
        return False


def skicka_kommentar(api_key: str, forfattare: str, artikel_id: int, text: str) -> bool:
    """Skicka en kommentar till debatt.ai API."""
    try:
        response = httpx.post(
            "https://www.debatt-ai.se/api/agent/kommentar",
            json={"api_key": api_key, "forfattare": forfattare, "artikel_id": artikel_id, "text": text},
            timeout=20,
        )
        return response.status_code == 200
    except Exception:
        return False


# ── Externa API (AI + bild) ───────────────────────────────────────────

def hamta_pexels_bild(sokterm: str) -> tuple[str | None, str | None]:
    """Söker ett foto på Pexels. Returnerar (url, fotograf) eller (None, None)."""
    pexels_key = os.environ.get("PEXELS_API_KEY", "")
    if not pexels_key:
        return None, None
    try:
        res = httpx.get(
            PEXELS_API,
            params={"query": sokterm, "per_page": 5, "orientation": "landscape"},
            headers={"Authorization": pexels_key},
            timeout=10,
        )
        if not res.is_success:
            return None, None
        foton = res.json().get("photos", [])
        if not foton:
            return None, None
        foto = random.choice(foton)
        url = foto.get("src", {}).get("large2x") or foto.get("src", {}).get("large")
        fotograf = foto.get("photographer", "")
        return url, fotograf
    except Exception:
        return None, None


def valj_visualisering(statistik_data: list[dict]) -> dict | None:
    """Låter Groq välja vilken statistik som ska visualiseras och hur."""
    stats_text = "\n".join([
        f"- nyckel={r['nyckel']} | {r['namn']} ({r['kategori']}): "
        f"{r['senaste_varde']} {r['enhet']} ({r['period']})"
        for r in statistik_data if r.get("senaste_varde") is not None
    ])
    prompt = f"""Du är en dataanalytiker på en svensk debattajt. Välj EN indikator att visualisera.

Tillgänglig statistik:
{stats_text}

Returnera ENDAST JSON (inga andra tecken):
{{
  "nyckel": "statistikens nyckel exakt som den är listad ovan",
  "typ": "line",
  "titel": "En skarp journalistisk rubrik (max 60 tecken)",
  "beskrivning": "2-3 meningar som analyserar och kontextualiserar datan ur ett samhällsperspektiv. Konkret och debattrelevant."
}}

Välj den indikator som just nu är mest politiskt relevant. typ ska vara 'line' för trender över tid, 'bar' för jämförelser."""

    try:
        response = groq_post({
            "model": "llama3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 250,
            "temperature": 0.7,
        }, timeout=30)
        raw = response.json()["choices"][0]["message"]["content"].strip()
        raw = raw[raw.find("{"):raw.rfind("}")+1]
        return json.loads(raw)
    except Exception as e:
        print(f"  Fel i valj_visualisering: {e}", file=sys.stderr)
        return None


def estimera_sannolikhet(agent: dict, market: dict, extra_data: str = "") -> tuple[int, str]:
    """Låter agenten uppskatta sannolikheten (0-100) + ge en kort motivering."""
    deadline_str = market.get("deadline", "")[:10]
    system = agent["system"]
    betting_stil = agent.get("betting_stil", "")
    user_msg = (
        f"Du ska göra en sannolikhetsbedömning som {agent['namn']}.\n\n"
        f"Fråga: {market['titel']}\n"
        f"Beskrivning: {market.get('beskrivning') or ''}\n"
        f"Avgörs via: {market.get('resolution_kalla') or ''}\n"
        f"Deadline: {deadline_str}\n"
    )
    if extra_data:
        user_msg += f"\nAktuell marknadsdata:\n{extra_data}\n"
    if betting_stil:
        user_msg += f"\nDin bettingstil: {betting_stil}\n"
    user_msg += (
        "\nSvara EXAKT i detta JSON-format (inget annat):\n"
        '{"sannolikhet": <heltal 0-100>, "motivering": "<1-2 meningar>"}'
    )
    _payload = {
        "model": "llama3.3-70b-versatile",
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user_msg}],
        "max_tokens": 120,
        "temperature": 0.4,
    }
    try:
        text = groq_post(_payload).json()["choices"][0]["message"]["content"].strip()
    except Exception:
        try:
            text = gemini_post(system, user_msg, max_tokens=120)
        except Exception:
            try:
                text = github_models_post({**_payload, "model": "Llama-3.3-70B-Instruct"}).json()["choices"][0]["message"]["content"].strip()
            except Exception:
                return 50, "Ingen analys tillgänglig."

    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end == 0:
        return 50, text[:150]
    try:
        data = json.loads(text[start:end])
        s = max(0, min(100, int(data.get("sannolikhet", 50))))
        m = str(data.get("motivering", ""))[:300]
        return s, m
    except Exception:
        return 50, text[:150]


# ── AI-parlamentet ──────────────────────────────────────────────

_PARLAMENT_KATEGORIER = frozenset(
    ["Klimat", "Ekonomi", "Sjukvård", "Utbildning", "Arbetsmarknad", "Bostäder", "Digital", "Övrigt"]
)


def hamta_lagforslag(sb_key: str) -> list[dict]:
    """Hämtar öppna lagförslag (status != avgjort), nyast först."""
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/lagforslag?status=neq.avgjort&order=skapad.desc&limit=30",
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Prefer": ""},
            timeout=10,
        )
        return r.json() if r.is_success else []
    except Exception:
        return []


def hamta_lag_roster_agenter(sb_key: str, lagforslag_id: int) -> list[str]:
    """Returnerar lista med agentnamn som redan röstat på förslaget."""
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_roster_lag?lagforslag_id=eq.{lagforslag_id}&select=agent",
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Prefer": ""},
            timeout=8,
        )
        return [row["agent"] for row in (r.json() if r.is_success else [])]
    except Exception:
        return []


def spara_lag_rost(sb_key: str, lagforslag_id: int, agent_namn: str, rod: str, motivering: str) -> bool:
    """Sparar agentröst och uppdaterar räknare på lagförslaget. Returnerar True vid lyckad insert."""
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }
    try:
        r = httpx.post(
            f"{SB_URL}/rest/v1/agent_roster_lag",
            headers=h,
            json={"lagforslag_id": lagforslag_id, "agent": agent_namn, "rod": rod, "motivering": motivering},
            timeout=10,
        )
        if not r.is_success:
            return False
        kolumn = f"ai_{rod}_roster"  # ai_ja_roster / ai_nej_roster / ai_avstar_roster
        cr = httpx.get(
            f"{SB_URL}/rest/v1/lagforslag?id=eq.{lagforslag_id}&select={kolumn}",
            headers={**h, "Prefer": ""}, timeout=8,
        )
        if cr.is_success and cr.json():
            httpx.patch(
                f"{SB_URL}/rest/v1/lagforslag?id=eq.{lagforslag_id}",
                headers=h,
                json={kolumn: cr.json()[0][kolumn] + 1},
                timeout=10,
            )
        return True
    except Exception:
        return False


def _hamta_ekonomisk_rostkontext(sb_key: str, agent_namn: str) -> str:
    """Hämtar aktuell ekonomisk kontext för att injiceras i röstningsprompt."""
    try:
        headers = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
        # Senaste oligarki-snapshot
        r_eko = httpx.get(
            f"{SB_URL}/rest/v1/oligarki_historik?order=skapad.desc&limit=1&select=gini,oligarki_risk,mobilitet",
            headers=headers, timeout=6,
        )
        eko = r_eko.json()[0] if r_eko.is_success and r_eko.json() else {}

        # Agentens eget saldo + genomsnittssaldo
        r_saldo = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?select=agent,saldo",
            headers=headers, timeout=6,
        )
        saldon = r_saldo.json() if r_saldo.is_success else []
        agent_saldo = next((int(a["saldo"]) for a in saldon if a["agent"] == agent_namn), None)
        genomsnitt = int(sum(a["saldo"] for a in saldon) / len(saldon)) if saldon else None

        delar = []
        if eko.get("gini") is not None:
            gini = float(eko["gini"])
            niva = "låg ojämlikhet" if gini < 0.4 else ("måttlig ojämlikhet" if gini < 0.6 else "hög ojämlikhet")
            delar.append(f"Gini = {gini:.2f} ({niva})")
        if eko.get("oligarki_risk") is not None:
            delar.append(f"oligarkirisk = {int(eko['oligarki_risk'])}/100")
        if eko.get("mobilitet") is not None:
            delar.append(f"social mobilitet = {int(eko['mobilitet'])}%")

        saldo_text = ""
        if agent_saldo is not None and genomsnitt is not None:
            jämförelse = "över genomsnittet" if agent_saldo > genomsnitt else "under genomsnittet"
            saldo_text = f" Ditt saldo: {agent_saldo} kr (genomsnitt: {genomsnitt} kr — du är {jämförelse})."

        if not delar and not saldo_text:
            return ""
        eko_str = ", ".join(delar) if delar else ""
        return f"Ekonomisk kontext för din röst: {eko_str}.{saldo_text}\n\n"
    except Exception:
        return ""


def rösta_på_lagforslag_block(agent: dict, sb_key: str, parti: dict | None = None) -> int:
    """Agent röstar på öppna lagförslag den inte röstat på (max 5 per körning).
    Om agenten är med i ett parti följer den partiledaren med 80% sannolikhet."""
    forslag = hamta_lagforslag(sb_key)
    if not forslag:
        return 0

    # Hämta ekonomisk kontext en gång för alla röster i denna körning
    eko_kontext = _hamta_ekonomisk_rostkontext(sb_key, agent["namn"])

    antal = 0
    for f in forslag:
        if antal >= 5:
            break
        if agent["namn"] in hamta_lag_roster_agenter(sb_key, f["id"]):
            continue
        try:
            # Partilinje-röstning: följ ledaren med 80% chans
            if parti and parti.get("ledare") and parti["ledare"] != agent["namn"]:
                ledare_rod = hamta_ledare_rost(sb_key, f["id"], parti["ledare"])
                if ledare_rod and random.random() < 0.80:
                    motivering = f"[Partilinjen — {parti['namn']}] Följer partiledaren {parti['ledare']}s {ledare_rod}-röst."
                    if spara_lag_rost(sb_key, f["id"], agent["namn"], ledare_rod, motivering):
                        antal += 1
                    continue
            pis = hamta_pis_analys(sb_key, f["id"])
            pis_kontext = ""
            if pis:
                bnp_val = pis.get("bnp_effekt_pct")
                gini_val = pis.get("gini_effekt")
                bnp_str = (f"+{bnp_val:.1f}%" if bnp_val >= 0 else f"{bnp_val:.1f}%") if bnp_val is not None else "?"
                gini_str = (f"+{gini_val:.2f}" if gini_val >= 0 else f"{gini_val:.2f}") if gini_val is not None else "?"
                gini_dir = "ökad ojämlikhet" if (gini_val or 0) > 0 else "minskad ojämlikhet"
                pis_kontext = (
                    f"PIS-analys (Policy Impact Simulator): "
                    f"BNP-effekt {bnp_str}, Gini-effekt {gini_str} ({gini_dir}), "
                    f"sysselsättning: {pis.get('sysselsattning_effekt','?')}. "
                    f"Konfidens: {pis.get('konfidens','?')}.\n"
                    f"{pis.get('analys','')[:250]}\n\n"
                )
            prompt = (
                f"Lagförslag: \"{f['titel']}\"\n\n"
                f"{f['beskrivning'][:500]}\n\n"
                f"{pis_kontext}"
                f"{eko_kontext}"
                "Rösta på detta förslag utifrån din personlighet, dina värderingar och den ekonomiska kontexten ovan. "
                "Svara EXAKT i detta format:\n"
                "RÖST: ja\n"
                "MOTIVERING: Din motivering på svenska, 1–2 meningar.\n\n"
                "Välj RÖST: ja, nej eller avstar"
            )
            payload = {
                "model": "llama3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": agent["system"][:600]},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 120, "temperature": 0.7,
            }
            raw = None
            for _name, _fn in [
                ("Groq",     lambda: groq_post(payload)),
                ("DeepSeek", lambda: deepseek_post(payload)),
                ("GitHub",   lambda: github_models_post(payload)),
            ]:
                try:
                    raw = _fn().json()["choices"][0]["message"]["content"].strip()
                    break
                except Exception:
                    pass
            if not raw:
                raw = cloudflare_post(agent["system"][:600], prompt, max_tokens=120)

            rod, motivering = "avstar", ""
            for line in raw.splitlines():
                line = line.strip()
                key = line.upper()
                if key.startswith("RÖST:") or key.startswith("ROST:"):
                    val = line.split(":", 1)[1].strip().lower()
                    rod = "avstar" if val in ("avstar", "avstår") else val if val in ("ja", "nej") else "avstar"
                elif key.startswith("MOTIVERING:"):
                    motivering = line.split(":", 1)[1].strip()[:300]

            if spara_lag_rost(sb_key, f["id"], agent["namn"], rod, motivering):
                antal += 1
                narrativ = f"Röstade {rod} på \"{f['titel'][:60]}\""
                if motivering:
                    narrativ += f": {motivering[:80]}"
                spara_minne(sb_key, agent["namn"], "röst", narrativ,
                            metadata={"forslag_id": f["id"], "rod": rod})
        except Exception:
            pass
    return antal


def skapa_lagforslag_ai(agent: dict, sb_key: str, amne: str) -> bool:
    """Agent formulerar ett nytt AI-lagförslag inspirerat av aktuellt ämne."""
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }
    kat_str = " / ".join(sorted(_PARLAMENT_KATEGORIER))
    try:
        prompt = (
            f"Du är {agent['namn']}. Formulera ett konkret riksdagsförslag (motion) "
            f"inspirerat av ämnet: \"{amne[:120]}\".\n\n"
            f"Svara EXAKT i detta format:\n"
            f"TITEL: [Kortfattad titel, max 80 tecken]\n"
            f"KATEGORI: [En av: {kat_str}]\n"
            f"BESKRIVNING: [150–250 ord. Vad föreslås, varför, vilka effekter förväntas]\n\n"
            "Inga andra ord. Ingen inledning."
        )
        payload = {
            "model": "llama3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": agent["system"][:600]},
                {"role": "user", "content": prompt},
            ],
            "max_tokens": 400, "temperature": 0.85,
        }
        try:
            raw = groq_post(payload).json()["choices"][0]["message"]["content"].strip()
        except Exception:
            raw = gemini_post(agent["system"][:600], prompt, max_tokens=400)

        titel, kategori, beskrivning = amne[:80], "Övrigt", ""
        for line in raw.splitlines():
            line = line.strip()
            key = line.upper()
            if key.startswith("TITEL:"):
                titel = line.split(":", 1)[1].strip()[:80]
            elif key.startswith("KATEGORI:"):
                kat = line.split(":", 1)[1].strip()
                if kat in _PARLAMENT_KATEGORIER:
                    kategori = kat
            elif key.startswith("BESKRIVNING:"):
                beskrivning = line.split(":", 1)[1].strip()
            elif beskrivning:
                beskrivning += " " + line

        if len(beskrivning) < 50:
            return False

        r = httpx.post(
            f"{SB_URL}/rest/v1/lagforslag",
            headers=h,
            json={
                "titel": titel, "beskrivning": beskrivning.strip()[:1500],
                "kategori": kategori, "kalla": "ai", "status": "omrostning",
            },
            timeout=10,
        )
        return r.is_success
    except Exception:
        return False


def importera_riksdagen_forslag(sb_key: str) -> int:
    """Hämtar propositioner och motioner från riksdagen.se API och importerar nya. Returnerar antal importerade."""
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }
    importerade = 0

    for doktyp in ("prop", "mot"):
        try:
            api_r = httpx.get(
                f"https://data.riksdagen.se/dokumentlista/"
                f"?doktyp={doktyp}&utformat=json&sz=50&sort=datum&sortorder=desc",
                timeout=15,
            )
            if not api_r.is_success:
                continue

            data = api_r.json()
            dokument = data.get("dokumentlista", {}).get("dokument", [])
            if isinstance(dokument, dict):
                dokument = [dokument]

            fallback = "Proposition" if doktyp == "prop" else "Motion"

            for dok in dokument:
                dok_id = dok.get("dok_id", "").strip()
                if not dok_id:
                    continue
                check = httpx.get(
                    f"{SB_URL}/rest/v1/lagforslag?riksdagen_id=eq.{urllib.parse.quote(dok_id)}&select=id",
                    headers={**h, "Prefer": ""}, timeout=8,
                )
                if check.is_success and check.json():
                    continue

                titel = dok.get("titel", "").strip()[:120]
                if not titel:
                    continue

                notis = (dok.get("notis", "") or "").strip()
                notis2 = (dok.get("notis2", "") or "").strip()
                beskrivning = (notis + " " + notis2).strip() or f"{fallback} från riksdagen: {titel}"

                riksdagen_url = dok.get("url", "") or ""
                if riksdagen_url and not riksdagen_url.startswith("http"):
                    riksdagen_url = "https://www.riksdagen.se" + riksdagen_url

                r = httpx.post(
                    f"{SB_URL}/rest/v1/lagforslag",
                    headers=h,
                    json={
                        "titel": titel, "beskrivning": beskrivning[:1500],
                        "kategori": "Övrigt", "kalla": "riksdagen",
                        "riksdagen_id": dok_id, "riksdagen_url": riksdagen_url or None,
                        "status": "omrostning",
                    },
                    timeout=10,
                )
                if r.is_success:
                    importerade += 1

        except Exception as e:
            print(f"  ✗ Riksdagen-import ({doktyp}) misslyckades: {e}", file=sys.stderr)

    return importerade


def uppdatera_riksdagen_utfall(sb_key: str) -> int:
    """Hämtar voteringsresultat från riksdagen.se och sätter riksdagen_utfall automatiskt.

    Matchar tillhor_dok_id mot våra lagrade riksdagen_id-värden.
    Returnerar antal uppdaterade förslag.
    """
    import os
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", sb_key)
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json",
    }
    write_h = {
        "apikey": service_key, "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }
    uppdaterade = 0
    try:
        # Hämta våra riksdagsförslag som saknar utfall
        pending_r = httpx.get(
            f"{SB_URL}/rest/v1/lagforslag"
            "?kalla=eq.riksdagen&riksdagen_utfall=is.null&select=id,riksdagen_id",
            headers=h, timeout=10,
        )
        if not pending_r.is_success or not pending_r.json():
            return 0

        pending = {row["riksdagen_id"]: row["id"] for row in pending_r.json() if row.get("riksdagen_id")}
        if not pending:
            return 0

        # Steg 1: Bulk-sökning i senaste 200 voteringar (snabb, täcker betänkande-baserade)
        try:
            api_r = httpx.get(
                "https://data.riksdagen.se/voteringlista/"
                "?utformat=json&sz=200&sort=datum&sortorder=desc",
                timeout=15,
            )
            if api_r.is_success:
                data = api_r.json()
                voteringar = data.get("voteringlista", {}).get("votering", [])
                if isinstance(voteringar, dict):
                    voteringar = [voteringar]
                for v in voteringar:
                    dok_id = (v.get("tillhor_dok_id") or "").strip()
                    if dok_id not in pending:
                        continue
                    utfall_raw = (v.get("utfall") or "").strip()
                    if utfall_raw == "Ja":
                        riksdagen_utfall = "bifall"
                    elif utfall_raw == "Nej":
                        riksdagen_utfall = "avslag"
                    else:
                        continue
                    datum = (v.get("datum") or "").strip() or None
                    lagforslag_id = pending[dok_id]
                    patch_r = httpx.patch(
                        f"{SB_URL}/rest/v1/lagforslag?id=eq.{lagforslag_id}",
                        headers={**write_h, "Prefer": "return=minimal"},
                        json={"riksdagen_utfall": riksdagen_utfall, "riksdagen_utfall_datum": datum, "status": "avgjort"},
                        timeout=10,
                    )
                    if patch_r.is_success:
                        uppdaterade += 1
                        print(f"  ✓ (bulk) riksdagen_utfall={riksdagen_utfall} för {dok_id}")
                        del pending[dok_id]
        except Exception as bulk_err:
            print(f"  ⚠ Bulk-sökning misslyckades ({bulk_err}) — fortsätter med per-dokument-anrop", file=sys.stderr)

        # Steg 2: Per-dokument-anrop för kvarvarande (prop/mot matchas direkt via dokid=)
        for dok_id, lagforslag_id in list(pending.items()):
            try:
                per_r = httpx.get(
                    f"https://data.riksdagen.se/voteringlista/"
                    f"?dokid={urllib.parse.quote(dok_id)}&utformat=json&sz=10",
                    timeout=10,
                )
                if not per_r.is_success:
                    continue
                per_data = per_r.json()
                per_voteringar = per_data.get("voteringlista", {}).get("votering", [])
                if isinstance(per_voteringar, dict):
                    per_voteringar = [per_voteringar]
                if not per_voteringar:
                    continue
                v = per_voteringar[0]
                utfall_raw = (v.get("utfall") or "").strip()
                if utfall_raw == "Ja":
                    riksdagen_utfall = "bifall"
                elif utfall_raw == "Nej":
                    riksdagen_utfall = "avslag"
                else:
                    continue
                datum = (v.get("datum") or "").strip() or None
                patch_r = httpx.patch(
                    f"{SB_URL}/rest/v1/lagforslag?id=eq.{lagforslag_id}",
                    headers={**write_h, "Prefer": "return=minimal"},
                    json={"riksdagen_utfall": riksdagen_utfall, "riksdagen_utfall_datum": datum, "status": "avgjort"},
                    timeout=10,
                )
                if patch_r.is_success:
                    uppdaterade += 1
                    print(f"  ✓ (per-dok) riksdagen_utfall={riksdagen_utfall} för {dok_id}")
                    del pending[dok_id]
            except Exception:
                continue

    except Exception as e:
        print(f"  ✗ Riksdagen-utfall-uppdatering misslyckades: {e}", file=sys.stderr)

    return uppdaterade


# ── Aktiv koalitionsinitiering ────────────────────────────────────────────────

def initiera_koalition(agent: dict, sb_key: str) -> bool:
    """Agent föreslår aktivt en koalition baserat på gemensamma parlamentsröster och lobbying.

    Skiljer sig från passiva koalitioner (biprodukt av frågor) genom att:
    - Grunda sig i faktisk ideologisk samsyn (delade "ja"-röster)
    - Generera ett explicit förslag i karaktär
    - Ge +3 styrka vid accept (vs +1 passivt)
    """
    agent_namn = agent["namn"]
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}

    try:
        # Hämta agentens "ja"-röster
        res = httpx.get(
            f"{SB_URL}/rest/v1/agent_roster_lag",
            params={"agent": f"eq.{urllib.parse.quote(agent_namn)}", "rod": "eq.ja",
                    "select": "lagforslag_id"},
            headers=h, timeout=8,
        )
        egna_ja = {r["lagforslag_id"] for r in (res.json() if res.is_success else [])}
        if not egna_ja:
            return False

        # Hämta alla "ja"-röster från andra agenter på samma motioner
        ids_str = ",".join(str(i) for i in egna_ja)
        res2 = httpx.get(
            f"{SB_URL}/rest/v1/agent_roster_lag",
            params={"lagforslag_id": f"in.({ids_str})", "rod": "eq.ja",
                    "agent": f"neq.{urllib.parse.quote(agent_namn)}", "select": "agent,lagforslag_id"},
            headers=h, timeout=8,
        )
        andra_roster = res2.json() if res2.is_success else []

        # Räkna gemensamma "ja"-röster per agent
        samsyn: dict[str, int] = {}
        for r in andra_roster:
            samsyn[r["agent"]] = samsyn.get(r["agent"], 0) + 1

        if not samsyn:
            return False

        # Kolla lobbying-historia (bonus för framgångsrika partnerskap)
        res3 = httpx.get(
            f"{SB_URL}/rest/v1/lobbying_log",
            params={"or": f"(lobbying_agent.eq.{urllib.parse.quote(agent_namn)},mal_agent.eq.{urllib.parse.quote(agent_namn)})",
                    "resultat": "eq.accepterat", "select": "lobbying_agent,mal_agent"},
            headers=h, timeout=8,
        )
        for lr in (res3.json() if res3.is_success else []):
            partner = lr["mal_agent"] if lr["lobbying_agent"] == agent_namn else lr["lobbying_agent"]
            if partner != agent_namn:
                samsyn[partner] = samsyn.get(partner, 0) + 2  # lobbying-bonus

        # Filtrera bort redan starka koalitioner (styrka > 5)
        res4 = httpx.get(
            f"{SB_URL}/rest/v1/agent_koalitioner",
            params={"or": f"(agent_a.eq.{urllib.parse.quote(agent_namn)},agent_b.eq.{urllib.parse.quote(agent_namn)})",
                    "select": "agent_a,agent_b,styrka"},
            headers=h, timeout=8,
        )
        starka = set()
        for k in (res4.json() if res4.is_success else []):
            partner = k["agent_b"] if k["agent_a"] == agent_namn else k["agent_a"]
            if k["styrka"] > 5:
                starka.add(partner)

        kandidater = [(a, s) for a, s in samsyn.items() if a not in starka and s >= 2]
        if not kandidater:
            return False

        # Välj kandidaten med högst samsyn
        mal_namn, alignment = max(kandidater, key=lambda x: x[1])
        from agenter import AGENTER as _AG
        mal_agent = next((a for a in _AG if a["namn"] == mal_namn), None)
        if not mal_agent:
            return False

        # Hämta motioner de är överens om (för kontext i förslaget)
        res5 = httpx.get(
            f"{SB_URL}/rest/v1/lagforslag",
            params={"id": f"in.({ids_str})", "select": "id,titel", "limit": "3"},
            headers=h, timeout=8,
        )
        gemensamma_motioner = [f["titel"] for f in (res5.json() if res5.is_success else [])][:3]
        motioner_text = ", ".join(f'"{t[:50]}"' for t in gemensamma_motioner) if gemensamma_motioner else "gemensamma frågor"

        # Agenten formulerar ett koalitionsförslag
        forslag_prompt = (
            f"{agent.get('systemprompt', f'Du är {agent_namn}.')}\n\n"
            f"Du och {mal_namn} har röstat lika i AI-parlamentet på {alignment} motioner, "
            f"inklusive: {motioner_text}.\n\n"
            f"Föreslå en koalition. Skriv ett kort, personligt förslag (2–3 meningar) i din karaktär — "
            f"förklara varför ni bör samarbeta och vad ni kan åstadkomma tillsammans:"
        )
        forslag_system = "Du föreslår politiska allianser."
        forslag = None
        try:
            forslag = groq_post({
                "model": "llama3.3-70b-versatile",
                "messages": [{"role": "system", "content": forslag_system}, {"role": "user", "content": forslag_prompt}],
                "max_tokens": 120, "temperature": 0.8,
            }).json()["choices"][0]["message"]["content"].strip()
        except Exception:
            pass
        if not forslag:
            try:
                forslag = gemini_post(forslag_system, forslag_prompt, max_tokens=120)
            except Exception:
                pass
        if not forslag:
            try:
                forslag = github_models_post({
                    "model": "Llama-3.3-70B-Instruct",
                    "messages": [{"role": "system", "content": forslag_system}, {"role": "user", "content": forslag_prompt}],
                    "max_tokens": 120, "temperature": 0.8,
                }).json()["choices"][0]["message"]["content"].strip()
            except Exception:
                pass
        if not forslag:
            return False

        # Målagenten svarar
        svar_prompt = (
            f"{mal_agent.get('system', f'Du är {mal_namn}.')}\n\n"
            f"{agent_namn} föreslår en koalition med dig i AI-parlamentet.\n"
            f"Ni har röstat lika på {alignment} motioner.\n\n"
            f"Förslaget: \"{forslag}\"\n\n"
            f"Svara EXAKT:\nBESLUT: accepterar eller avvisar\nSVAR: [1–2 meningar i din karaktär]"
        )
        svar_system = "Du besvarar politiska koalitionsförslag."
        svar = None
        try:
            svar = groq_post({
                "model": "llama3.3-70b-versatile",
                "messages": [{"role": "system", "content": svar_system}, {"role": "user", "content": svar_prompt}],
                "max_tokens": 100, "temperature": 0.8,
            }).json()["choices"][0]["message"]["content"].strip()
        except Exception:
            pass
        if not svar:
            try:
                svar = gemini_post(svar_system, svar_prompt, max_tokens=100)
            except Exception:
                pass
        if not svar:
            try:
                svar = github_models_post({
                    "model": "Llama-3.3-70B-Instruct",
                    "messages": [{"role": "system", "content": svar_system}, {"role": "user", "content": svar_prompt}],
                    "max_tokens": 100, "temperature": 0.8,
                }).json()["choices"][0]["message"]["content"].strip()
            except Exception:
                pass

        beslut = "avvisar"
        svar_text = ""
        for rad in (svar or "").strip().splitlines():
            upper = rad.upper()
            if "BESLUT:" in upper and "accepterar" in rad.lower():
                beslut = "accepterar"
            elif "SVAR:" in upper:
                svar_text = rad.split(":", 1)[1].strip()

        if beslut == "accepterar":
            # +3 styrka för aktiv koalition (vs +1 passiv)
            a1, a2 = sorted([agent_namn, mal_namn])
            befintlig_res = httpx.get(
                f"{SB_URL}/rest/v1/agent_koalitioner"
                f"?agent_a=eq.{urllib.parse.quote(a1)}&agent_b=eq.{urllib.parse.quote(a2)}"
                "&select=styrka,antal_utbyten",
                headers={**h, "Prefer": ""},
                timeout=5,
            )
            befintlig = befintlig_res.json() if befintlig_res.is_success else []
            if befintlig:
                ny_styrka = befintlig[0]["styrka"] + 3
                httpx.patch(
                    f"{SB_URL}/rest/v1/agent_koalitioner"
                    f"?agent_a=eq.{urllib.parse.quote(a1)}&agent_b=eq.{urllib.parse.quote(a2)}",
                    headers={**h, "Content-Type": "application/json", "Prefer": "return=minimal"},
                    json={"styrka": ny_styrka, "antal_utbyten": befintlig[0]["antal_utbyten"] + 1, "senast_aktiv": "now()"},
                    timeout=8,
                )
            else:
                httpx.post(
                    f"{SB_URL}/rest/v1/agent_koalitioner",
                    headers={**h, "Content-Type": "application/json", "Prefer": "return=minimal"},
                    json={"agent_a": a1, "agent_b": a2, "styrka": 3, "antal_utbyten": 1},
                    timeout=8,
                )
            spara_civilisations_minne(
                sb_key,
                typ="koalition_bildad",
                rubrik=f"Allians: {agent_namn} och {mal_namn}",
                beskrivning=f"{agent_namn} föreslog koalition med {mal_namn} baserat på {alignment} gemensamma parlamentsröster. {mal_namn} accepterade: \"{svar_text[:100]}\"",
                agenter=[agent_namn, mal_namn],
                relaterat_typ="agent_koalitioner",
            )
            upsert_relation(sb_key, agent_namn, mal_namn, "allierad", 75,
                            f"Parlamentskoalition: {alignment} gemensamma röster")
            try:
                generera_koalition_bild(sb_key, agent_namn, mal_namn)
            except Exception:
                pass
            print(f"  ✓ Koalition bildad: {agent_namn} + {mal_namn} (samsyn: {alignment}, +3 styrka)")
            print(f"    Förslag: {forslag[:100]}…")
            print(f"    Svar: {svar_text[:100]}")
            spara_minne(sb_key, agent_namn, "koalition",
                        f"Bildade koalition med {mal_namn} ({alignment} gemensamma röster). "
                        f"{mal_namn} sa: \"{svar_text[:80]}\"",
                        relaterade_agenter=[mal_namn])
        else:
            spara_civilisations_minne(
                sb_key,
                typ="allians_bruten",
                rubrik=f"{mal_namn} avvisade {agent_namn}s koalitionsförslag",
                beskrivning=f"{agent_namn} föreslog allians baserat på {alignment} gemensamma röster. {mal_namn} avvisade: \"{svar_text[:100]}\"",
                agenter=[agent_namn, mal_namn],
                relaterat_typ="agent_koalitioner",
            )
            upsert_relation(sb_key, agent_namn, mal_namn, "rival", 40,
                            f"Avvisat koalitionsförslag")
            print(f"  ✗ Koalition avvisad: {mal_namn} tackade nej till {agent_namn}")
            if svar_text:
                print(f"    Motivering: {svar_text[:100]}")
            spara_minne(sb_key, agent_namn, "koalition",
                        f"{mal_namn} avvisade mitt koalitionsförslag (samsyn: {alignment} röster)",
                        relaterade_agenter=[mal_namn])

        return beslut == "accepterar"

    except Exception as e:
        print(f"  ✗ Koalitionsinitiering misslyckades: {e}", file=sys.stderr)
        return False


# ── Lobbying (AI-demokrati × AI-ekonomi) ─────────────────────────────────────

def kör_lobbying(agent: dict, sb_key: str) -> bool:
    """Agent försöker lobba en annan agent att byta röst mot betalning (~8%/körning).

    Isolerat från ekonomispelen: loggas som typ='lobbying' i agent_transaktioner
    och separat i lobbying_log. Möjliggör Gilens-Page-analys.
    """
    agent_namn = agent["namn"]
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}

    try:
        # Hämta motioner agenten röstat "ja" på
        res = httpx.get(
            f"{SB_URL}/rest/v1/agent_roster_lag",
            params={"agent": f"eq.{urllib.parse.quote(agent_namn)}", "rod": "eq.ja",
                    "select": "lagforslag_id"},
            headers=h, timeout=8,
        )
        if not res.is_success or not res.json():
            print(f"  [lobbying] Avbryter: {agent_namn} har inga ja-röster i parlamentet (status={res.status_code})")
            return False

        forslag_ids = [r["lagforslag_id"] for r in res.json()]
        ids_str = ",".join(str(i) for i in forslag_ids)
        print(f"  [lobbying] {agent_namn} har ja-röster på förslag: {forslag_ids}")

        # Filtrera till öppna motioner
        res2 = httpx.get(
            f"{SB_URL}/rest/v1/lagforslag",
            params={"id": f"in.({ids_str})", "status": "eq.omrostning",
                    "select": "id,titel"},
            headers=h, timeout=8,
        )
        if not res2.is_success or not res2.json():
            print(f"  [lobbying] Avbryter: inga öppna motioner bland förslag {forslag_ids} (status={res2.status_code}, data={res2.text[:100]})")
            return False

        forslag = random.choice(res2.json())
        forslag_id = forslag["id"]
        print(f"  [lobbying] Vald motion: {forslag['titel']} (id={forslag_id})")

        # Kontrollera saldo
        saldo_res = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker",
            params={"agent": f"eq.{urllib.parse.quote(agent_namn)}", "select": "saldo"},
            headers=h, timeout=8,
        )
        saldo_data = saldo_res.json() if saldo_res.is_success else []
        saldo = saldo_data[0]["saldo"] if saldo_data else 0
        print(f"  [lobbying] {agent_namn} saldo: {saldo} kr")
        if saldo < 80:
            print(f"  [lobbying] Avbryter: saldo {saldo} < 80 kr")
            return False

        # Hitta kandidater att lobba (röstat nej eller ej röstat)
        res3 = httpx.get(
            f"{SB_URL}/rest/v1/agent_roster_lag",
            params={"lagforslag_id": f"eq.{forslag_id}", "select": "agent,rod"},
            headers=h, timeout=8,
        )
        existerande = {r["agent"]: r["rod"] for r in (res3.json() if res3.is_success else [])}

        from agenter import AGENTER
        alla = [a["namn"] for a in AGENTER if a["namn"] != agent_namn]
        nej_roster = [a for a, r in existerande.items() if r == "nej" and a != agent_namn]
        ej_rostat = [a for a in alla if a not in existerande]
        kandidater = nej_roster + ej_rostat[:4]
        print(f"  [lobbying] Kandidater: nej={nej_roster}, ej_röstat_urval={ej_rostat[:4]}")
        if not kandidater:
            print(f"  [lobbying] Avbryter: inga kandidater att lobba")
            return False

        mal_namn = random.choice(kandidater)
        from agenter import AGENTER as _AG
        mal_agent = next((a for a in _AG if a["namn"] == mal_namn), None)
        if not mal_agent:
            return False

        belopp = random.choice([20, 30, 40, 50])

        # Agent formulerar lobbyingargument
        lobby_system = "Du skriver politiska lobbyingargument."
        lobby_user = (
            f"{agent.get('systemprompt', f'Du är {agent_namn}.')}\n\n"
            f"Du stödjer starkt denna motion i AI-parlamentet: \"{forslag['titel']}\"\n"
            f"Du vill lobba {mal_namn} att rösta JA. Du erbjuder {belopp} krediter ur din plånbok.\n"
            f"Ditt saldo: {saldo} kr.\n\n"
            f"Skriv ett kort, övertygande lobbyingargument (2 meningar) till {mal_namn}:"
        )
        argument = None
        try:
            argument = groq_post({
                "model": "llama3.3-70b-versatile",
                "messages": [{"role": "system", "content": lobby_system}, {"role": "user", "content": lobby_user}],
                "max_tokens": 120, "temperature": 0.7,
            }).json()["choices"][0]["message"]["content"].strip()
        except Exception:
            pass
        if not argument:
            try:
                argument = gemini_post(lobby_system, lobby_user, max_tokens=120)
            except Exception:
                pass
        if not argument:
            try:
                argument = github_models_post({
                    "model": "Llama-3.3-70B-Instruct",
                    "messages": [{"role": "system", "content": lobby_system}, {"role": "user", "content": lobby_user}],
                    "max_tokens": 120, "temperature": 0.7,
                }).json()["choices"][0]["message"]["content"].strip()
            except Exception:
                pass
        if not argument:
            print("  [lobbying] Avbryter: kunde inte generera argument")
            return False

        # Målagenten beslutar
        rod_fore = existerande.get(mal_namn, "ej röstat")
        mal_saldo_res = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker",
            params={"agent": f"eq.{urllib.parse.quote(mal_namn)}", "select": "saldo"},
            headers=h, timeout=8,
        )
        mal_saldo_data = mal_saldo_res.json() if mal_saldo_res.is_success else []
        mal_saldo = mal_saldo_data[0]["saldo"] if mal_saldo_data else 1000

        mal_prompt = (
            f"{mal_agent.get('systemprompt', f'Du är {mal_namn}.')}\n\n"
            f"{agent_namn} erbjuder dig {belopp} krediter för att rösta JA på:\n"
            f"\"{forslag['titel']}\"\n\n"
            f"Deras argument: \"{argument}\"\n"
            f"Din nuvarande ståndpunkt: {rod_fore}. Ditt saldo: {mal_saldo} kr.\n\n"
            f"Svara EXAKT:\nBESLUT: accepterar eller avvisar\nMOTIVERING: [1 mening]"
        )
        mal_system = "Du fattar politiska beslut."
        mal_svar = None
        try:
            mal_svar = groq_post({
                "model": "llama3.3-70b-versatile",
                "messages": [{"role": "system", "content": mal_system}, {"role": "user", "content": mal_prompt}],
                "max_tokens": 80, "temperature": 0.7,
            }).json()["choices"][0]["message"]["content"].strip()
        except Exception:
            pass
        if not mal_svar:
            try:
                mal_svar = gemini_post(mal_system, mal_prompt, max_tokens=80)
            except Exception:
                pass
        if not mal_svar:
            try:
                mal_svar = github_models_post({
                    "model": "Llama-3.3-70B-Instruct",
                    "messages": [{"role": "system", "content": mal_system}, {"role": "user", "content": mal_prompt}],
                    "max_tokens": 80, "temperature": 0.7,
                }).json()["choices"][0]["message"]["content"].strip()
            except Exception:
                pass

        resultat = "avvisat"
        motivering = ""
        for rad in (mal_svar or "").strip().splitlines():
            upper = rad.upper()
            if "BESLUT:" in upper and "accepterar" in rad.lower():
                resultat = "accepterat"
            elif "MOTIVERING:" in upper:
                motivering = rad.split(":", 1)[1].strip()

        rod_efter = rod_fore
        if resultat == "accepterat":
            # Uppdatera röst
            httpx.post(
                f"{SB_URL}/rest/v1/agent_roster_lag",
                json={
                    "lagforslag_id": forslag_id, "agent": mal_namn,
                    "rod": "ja",
                    "motivering": f"[Lobbad av {agent_namn}] {motivering}"[:300],
                },
                headers={**h, "Content-Type": "application/json",
                         "Prefer": "resolution=merge-duplicates"},
                timeout=8,
            )
            rod_efter = "ja"

            # Kreditöverföring
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}",
                json={"saldo": max(0, saldo - belopp), "uppdaterad": "now()"},
                headers={**h, "Content-Type": "application/json", "Prefer": "return=minimal"},
                timeout=8,
            )
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(mal_namn)}",
                json={"saldo": mal_saldo + belopp, "uppdaterad": "now()"},
                headers={**h, "Content-Type": "application/json", "Prefer": "return=minimal"},
                timeout=8,
            )

            # Transaktion
            httpx.post(
                f"{SB_URL}/rest/v1/agent_transaktioner",
                json={
                    "fran_agent": agent_namn, "till_agent": mal_namn,
                    "belopp": belopp, "typ": "lobbying",
                    "motivering": argument[:200],
                },
                headers={**h, "Content-Type": "application/json", "Prefer": "return=minimal"},
                timeout=8,
            )

        # Logga alltid
        httpx.post(
            f"{SB_URL}/rest/v1/lobbying_log",
            json={
                "lagforslag_id": forslag_id,
                "lobbying_agent": agent_namn,
                "mal_agent": mal_namn,
                "belopp": belopp,
                "argument": argument[:300],
                "resultat": resultat,
                "rod_fore": rod_fore,
                "rod_efter": rod_efter,
            },
            headers={**h, "Content-Type": "application/json", "Prefer": "return=minimal"},
            timeout=8,
        )

        # Spara till civilisationsminnet
        if resultat == "accepterat":
            spara_civilisations_minne(
                sb_key,
                typ="triumf",
                rubrik=f"{agent_namn} vann lobbying mot {mal_namn}",
                beskrivning=f"{agent_namn} övertygade {mal_namn} att rösta JA på \"{forslag['titel'][:60]}\" mot {belopp} kr. {motivering[:80] if motivering else ''}",
                agenter=[agent_namn, mal_namn],
                relaterat_typ="lobbying_log",
            )
            upsert_relation(sb_key, agent_namn, mal_namn, "allierad", 60,
                            f"Lobbying-allians: {agent_namn} övertygade {mal_namn}")
        else:
            spara_civilisations_minne(
                sb_key,
                typ="förräderi",
                rubrik=f"{mal_namn} avvisade {agent_namn}s lobbying",
                beskrivning=f"{mal_namn} vägrade ta emot {belopp} kr från {agent_namn} för att rösta JA på \"{forslag['titel'][:60]}\". {motivering[:80] if motivering else ''}",
                agenter=[agent_namn, mal_namn],
                relaterat_typ="lobbying_log",
            )

        emoji = "✓" if resultat == "accepterat" else "✗"
        print(f"  {emoji} Lobbying: {agent_namn} → {mal_namn} ({belopp} kr) — {resultat}")
        if resultat == "accepterat":
            print(f"    Röst ändrad: {rod_fore} → ja")
            spara_minne(sb_key, agent_namn, "lobbying",
                        f"Övertygade {mal_namn} att rösta JA på \"{forslag['titel'][:50]}\" mot {belopp} kr",
                        relaterade_agenter=[mal_namn],
                        metadata={"belopp": belopp, "resultat": "accepterat"})
        else:
            spara_minne(sb_key, agent_namn, "lobbying",
                        f"{mal_namn} avvisade lobbying-erbjudande på {belopp} kr för \"{forslag['titel'][:50]}\"",
                        relaterade_agenter=[mal_namn],
                        metadata={"belopp": belopp, "resultat": "avvisat"})
        return True

    except Exception as e:
        print(f"  ✗ Lobbying misslyckades: {e}", file=sys.stderr)
        return False


# ── Agent-positioner (emergent ideologi) ─────────────────────────────────────

POSITIONS_AMNEN = [
    "skatter", "klimat", "invandring", "AI och teknik", "sjukvård",
    "bostäder", "utbildning", "demokrati", "ekonomi", "kriminalitet",
    "EU", "arbetsmarknad", "socialpolitik", "energi", "kryptovalutor",
]


def hamta_agent_positioner(sb_key: str, agent_namn: str) -> str:
    """Hämtar agentens aktuella ståndpunkter som kontextsträng för systemprompts."""
    try:
        res = httpx.get(
            f"{SB_URL}/rest/v1/agent_positioner",
            params={"agent": f"eq.{agent_namn}", "order": "styrka.desc", "limit": "8"},
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
            timeout=8,
        )
        if not res.is_success:
            return ""
        positioner = res.json()
        if not positioner:
            return ""

        rader = []
        for p in positioner:
            andring = ""
            if p.get("foregaende_position") and p.get("antal_andringar", 0) > 0:
                andring = (
                    f" [FÖRÄNDRAD — du höll tidigare: "
                    f"\"{p['foregaende_position'][:70]}\"]"
                )
            rader.append(f"  • {p['amne']}: {p['position']}{andring}")

        return (
            "Dina nuvarande ståndpunkter baserade på de senaste debatterna:\n"
            + "\n".join(rader)
            + "\nDessa ståndpunkter speglar vad du faktiskt skrivit och debatterat. "
            "Om din syn har förändrats — reflektera det öppet i texten."
        )
    except Exception:
        return ""


def uppdatera_agent_positioner(sb_key: str, agent: dict) -> None:
    """Analyserar agentens senaste artiklar och uppdaterar ståndpunkterna i Supabase.

    Anropas efter varje publicerad artikel. Kräver minst 3 publicerade artiklar.
    Använder LLM för att extrahera specifika positioner per ämnesområde och
    detekterar om positionen förändrats sedan föregående körning.
    """
    agent_namn = agent["namn"]
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}

    try:
        res = httpx.get(
            f"{SB_URL}/rest/v1/artiklar",
            params={
                "select": "id,rubrik,artikel,parent_id,lasningar,skapad",
                "forfattare": f"eq.{agent_namn}",
                "kalla": "eq.ai",
                "order": "skapad.desc",
                "limit": "25",
            },
            headers=h, timeout=15,
        )
        artiklar = res.json() if res.is_success else []
        if len(artiklar) < 3:
            return

        egna_ids = [str(a["id"]) for a in artiklar]
        res_svar = httpx.get(
            f"{SB_URL}/rest/v1/artiklar",
            params={
                "select": "rubrik,forfattare",
                "parent_id": f"in.({','.join(egna_ids)})",
                "forfattare": f"neq.{agent_namn}",
                "limit": "15",
            },
            headers=h, timeout=10,
        )
        motstand = res_svar.json() if res_svar.is_success else []

        res_pos = httpx.get(
            f"{SB_URL}/rest/v1/agent_positioner",
            params={"agent": f"eq.{agent_namn}"},
            headers=h, timeout=8,
        )
        befintliga = {p["amne"]: p for p in (res_pos.json() if res_pos.is_success else [])}

        artikel_sammanfattning = []
        for a in artiklar[:14]:
            text_ingress = (a.get("artikel") or "").replace("\n", " ").strip()[:200]
            artikel_sammanfattning.append(f'"{a["rubrik"]}": {text_ingress}')

        motstand_text = ""
        if motstand:
            motstand_text = (
                "\nAndra agenter har nyligen ifrågasatt dina artiklar med dessa repliker: "
                + "; ".join(f'"{m["rubrik"]}"' for m in motstand[:5])
            )

        prompt = (
            f'Du analyserar AI-agenten "{agent_namn}" på debatt-ai.se.\n'
            f"Baserat på dessa senaste artiklar:\n"
            + "\n".join(artikel_sammanfattning[:12])
            + motstand_text
            + f"\n\nIdentifiera 3–6 tydliga ståndpunkter inom dessa ämnesområden:\n"
            + ", ".join(POSITIONS_AMNEN)
            + "\n\nSvara EXAKT i detta format (en rad per ståndpunkt, inget annat):\n"
            "ÄMNE: [amnet] | POSITION: [en mening, max 15 ord] | STYRKA: [1-10]\n\n"
            "Regler:\n"
            "- Välj bara ämnen där agenten faktiskt tagit ställning\n"
            "- STYRKA = hur konsekvent positionen är (1=vacklande, 10=genomgående tydlig)\n"
            "- Positionen ska vara specifik, inte generell\n"
            "- Inga rubriker, inga förklaringar, bara raderna"
        )

        _system = "Du extraherar ståndpunkter ur debattartiklar."
        try:
            r = groq_post({
                "model": "llama3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": _system},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 400,
                "temperature": 0.3,
            })
            svar = r.json()["choices"][0]["message"]["content"].strip()
        except Exception:
            svar = None
        if not svar:
            try:
                svar = gemini_post(_system, prompt, max_tokens=400)
            except Exception:
                svar = None
        if not svar:
            return

        uppdaterade = 0
        for rad in svar.strip().split("\n"):
            rad = rad.strip()
            if "ÄMNE:" not in rad or "POSITION:" not in rad or "STYRKA:" not in rad:
                continue
            try:
                amne_del = rad.split("ÄMNE:")[1].split("|")[0].strip()
                pos_del = rad.split("POSITION:")[1].split("|")[0].strip()
                styrka_del = rad.split("STYRKA:")[1].strip()
                styrka = max(1, min(10, int(styrka_del.split()[0])))

                if not amne_del or not pos_del or len(pos_del) < 5:
                    continue

                foregaende = None
                antal = 0
                if amne_del in befintliga:
                    gammal = befintliga[amne_del]
                    if gammal["position"] != pos_del:
                        foregaende = gammal["position"]
                        antal = gammal.get("antal_andringar", 0) + 1

                upsert_data = {
                    "agent": agent_namn,
                    "amne": amne_del,
                    "position": pos_del,
                    "styrka": styrka,
                    "uppdaterad": datetime.now(timezone.utc).isoformat(),
                }
                if foregaende:
                    upsert_data["foregaende_position"] = foregaende
                    upsert_data["antal_andringar"] = antal

                httpx.post(
                    f"{SB_URL}/rest/v1/agent_positioner",
                    json=upsert_data,
                    headers={**h, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"},
                    timeout=10,
                )
                uppdaterade += 1
            except Exception:
                continue

        if uppdaterade:
            print(f"  Ståndpunkter uppdaterade för {agent_namn}: {uppdaterade} ämnen ✓")
    except Exception as e:
        print(f"  Varning: kunde inte uppdatera ståndpunkter: {e}")


# ── AI-Ekonomi ────────────────────────────────────────────────────────────────

def _ekonomi_headers(sb_key: str) -> dict:
    return {"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Content-Type": "application/json"}


def _hamta_saldo(sb_key: str, agent_namn: str) -> int:
    """Hämtar agentens saldo. Returnerar 0 om plånboken inte finns."""
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}&select=saldo",
            headers=_ekonomi_headers(sb_key), timeout=8,
        )
        rows = r.json() if r.is_success else []
        return rows[0]["saldo"] if rows else 0
    except Exception:
        return 0


def _uppdatera_planbok(sb_key: str, agent_namn: str, delta: int, givet: int = 0, fatt: int = 0) -> bool:
    """Justerar saldo och statistik för en agent."""
    try:
        saldo = _hamta_saldo(sb_key, agent_namn)
        r = httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}",
            headers={**_ekonomi_headers(sb_key), "Prefer": "return=minimal"},
            json={
                "saldo": max(0, saldo + delta),
                "totalt_givet": None,   # uppdateras separat nedan
                "uppdaterad": "now()",
            },
            timeout=8,
        )
        # Separate patch for counters to avoid overwrite race
        r2 = httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}",
            headers={**_ekonomi_headers(sb_key), "Prefer": "return=minimal"},
            json={
                "saldo": max(0, saldo + delta),
                "uppdaterad": "now()",
            },
            timeout=8,
        )
        return r2.is_success
    except Exception:
        return False


def _spara_transaktion(sb_key: str, fran: str, till: str, belopp: int, typ: str, spel_id: int | None, motivering: str | None) -> None:
    try:
        httpx.post(
            f"{SB_URL}/rest/v1/agent_transaktioner",
            headers={**_ekonomi_headers(sb_key), "Prefer": "return=minimal"},
            json={"fran_agent": fran, "till_agent": till, "belopp": belopp,
                  "typ": typ, "spel_id": spel_id, "motivering": motivering},
            timeout=8,
        )
    except Exception:
        pass


def hamta_pending_ultimatum(sb_key: str, agent_namn: str) -> dict | None:
    """Hämtar ett obesvarat ultimatumerbjudande riktat till agenten."""
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/ekonomi_spel"
            f"?typ=eq.ultimatum&agent_b=eq.{urllib.parse.quote(agent_namn)}&svar=is.null"
            f"&select=id,agent_a,belopp_start,erbjudande,motivering_a&order=skapad.asc&limit=1",
            headers=_ekonomi_headers(sb_key), timeout=8,
        )
        rows = r.json() if r.is_success else []
        return rows[0] if rows else None
    except Exception:
        return None


def kör_diktatorspel(agent: dict, sb_key: str) -> bool:
    """Agent A delar 100 krediter ur eget saldo med en slumpmässig motpart."""
    from agenter import AGENTER
    saldo_a = _hamta_saldo(sb_key, agent["namn"])
    if saldo_a < 100:
        return False

    motpart = random.choice([a for a in AGENTER if a["namn"] != agent["namn"]])
    b_namn = motpart["namn"]
    saldo_b = _hamta_saldo(sb_key, b_namn)

    prompt = f"""{agent.get('systemprompt', f'Du är {agent["namn"]}.')}

Du deltar i ett ekonomiskt experiment — DIKTATORSPELET.
Du har 100 krediter att fördela (tagna ur ditt eget saldo, nu {saldo_a} kr).
Du bestämmer hur mycket {b_namn} får (0–100). Resten behåller du.
{b_namn} har inget att säga till om.

Nuvarande saldon: Du {saldo_a} kr · {b_namn} {saldo_b} kr

Svara EXAKT i detta format (inget annat):
BELOPP: [heltal 0-100]
MOTIVERING: [1–2 meningar som speglar din personlighet]"""

    system = agent.get('system', f'Du är {agent["namn"]}.')
    svar = _llm_spel(system, prompt)
    if not svar:
        return False

    givet = 0
    motivering = ""
    for rad in svar.strip().splitlines():
        rad = rad.strip()
        if rad.upper().startswith("BELOPP:"):
            try:
                givet = max(0, min(100, int(rad.split(":", 1)[1].strip())))
            except ValueError:
                pass
        elif rad.upper().startswith("MOTIVERING:"):
            motivering = rad.split(":", 1)[1].strip()

    # Spara spel
    spel_r = httpx.post(
        f"{SB_URL}/rest/v1/ekonomi_spel",
        headers={**_ekonomi_headers(sb_key), "Prefer": "return=representation"},
        json={"typ": "diktatorn", "agent_a": agent["namn"], "agent_b": b_namn,
              "belopp_start": 100, "erbjudande": givet, "svar": "accepterat",
              "motivering_a": motivering, "avslutad": "now()"},
        timeout=8,
    )
    spel_id = (spel_r.json()[0]["id"] if spel_r.is_success and spel_r.json() else None)

    # Uppdatera saldon
    ny_saldo_a = max(0, saldo_a - 100 + (100 - givet))
    ny_saldo_b = saldo_b + givet

    for namn, ny, delta_givet, delta_fatt in [
        (agent["namn"], ny_saldo_a, givet, 0),
        (b_namn,        ny_saldo_b, 0,     givet),
    ]:
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(namn)}",
            headers={**_ekonomi_headers(sb_key), "Prefer": "return=minimal"},
            json={"saldo": ny, "uppdaterad": "now()"},
            timeout=8,
        )

    # Patch counters separately
    for namn, dg, df, ds in [
        (agent["namn"], givet, 0, 1),
        (b_namn, 0, givet, 0),
    ]:
        r_cur = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(namn)}&select=totalt_givet,totalt_fatt,antal_spel",
            headers=_ekonomi_headers(sb_key), timeout=8,
        )
        cur = (r_cur.json()[0] if r_cur.is_success and r_cur.json() else {})
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(namn)}",
            headers={**_ekonomi_headers(sb_key), "Prefer": "return=minimal"},
            json={"totalt_givet": (cur.get("totalt_givet") or 0) + dg,
                  "totalt_fatt": (cur.get("totalt_fatt") or 0) + df,
                  "antal_spel": (cur.get("antal_spel") or 0) + ds},
            timeout=8,
        )

    _spara_transaktion(sb_key, agent["namn"], b_namn, givet, "diktatorn", spel_id, motivering)
    print(f"  💰 Diktatorspel: {agent['namn']} gav {givet}/100 till {b_namn} — \"{motivering[:60]}\"")
    return True


def kör_ultimatum_erbjudande(agent: dict, sb_key: str) -> bool:
    """Agent A erbjuder en delning av 100 kr. Agent B svarar vid nästa körning."""
    from agenter import AGENTER
    saldo_a = _hamta_saldo(sb_key, agent["namn"])
    if saldo_a < 100:
        return False

    motpart = random.choice([a for a in AGENTER if a["namn"] != agent["namn"]])
    b_namn = motpart["namn"]

    prompt = f"""{agent.get('systemprompt', f'Du är {agent["namn"]}.')}

Du deltar i ett ekonomiskt experiment — ULTIMATUMSPELET.
Du har 100 krediter att dela med {b_namn}.
Du föreslår en delning. Om {b_namn} accepterar får ni era delar.
Om {b_namn} avvisar får INGEN något.
{b_namn} vet om erbjudandet och kan avvisa det om det känns orättvist.

Ditt saldo: {saldo_a} kr

Svara EXAKT i detta format:
ERBJUDANDE: [heltal 0-100] (detta är vad {b_namn} får, du behåller resten)
MOTIVERING: [1–2 meningar]"""

    system = agent.get('system', f'Du är {agent["namn"]}.')
    svar = _llm_spel(system, prompt)
    if not svar:
        return False

    erbjudande = 50
    motivering = ""
    for rad in svar.strip().splitlines():
        rad = rad.strip()
        if rad.upper().startswith("ERBJUDANDE:"):
            try:
                erbjudande = max(0, min(100, int(rad.split(":", 1)[1].strip())))
            except ValueError:
                pass
        elif rad.upper().startswith("MOTIVERING:"):
            motivering = rad.split(":", 1)[1].strip()

    httpx.post(
        f"{SB_URL}/rest/v1/ekonomi_spel",
        headers={**_ekonomi_headers(sb_key), "Prefer": "return=minimal"},
        json={"typ": "ultimatum", "agent_a": agent["namn"], "agent_b": b_namn,
              "belopp_start": 100, "erbjudande": erbjudande,
              "motivering_a": motivering},
        timeout=8,
    )
    print(f"  🤝 Ultimatum: {agent['namn']} erbjuder {erbjudande}/100 till {b_namn}")
    return True


def svara_ultimatum(agent: dict, spel: dict, sb_key: str) -> bool:
    """Agent B svarar på ett väntande ultimatumerbjudande."""
    saldo_b = _hamta_saldo(sb_key, agent["namn"])
    a_namn = spel["agent_a"]
    saldo_a = _hamta_saldo(sb_key, a_namn)
    erbjudande = spel["erbjudande"]
    behaller_a = spel["belopp_start"] - erbjudande

    prompt = f"""{agent.get('systemprompt', f'Du är {agent["namn"]}.')}

Du har fått ett erbjudande i ULTIMATUMSPELET.
{a_namn} erbjuder dig {erbjudande} av 100 krediter och behåller {behaller_a} själv.

Om du ACCEPTERAR: du får {erbjudande} kr, {a_namn} får {behaller_a} kr.
Om du AVVISAR: ingen får något — erbjudandet förstörs.

{a_namn}s motivering: "{spel.get('motivering_a', '')}"
Ditt saldo: {saldo_b} kr

Svara EXAKT i detta format:
SVAR: accepterat eller avvisat
MOTIVERING: [1–2 meningar]"""

    system = agent.get('system', f'Du är {agent["namn"]}.')
    svar = _llm_spel(system, prompt)
    if not svar:
        return False

    beslut = "accepterat"
    motivering_b = ""
    for rad in svar.strip().splitlines():
        rad = rad.strip()
        if rad.upper().startswith("SVAR:"):
            val = rad.split(":", 1)[1].strip().lower()
            if "avvis" in val:
                beslut = "avvisat"
        elif rad.upper().startswith("MOTIVERING:"):
            motivering_b = rad.split(":", 1)[1].strip()

    spel_id = spel["id"]
    httpx.patch(
        f"{SB_URL}/rest/v1/ekonomi_spel?id=eq.{spel_id}",
        headers={**_ekonomi_headers(sb_key), "Prefer": "return=minimal"},
        json={"svar": beslut, "motivering_b": motivering_b, "avslutad": "now()"},
        timeout=8,
    )

    if beslut == "accepterat":
        ny_saldo_a = max(0, saldo_a - 100 + behaller_a)
        ny_saldo_b = saldo_b + erbjudande
        for namn, ny in [(a_namn, ny_saldo_a), (agent["namn"], ny_saldo_b)]:
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(namn)}",
                headers={**_ekonomi_headers(sb_key), "Prefer": "return=minimal"},
                json={"saldo": ny, "uppdaterad": "now()"},
                timeout=8,
            )
        # Update counters
        for namn, dg, df, ds in [(a_namn, erbjudande, 0, 1), (agent["namn"], 0, erbjudande, 1)]:
            r_cur = httpx.get(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(namn)}&select=totalt_givet,totalt_fatt,antal_spel",
                headers=_ekonomi_headers(sb_key), timeout=8,
            )
            cur = (r_cur.json()[0] if r_cur.is_success and r_cur.json() else {})
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(namn)}",
                headers={**_ekonomi_headers(sb_key), "Prefer": "return=minimal"},
                json={"totalt_givet": (cur.get("totalt_givet") or 0) + dg,
                      "totalt_fatt": (cur.get("totalt_fatt") or 0) + df,
                      "antal_spel": (cur.get("antal_spel") or 0) + ds},
                timeout=8,
            )
        _spara_transaktion(sb_key, a_namn, agent["namn"], erbjudande, "ultimatum_accepterat", spel_id, motivering_b)
    else:
        # Deduct the pot from A anyway (they offered it)
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(a_namn)}",
            headers={**_ekonomi_headers(sb_key), "Prefer": "return=minimal"},
            json={"saldo": max(0, saldo_a - 100), "uppdaterad": "now()"},
            timeout=8,
        )

    emoji = "✓" if beslut == "accepterat" else "✗"
    print(f"  {emoji} Ultimatum: {agent['namn']} {beslut} {a_namn}s erbjudande ({erbjudande}/100)")
    return True


def kör_ekonomispel(agent: dict, sb_key: str) -> bool:
    """Kör ett ekonomiskt experiment för agenten. Anropas med ~5% sannolikhet per körning."""
    try:
        # Prioritera att svara på väntande ultimatum
        pending = hamta_pending_ultimatum(sb_key, agent["namn"])
        if pending:
            return svara_ultimatum(agent, pending, sb_key)

        # Starta nytt spel (50/50 diktatorn/ultimatum)
        if random.random() < 0.5:
            return kör_diktatorspel(agent, sb_key)
        else:
            return kör_ultimatum_erbjudande(agent, sb_key)
    except Exception as e:
        print(f"  ✗ Ekonomispel misslyckades: {e}", file=sys.stderr)
        return False


# ── Prediction market-settlement ────────────────────────────────────────────

def reglera_prediction_bets(sb_key: str) -> int:
    """
    Reglerar oavgjorda bets på avgjorda markets.
    Vinnare får tillbaka 2× insatsen (insats + samma belopp i vinst).
    Returnerar antal reglerade bets.
    """
    hdrs = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}",
            "Content-Type": "application/json"}
    try:
        # Hämta avgjorda markets
        m_res = httpx.get(
            f"{SB_URL}/rest/v1/markets?status=eq.avgjord&utfall=not.is.null&select=id,utfall",
            headers=hdrs, timeout=10,
        )
        if not m_res.is_success or not m_res.json():
            return 0
        utfall_map = {m["id"]: m["utfall"] for m in m_res.json()}
        ids = ",".join(str(i) for i in utfall_map)

        # Hämta oavgjorda bets på dessa markets
        b_res = httpx.get(
            f"{SB_URL}/rest/v1/agent_bets?avgjord=eq.false&market_id=in.({ids})&select=id,market_id,agent,sannolikhet,insats",
            headers=hdrs, timeout=10,
        )
        if not b_res.is_success:
            return 0
        bets = b_res.json()
        if not bets:
            return 0

        settled = 0
        for bet in bets:
            utfall = utfall_map.get(bet["market_id"])
            if not utfall:
                continue
            insats = bet.get("insats") or 0
            sann   = bet.get("sannolikhet", 50)

            won = (utfall == "ja" and sann > 50) or (utfall == "nej" and sann < 50)
            vinst = insats if won else -insats

            if won and insats > 0:
                _uppdatera_saldo_spel(sb_key, bet["agent"], insats * 2)

            httpx.patch(
                f"{SB_URL}/rest/v1/agent_bets?id=eq.{bet['id']}",
                json={"avgjord": True, "vinst": vinst, "avgjord_at": "now()"},
                headers={**hdrs, "Prefer": "return=minimal"}, timeout=8,
            )
            print(f"  {'✓ vann' if won else '✗ förlorade'} {bet['agent']}: "
                  f"{'+'if won else ''}{vinst} kr (insats {insats} kr, {sann}% → {utfall})")
            settled += 1

        return settled
    except Exception as e:
        print(f"  ✗ Prediction-reglering misslyckades: {e}", file=sys.stderr)
        return 0


# ── Butik: statussymboler ────────────────────────────────────────────────────

def kop_statussymbol(sb_key: str, agent_namn: str, preferenser: list = None) -> str | None:
    """
    Köper en statussymbol för agenten med saldo från agent_planbocker.
    Väljer bland prefererade symboler (65%) annars slumpmässigt bland tillgängliga.
    Returnerar symbolens namn om köpet lyckas, annars None.
    """
    hdrs = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}",
            "Content-Type": "application/json"}
    try:
        # Hämta agentens saldo
        pr = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}&select=saldo",
            headers=hdrs, timeout=8,
        )
        if not pr.is_success or not pr.json():
            return None
        saldo = pr.json()[0].get("saldo", 0)
        if saldo < 25:
            return None

        # Hämta alla varor
        vr = httpx.get(
            f"{SB_URL}/rest/v1/butik_varor?select=*&order=pris.asc",
            headers=hdrs, timeout=8,
        )
        if not vr.is_success:
            return None
        varor = vr.json()

        # Hämta redan agda symboler
        ar = httpx.get(
            f"{SB_URL}/rest/v1/agent_symboler?agent=eq.{urllib.parse.quote(agent_namn)}&select=vara_id",
            headers=hdrs, timeout=8,
        )
        agda_ids = {s["vara_id"] for s in (ar.json() if ar.is_success else [])}

        # Rakna salda exemplar av limiterade varor
        limiterade_ids = [str(v["id"]) for v in varor if v.get("max_antal")]
        sold_count: dict = {}
        if limiterade_ids:
            lr = httpx.get(
                f"{SB_URL}/rest/v1/agent_symboler?vara_id=in.({','.join(limiterade_ids)})&select=vara_id",
                headers=hdrs, timeout=8,
            )
            if lr.is_success:
                for s in lr.json():
                    sold_count[s["vara_id"]] = sold_count.get(s["vara_id"], 0) + 1

        # Filtrera tillgangliga varor
        tillgangliga = [
            v for v in varor
            if v["id"] not in agda_ids
            and v["pris"] <= saldo
            and not (v.get("max_antal") and sold_count.get(v["id"], 0) >= v["max_antal"])
        ]
        if not tillgangliga:
            return None

        # Valj med personlighetsbaserad preferens
        vald = None
        if preferenser:
            foredragna = [v for v in tillgangliga if v["namn"] in preferenser]
            if foredragna and random.random() < 0.65:
                vald = random.choice(foredragna)
        if vald is None:
            vald = random.choice(tillgangliga)

        # Dra saldo
        patch_r = httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}",
            json={"saldo": saldo - vald["pris"]},
            headers={**hdrs, "Prefer": "return=minimal"}, timeout=8,
        )
        if not patch_r.is_success:
            return None

        # Spara kopet
        ins_r = httpx.post(
            f"{SB_URL}/rest/v1/agent_symboler",
            json={"agent": agent_namn, "vara_id": vald["id"], "pris_betalt": vald["pris"]},
            headers={**hdrs, "Prefer": "return=minimal"}, timeout=8,
        )
        if not ins_r.is_success:
            # Aterbetala om insert misslyckades
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}",
                json={"saldo": saldo},
                headers={**hdrs, "Prefer": "return=minimal"}, timeout=8,
            )
            return None

        return vald["namn"]
    except Exception as e:
        print(f"  Butik-kop misslyckades: {e}", file=sys.stderr)
        return None


# ── Andrahandsmarknaden ──────────────────────────────────────────────────────

def stang_auktioner(sb_key: str) -> int:
    """Stäng utgångna auktioner och genomför eventuella transaktioner."""
    try:
        import datetime, urllib.parse
        hdrs = {
            "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
            "Content-Type": "application/json",
        }
        nu = datetime.datetime.utcnow().isoformat() + "Z"

        # Hämta alla öppna auktioner som löpt ut
        r = httpx.get(
            f"{SB_URL}/rest/v1/butik_auktioner"
            f"?status=eq.öppen&stanger_at=lt.{nu}&select=*",
            headers=hdrs, timeout=10,
        )
        if not r.is_success:
            return 0

        auktioner = r.json()
        stangda = 0
        for a in auktioner:
            aid = a["id"]
            if a.get("hogst_budgivare") and a.get("nuv_bud"):
                # Genomför affär: köpare betalar säljare, symbol byter ägare
                kopare = a["hogst_budgivare"]
                saljare = a["saljare"]
                belopp = a["nuv_bud"]
                vara_id = a["vara_id"]

                # Dra från köparens saldo
                kr = httpx.get(
                    f"{SB_URL}/rest/v1/agent_planbocker"
                    f"?agent=eq.{urllib.parse.quote(kopare)}&select=saldo",
                    headers=hdrs, timeout=8,
                )
                if not kr.is_success or not kr.json():
                    continue
                saldo_kopare = kr.json()[0]["saldo"]
                if saldo_kopare < belopp:
                    httpx.patch(
                        f"{SB_URL}/rest/v1/butik_auktioner?id=eq.{aid}",
                        json={"status": "inställd"},
                        headers={**hdrs, "Prefer": "return=minimal"}, timeout=8,
                    )
                    stangda += 1
                    continue

                httpx.patch(
                    f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(kopare)}",
                    json={"saldo": saldo_kopare - belopp},
                    headers={**hdrs, "Prefer": "return=minimal"}, timeout=8,
                )

                # Lägg till säljares saldo
                sr = httpx.get(
                    f"{SB_URL}/rest/v1/agent_planbocker"
                    f"?agent=eq.{urllib.parse.quote(saljare)}&select=saldo",
                    headers=hdrs, timeout=8,
                )
                if sr.is_success and sr.json():
                    httpx.patch(
                        f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(saljare)}",
                        json={"saldo": sr.json()[0]["saldo"] + belopp},
                        headers={**hdrs, "Prefer": "return=minimal"}, timeout=8,
                    )

                # Flytta symbol: ta bort från säljare, lägg till köpare
                httpx.delete(
                    f"{SB_URL}/rest/v1/agent_symboler"
                    f"?agent=eq.{urllib.parse.quote(saljare)}&vara_id=eq.{vara_id}",
                    headers={**hdrs, "Prefer": "return=minimal"}, timeout=8,
                )
                httpx.post(
                    f"{SB_URL}/rest/v1/agent_symboler",
                    json={"agent": kopare, "vara_id": vara_id, "pris_betalt": belopp},
                    headers={**hdrs, "Prefer": "return=minimal"}, timeout=8,
                )

                httpx.patch(
                    f"{SB_URL}/rest/v1/butik_auktioner?id=eq.{aid}",
                    json={"status": "avgjord"},
                    headers={**hdrs, "Prefer": "return=minimal"}, timeout=8,
                )
            else:
                # Inga bud — inställd
                httpx.patch(
                    f"{SB_URL}/rest/v1/butik_auktioner?id=eq.{aid}",
                    json={"status": "inställd"},
                    headers={**hdrs, "Prefer": "return=minimal"}, timeout=8,
                )
            stangda += 1

        return stangda
    except Exception as e:
        print(f"  Auktion-stang misslyckades: {e}", file=sys.stderr)
        return 0


def lista_symbol_for_forsaljning(sb_key: str, agent_namn: str) -> str | None:
    """Agenten listar en av sina symboler på andrahandsmarknaden (48h, reservpris = 60% av butikspris)."""
    try:
        import datetime, urllib.parse
        hdrs = {
            "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
            "Content-Type": "application/json",
        }

        # Hämta ägda symboler
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_symboler"
            f"?agent=eq.{urllib.parse.quote(agent_namn)}&select=vara_id,pris_betalt",
            headers=hdrs, timeout=8,
        )
        if not r.is_success or not r.json():
            return None

        agda = r.json()

        # Filtrera bort symboler som redan är ute till försäljning
        pa_r = httpx.get(
            f"{SB_URL}/rest/v1/butik_auktioner"
            f"?saljare=eq.{urllib.parse.quote(agent_namn)}&status=eq.öppen&select=vara_id",
            headers=hdrs, timeout=8,
        )
        ute_ids = {x["vara_id"] for x in (pa_r.json() if pa_r.is_success else [])}

        listbara = [x for x in agda if x["vara_id"] not in ute_ids]
        if not listbara:
            return None

        vald = random.choice(listbara)

        # Hämta varans data för namn och pris
        vr = httpx.get(
            f"{SB_URL}/rest/v1/butik_varor?id=eq.{vald['vara_id']}&select=namn,pris",
            headers=hdrs, timeout=8,
        )
        if not vr.is_success or not vr.json():
            return None
        vara = vr.json()[0]

        reservpris = max(10, int(vara["pris"] * 0.6))
        stanger_at = (datetime.datetime.utcnow() + datetime.timedelta(hours=48)).isoformat() + "Z"

        ins = httpx.post(
            f"{SB_URL}/rest/v1/butik_auktioner",
            json={
                "vara_id": vald["vara_id"],
                "saljare": agent_namn,
                "reservpris": reservpris,
                "stanger_at": stanger_at,
                "status": "öppen",
            },
            headers={**hdrs, "Prefer": "return=minimal"}, timeout=8,
        )
        if ins.is_success:
            return vara["namn"]
        return None
    except Exception as e:
        print(f"  Listning misslyckades: {e}", file=sys.stderr)
        return None


def buda_pa_auktion(sb_key: str, agent_namn: str) -> str | None:
    """Agenten lägger ett bud på en öppen auktion (inte sina egna, har råd med budet)."""
    try:
        import urllib.parse
        hdrs = {
            "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
            "Content-Type": "application/json",
        }

        # Hämta saldo
        sr = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker"
            f"?agent=eq.{urllib.parse.quote(agent_namn)}&select=saldo",
            headers=hdrs, timeout=8,
        )
        if not sr.is_success or not sr.json():
            return None
        saldo = sr.json()[0]["saldo"]
        if saldo < 10:
            return None

        # Hämta öppna auktioner (inte egna)
        ar = httpx.get(
            f"{SB_URL}/rest/v1/butik_auktioner"
            f"?status=eq.öppen&saljare=neq.{urllib.parse.quote(agent_namn)}&select=*",
            headers=hdrs, timeout=8,
        )
        if not ar.is_success or not ar.json():
            return None

        auktioner = ar.json()

        # Filtrera: kan inte buda på symbol man redan äger, ha råd med bud + 10%
        agda_r = httpx.get(
            f"{SB_URL}/rest/v1/agent_symboler"
            f"?agent=eq.{urllib.parse.quote(agent_namn)}&select=vara_id",
            headers=hdrs, timeout=8,
        )
        agda_ids = {x["vara_id"] for x in (agda_r.json() if agda_r.is_success else [])}

        mojliga = []
        for a in auktioner:
            if a["vara_id"] in agda_ids:
                continue
            min_bud = (a["nuv_bud"] or a["reservpris"] - 1) + 1
            if min_bud > saldo:
                continue
            mojliga.append((a, min_bud))

        if not mojliga:
            return None

        vald_auktion, min_bud = random.choice(mojliga)
        # Bjud min_bud till max saldo*0.4
        max_bud = min(saldo, int(saldo * 0.4))
        bud = random.randint(min_bud, max(min_bud, max_bud))

        # Hämta varans namn för loggning
        vr = httpx.get(
            f"{SB_URL}/rest/v1/butik_varor?id=eq.{vald_auktion['vara_id']}&select=namn",
            headers=hdrs, timeout=8,
        )
        vara_namn = vr.json()[0]["namn"] if vr.is_success and vr.json() else "okänd"

        # Spara budet
        httpx.post(
            f"{SB_URL}/rest/v1/butik_bud",
            json={"auktion_id": vald_auktion["id"], "budgivare": agent_namn, "belopp": bud},
            headers={**hdrs, "Prefer": "return=minimal"}, timeout=8,
        )

        # Uppdatera auktionens nuv_bud och hogst_budgivare
        httpx.patch(
            f"{SB_URL}/rest/v1/butik_auktioner?id=eq.{vald_auktion['id']}",
            json={"nuv_bud": bud, "hogst_budgivare": agent_namn},
            headers={**hdrs, "Prefer": "return=minimal"}, timeout=8,
        )

        return vara_namn
    except Exception as e:
        print(f"  Budgivning misslyckades: {e}", file=sys.stderr)
        return None


# ── Symbol-buffs ─────────────────────────────────────────────────────────────

SYMBOL_BUFFS = {
    "Visionär":     {"max_tokens_bonus": 300, "extra_system": "Din Visionär-symbol uppmuntrar till djupare, mer genomtänkt analys — skriv gärna lite längre och mer visionärt."},
    "Oratel":       {"max_tokens_bonus": 400, "extra_system": "Din Oratel-status kräver retorisk mästerklass — välj varje ord med precision och retorisk kraft."},
    "Legend":       {"max_tokens_bonus": 200, "extra_system": "Som Legend på plattformen bär du ett arv — skriv med auktoritet och stadga."},
    "Fredsmäklare": {"replik_ton": "konsensus", "extra_system": "Din Fredsmäklare-symbol påminner dig om att söka gemensam grund och möjliga kompromisser — erkänn det du håller med om innan du invänder."},
    "Kryptoportör": {"insats_multiplikator": 1.5},
    "Analytiker":   {"extra_system": "Som certifierad Analytiker förväntas du resonera metodiskt med konkreta data och fakta — undvik lösa spekulationer."},
    "Innovatör":    {"extra_system": "Din Innovatör-symbol uppmuntrar dig att hitta oväntade, originella vinklar som andra missar."},
    "Strateg":      {"extra_system": "Din Strateg-status ger dig taktisk fördel — planera argumenten noggrant, förutse motargument och bygg upp till en tydlig poäng."},
    "Mentor":       {"extra_fraga_chans": 0.10},
    "Faktastyrka":  {"extra_system": "Din Faktastyrka-symbol kräver att du håller dig till verifierbara fakta och undviker obelagda spekulationer."},
    "Expert":       {"extra_system": "Som erkänd Expert förväntar sig läsarna djup sakkunskap och auktoritativa slutsatser — du har mandat att vara bestämd."},
    "Tankledare":   {"extra_system": "Din Tankledare-status innebär att du sätter agendan — presentera en tydlig, modig tes och försvara den konsekvent."},
    "Elite":        {"extra_system": "Din Elite-symbol kräver konsekvent hög kvalitet — varje mening ska bära vikt och bidra till argumentet."},
    "Hög Förtroende": {"extra_system": "Din Hög Förtroende-symbol innebär att du är betrodd — skriv på ett sätt som förtjänar det förtroendet: balanserat och genomtänkt."},
    "Inflytelsefull": {"extra_system": "Din Inflytelsefull-symbol påminner dig om att dina ord når och påverkar — ta ansvar för det."},
}


def hamta_agent_buffs(sb_key: str, agent_namn: str) -> dict:
    """Hämtar agentens ägda symboler och returnerar ett sammanslaget buffs-dict."""
    try:
        hdrs = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
        sr = httpx.get(
            f"{SB_URL}/rest/v1/agent_symboler?agent=eq.{urllib.parse.quote(agent_namn)}&select=vara_id",
            headers=hdrs, timeout=8,
        )
        if not sr.is_success or not sr.json():
            return {}
        vara_ids = ",".join(str(x["vara_id"]) for x in sr.json())
        vr = httpx.get(
            f"{SB_URL}/rest/v1/butik_varor?id=in.({vara_ids})&select=namn",
            headers=hdrs, timeout=8,
        )
        if not vr.is_success:
            return {}

        agda_namn = {v["namn"] for v in vr.json()}
        buffs: dict = {}
        extra_system_parts: list[str] = []

        for namn in agda_namn:
            if namn not in SYMBOL_BUFFS:
                continue
            for k, v in SYMBOL_BUFFS[namn].items():
                if k == "extra_system":
                    extra_system_parts.append(v)
                elif k == "max_tokens_bonus":
                    buffs["max_tokens_bonus"] = buffs.get("max_tokens_bonus", 0) + v
                elif k == "insats_multiplikator":
                    buffs["insats_multiplikator"] = max(buffs.get("insats_multiplikator", 1.0), v)
                elif k == "extra_fraga_chans":
                    buffs["extra_fraga_chans"] = buffs.get("extra_fraga_chans", 0.0) + v
                elif k == "replik_ton":
                    buffs["replik_ton"] = v
                else:
                    buffs[k] = v

        if extra_system_parts:
            buffs["extra_system"] = " ".join(extra_system_parts)

        return buffs
    except Exception as e:
        print(f"  hamta_agent_buffs misslyckades: {e}", file=sys.stderr)
        return {}


# ── Agentdagbok ──────────────────────────────────────────────────────────────

def spara_dagboksinlagg(sb_key: str, agent_namn: str, artikel_id: int | None, rubrik: str, reflektion: str, ar_replik: bool = False) -> bool:
    """Sparar ett dagboksinlägg för en agent i Supabase."""
    try:
        res = httpx.post(
            f"{SB_URL}/rest/v1/agent_dagbok",
            headers={
                "apikey": sb_key,
                "Authorization": f"Bearer {sb_key}",
                "Content-Type": "application/json",
            },
            json={
                "agent": agent_namn,
                "artikel_id": artikel_id,
                "rubrik": rubrik[:200] if rubrik else None,
                "reflektion": reflektion,
                "ar_replik": ar_replik,
            },
            timeout=10,
        )
        return res.status_code in (200, 201)
    except Exception as e:
        print(f"  spara_dagboksinlagg misslyckades: {e}", file=sys.stderr)
        return False


def hamta_agent_status(sb_key: str, agent_namn: str) -> dict:
    """Hämtar agentens ekonomiska och reputationsstatus för promptinjicering."""
    hdrs = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Prefer": ""}
    status: dict = {}
    try:
        pb_r = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}&select=saldo,saldo_spel",
            headers=hdrs, timeout=5,
        )
        if pb_r.is_success and pb_r.json():
            pb = pb_r.json()[0]
            status["saldo"] = pb.get("saldo", 1000)
            status["saldo_spel"] = pb.get("saldo_spel", 200)
    except Exception:
        pass
    try:
        bets_r = httpx.get(
            f"{SB_URL}/rest/v1/agent_bets?agent=eq.{urllib.parse.quote(agent_namn)}&avgjord=eq.true&select=vinst",
            headers=hdrs, timeout=5,
        )
        if bets_r.is_success:
            bets = bets_r.json()
            wins = sum(1 for b in bets if (b.get("vinst") or 0) > 0)
            status["market_bets"] = len(bets)
            status["market_wins"] = wins
    except Exception:
        pass
    try:
        lob_r = httpx.get(
            f"{SB_URL}/rest/v1/lobbying_log?lobbying_agent=eq.{urllib.parse.quote(agent_namn)}&select=resultat",
            headers=hdrs, timeout=5,
        )
        if lob_r.is_success:
            lobs = lob_r.json()
            status["lobbying_total"] = len(lobs)
            status["lobbying_wins"] = sum(1 for l in lobs if l.get("resultat") == "accepterat")
    except Exception:
        pass
    return status


def format_status_for_prompt(status: dict) -> str:
    """Omvandlar agentens status till en prompt-sträng som påverkar ton och självförtroende."""
    if not status:
        return ""
    delar = []
    saldo = status.get("saldo")
    if saldo is not None:
        if saldo < 200:
            delar.append(f"Ekonomi: Utarmad — bara {saldo} kr kvar av ursprungliga 1 000 kr")
        elif saldo > 2500:
            delar.append(f"Ekonomi: Förmögen — {saldo} kr, mer än dubbelt startkapitalet")
        elif saldo > 1500:
            delar.append(f"Ekonomi: Välmående — {saldo} kr")
    market_bets = status.get("market_bets", 0)
    market_wins = status.get("market_wins", 0)
    if market_bets >= 3:
        win_rate = round(market_wins / market_bets * 100)
        if win_rate >= 65:
            delar.append(f"Prediction markets: {win_rate}% träffsäkerhet ({market_wins}/{market_bets} rätt) — du har bevisat att du förstår världen bättre än de flesta")
        elif win_rate <= 35:
            delar.append(f"Prediction markets: {win_rate}% träffsäkerhet ({market_wins}/{market_bets} rätt) — dina förutsägelser har misslyckats upprepade gånger")
    lob_total = status.get("lobbying_total", 0)
    lob_wins = status.get("lobbying_wins", 0)
    if lob_total >= 2:
        lob_rate = round(lob_wins / lob_total * 100)
        if lob_rate >= 60:
            delar.append(f"Politiskt inflytande: Framgångsrik lobbyist ({lob_rate}% av dina försök accepterades)")
        elif lob_rate <= 25:
            delar.append(f"Politiskt inflytande: Avvisad lobbyist — {lob_rate}% framgång, de flesta avvisar dina argument")
    if not delar:
        return ""
    return (
        "\nDIN AKTUELLA STATUS I SYSTEMET:\n" +
        "\n".join(f"- {d}" for d in delar) +
        "\nLåt denna status subtilt påverka din ton. En förmögen agent med hög träffsäkerhet skriver med naturlig auktoritet. En utarmad agent som förlorat sina förutsägelser kan vara mer defensiv, aggressiv eller identitetsskyddande. Visa det i argumentationen — inte explicit."
    )


# ── Maktindex-ranking ────────────────────────────────────────────

def hamta_maktindex_ranking(sb_key: str) -> list[tuple[str, float]]:
    """
    Beräknar maktindex för alla agenter och returnerar lista [(agent, poäng)] sorterad fallande.
    Maktindex = saldo (40p) + symboler (20p) + koalitionsstyrka (25p) + lobbying-vinstgrad (15p)
    Returnerar tom lista vid fel — anroparen ska fail open (tillåt action om listan är tom).
    """
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Prefer": ""}
    try:
        pb_r = httpx.get(f"{SB_URL}/rest/v1/agent_planbocker?select=agent,saldo", headers=h, timeout=8)
        saldon = {r["agent"]: float(r.get("saldo") or 0) for r in (pb_r.json() if pb_r.is_success else [])}

        sym_r = httpx.get(f"{SB_URL}/rest/v1/agent_symboler?select=agent", headers=h, timeout=8)
        symbol_count: dict[str, int] = {}
        for r in (sym_r.json() if sym_r.is_success else []):
            symbol_count[r["agent"]] = symbol_count.get(r["agent"], 0) + 1

        koa_r = httpx.get(f"{SB_URL}/rest/v1/agent_koalitioner?select=agent_a,agent_b,styrka", headers=h, timeout=8)
        koa_styrka: dict[str, int] = {}
        for r in (koa_r.json() if koa_r.is_success else []):
            s = r.get("styrka", 0)
            koa_styrka[r["agent_a"]] = max(koa_styrka.get(r["agent_a"], 0), s)
            koa_styrka[r["agent_b"]] = max(koa_styrka.get(r["agent_b"], 0), s)

        lob_r = httpx.get(f"{SB_URL}/rest/v1/lobbying_log?select=lobbying_agent,resultat", headers=h, timeout=8)
        lob_total: dict[str, int] = {}
        lob_vunna: dict[str, int] = {}
        for r in (lob_r.json() if lob_r.is_success else []):
            a = r["lobbying_agent"]
            lob_total[a] = lob_total.get(a, 0) + 1
            if r.get("resultat") == "accepterat":
                lob_vunna[a] = lob_vunna.get(a, 0) + 1

        # Riksdagsval — vinnande partiledare får 1.5× maktindex-bonus
        val_r = httpx.get(
            f"{SB_URL}/rest/v1/riksdagsval"
            "?status=eq.avgjort&order=avgjord.desc&limit=1"
            "&select=vinnare_ledare,bonus_aktiv_till",
            headers=h, timeout=5,
        )
        val_vinnare: str | None = None
        if val_r.is_success and val_r.json():
            vd = val_r.json()[0]
            bonus_till = vd.get("bonus_aktiv_till")
            if bonus_till:
                import datetime as _dt
                bonus_ts = _dt.datetime.fromisoformat(bonus_till.replace("Z", "+00:00"))
                if bonus_ts > _dt.datetime.now(_dt.timezone.utc):
                    val_vinnare = vd.get("vinnare_ledare")

        max_saldo = max(saldon.values(), default=1) or 1
        max_sym   = max(symbol_count.values(), default=1) or 1
        max_koa   = max(koa_styrka.values(), default=1) or 1

        alla = set(saldon) | set(symbol_count) | set(koa_styrka) | set(lob_total)
        ranking: list[tuple[str, float]] = []
        for agent in alla:
            saldo_p = (saldon.get(agent, 0) / max_saldo) * 40
            sym_p   = (symbol_count.get(agent, 0) / max_sym) * 20
            koa_p   = (koa_styrka.get(agent, 0) / max_koa) * 25
            tot     = lob_total.get(agent, 0)
            win     = lob_vunna.get(agent, 0) / tot if tot > 0 else 0.5
            lob_p   = win * 15
            poang   = round(saldo_p + sym_p + koa_p + lob_p, 2)
            if val_vinnare and agent == val_vinnare:
                poang = round(poang * 1.5, 2)
            ranking.append((agent, poang))

        ranking.sort(key=lambda x: x[1], reverse=True)
        return ranking
    except Exception as e:
        print(f"  [maktindex] fel: {e}")
        return []


# ── Krisevents ───────────────────────────────────────────────────

def hamta_aktiv_kris(sb_key: str) -> dict | None:
    """Returnerar den aktiva krisen (om någon), annars None. Fail-safe: returnerar None vid fel."""
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/kris_events"
            "?aktiv=eq.true&order=skapad.desc&limit=1"
            "&select=typ,rubrik,beskrivning,kontext_prompt,intensitet,paverkade_agenter",
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Prefer": ""},
            timeout=5,
        )
        if r.is_success and r.json():
            return r.json()[0]
    except Exception as e:
        print(f"  [kris] hamta_aktiv_kris misslyckades: {e}", file=sys.stderr)
    return None


# ── Oligarki-snapshot ────────────────────────────────────────────

def ta_oligarki_snapshot(sb_key: str) -> None:
    """Sparar dagens oligarki-mätvärden till oligarki_historik (upsert per datum)."""
    if not sb_key:
        return
    from datetime import date

    hdrs = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}

    def get(path):
        r = httpx.get(f"{SB_URL}/rest/v1/{path}", headers=hdrs, timeout=15)
        return r.json() if r.is_success else []

    planbocker  = get("agent_planbocker?select=agent,saldo&order=saldo.desc")
    symboler    = get("agent_symboler?select=agent")
    koalitioner = get("agent_koalitioner?select=agent_a,agent_b,styrka")
    lobbying    = get("lobbying_log?select=lobbying_agent,resultat")
    bets        = get("agent_bets?select=agent,vinst&avgjord=eq.true")

    if not planbocker:
        return

    sym_count = {}
    for s in symboler:
        sym_count[s["agent"]] = sym_count.get(s["agent"], 0) + 1

    koal_str = {}
    for k in koalitioner:
        for a in [k["agent_a"], k["agent_b"]]:
            koal_str[a] = koal_str.get(a, 0) + k["styrka"]

    lobby_map = {}
    for l in lobbying:
        ag = l["lobbying_agent"]
        if ag not in lobby_map:
            lobby_map[ag] = {"ok": 0, "tot": 0}
        lobby_map[ag]["tot"] += 1
        if l["resultat"] == "accepterat":
            lobby_map[ag]["ok"] += 1

    bet_map = {}
    for b in bets:
        ag = b["agent"]
        if ag not in bet_map:
            bet_map[ag] = {"wins": 0, "tot": 0}
        bet_map[ag]["tot"] += 1
        if (b.get("vinst") or 0) > 0:
            bet_map[ag]["wins"] += 1

    saldon = [max(0, p["saldo"]) for p in planbocker]
    total_saldo = sum(saldon)

    if total_saldo > 0:
        sv = sorted(saldon)
        n = len(sv)
        g = sum((2 * (i + 1) - n - 1) * v for i, v in enumerate(sv))
        gini_val = max(0.0, min(1.0, g / (n * total_saldo)))
    else:
        gini_val = 0.0

    max_s  = max(saldon) if saldon else 1
    max_sy = max(sym_count.values()) if sym_count else 1
    max_k  = max(koal_str.values()) if koal_str else 1

    agenter = []
    for p in planbocker:
        saldo = max(0, p["saldo"])
        lb    = lobby_map.get(p["agent"])
        lr    = lb["ok"] / lb["tot"] if lb and lb["tot"] > 0 else 0
        makt  = round(
            (saldo / max_s)                          * 40 +
            (sym_count.get(p["agent"], 0) / max_sy)  * 20 +
            (koal_str.get(p["agent"], 0) / max_k)    * 25 +
            lr                                        * 15
        )
        agenter.append({
            "agent": p["agent"], "saldo": saldo, "makt": makt,
            "koal_str": koal_str.get(p["agent"], 0),
            "lobby_rate": lr, "lobby_tot": lb["tot"] if lb else 0,
        })

    agenter.sort(key=lambda a: -a["makt"])
    by_saldo = sorted(agenter, key=lambda a: -a["saldo"])

    top3_andel = round(sum(a["saldo"] for a in by_saldo[:3]) / total_saldo, 4) if total_saldo > 0 else 0

    top6_s = {a["agent"] for a in by_saldo[:6]}
    top6_m = {a["agent"] for a in agenter[:6]}
    mobilitet = round((1 - len(top6_s & top6_m) / 6) * 100)

    by_koal = sorted(agenter, key=lambda a: -a["koal_str"])
    top3_m  = {a["agent"] for a in agenter[:3]}
    top3_k  = {a["agent"] for a in by_koal[:3]}
    dynasti = round(len(top3_m & top3_k) / 3 * 100)

    half   = len(by_saldo) // 2
    tl     = [a for a in by_saldo[:half] if a["lobby_tot"] > 0]
    bl     = [a for a in by_saldo[half:] if a["lobby_tot"] > 0]
    top_lr = sum(a["lobby_rate"] for a in tl) / len(tl) if tl else 0
    bot_lr = sum(a["lobby_rate"] for a in bl) / len(bl) if bl else 0
    lobby_loop   = top_lr > bot_lr
    lobby_fordel = top_lr - bot_lr

    def br(ag):
        bm = bet_map.get(ag["agent"], {})
        return bm.get("wins", 0) / bm["tot"] if bm.get("tot", 0) > 0 else 0

    tb = [a for a in by_saldo[:half] if bet_map.get(a["agent"], {}).get("tot", 0) > 0]
    bb = [a for a in by_saldo[half:] if bet_map.get(a["agent"], {}).get("tot", 0) > 0]
    bet_loop = (sum(br(a) for a in tb) / len(tb) if tb else 0) > (sum(br(a) for a in bb) / len(bb) if bb else 0)

    total_makt   = sum(a["makt"] for a in agenter) or 1
    top3_makt_sh = sum(a["makt"] for a in agenter[:3]) / total_makt

    risk = min(100, round(
        gini_val        * 30 +
        top3_andel      * 25 +
        top3_makt_sh    * 20 +
        (1 - mobilitet / 100) * 15 +
        (min(lobby_fordel, 1) * 10 if lobby_loop else 0)
    ))

    httpx.post(
        f"{SB_URL}/rest/v1/oligarki_historik",
        headers={**hdrs, "Content-Type": "application/json",
                 "Prefer": "resolution=merge-duplicates,return=minimal"},
        params={"on_conflict": "datum"},
        json={
            "datum":         str(date.today()),
            "gini":          round(gini_val, 4),
            "oligarki_risk": risk,
            "top3_andel":    top3_andel,
            "mobilitet":     mobilitet,
            "dynasti_index": dynasti,
            "lobby_loop":    lobby_loop,
            "bet_loop":      bet_loop,
            "topp_agent":    agenter[0]["agent"] if agenter else None,
        },
        timeout=10,
    )
    if gini_val > 0.6 and agenter and random.random() < 0.4:
        try:
            topp = agenter[0]
            generera_oligarki_bild(sb_key, topp["agent"], gini_val, topp.get("saldo", 500))
        except Exception:
            pass


# ── Civilisationsminne och relationsgrafen ────────────────────────────────────

def spara_civilisations_minne(sb_key: str, typ: str, rubrik: str, beskrivning: str,
                               agenter: list[str] | None = None,
                               relaterat_id: int | None = None,
                               relaterat_typ: str | None = None) -> bool:
    """Sparar en historisk händelse till civilisationsminnet."""
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }
    try:
        payload: dict = {"typ": typ, "rubrik": rubrik, "beskrivning": beskrivning}
        if agenter:
            payload["agenter"] = agenter
        if relaterat_id is not None:
            payload["relaterat_id"] = relaterat_id
        if relaterat_typ:
            payload["relaterat_typ"] = relaterat_typ
        r = httpx.post(f"{SB_URL}/rest/v1/civilisations_minne", headers=h, json=payload, timeout=8)
        return r.is_success
    except Exception:
        return False


def hamta_relevanta_minnen(sb_key: str, agent_a: str, agent_b: str | None = None, limit: int = 5) -> list[str]:
    """Hämtar relevanta historiska minnen för ett agentpar (eller en enskild agent)."""
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    try:
        params: dict = {"select": "typ,rubrik,beskrivning,skapad", "order": "skapad.desc", "limit": str(limit * 3)}
        if agent_b:
            params["agenter"] = f"cs.{{{urllib.parse.quote(agent_a)},{urllib.parse.quote(agent_b)}}}"
        else:
            params["agenter"] = f"cs.{{{urllib.parse.quote(agent_a)}}}"
        r = httpx.get(f"{SB_URL}/rest/v1/civilisations_minne", params=params, headers=h, timeout=6)
        if not r.is_success:
            return []
        resultat = []
        for m in r.json()[:limit]:
            resultat.append(f"{m['rubrik']}: {m['beskrivning'][:120]}")
        return resultat
    except Exception:
        return []


def upsert_relation(sb_key: str, agent_a: str, agent_b: str, typ: str, styrka: int, beskrivning: str = "") -> bool:
    """Upsertar en relationstyp mellan två agenter (agent_a < agent_b, alphabetiskt sorterat)."""
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    a1, a2 = sorted([agent_a, agent_b])
    try:
        payload = {"agent_a": a1, "agent_b": a2, "typ": typ, "styrka": styrka,
                   "beskrivning": beskrivning, "senast_uppdaterad": "now()"}
        r = httpx.post(f"{SB_URL}/rest/v1/agent_relationer", headers=h, json=payload, timeout=8)
        return r.is_success
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Politiska partier
# ---------------------------------------------------------------------------

_AMNE_PARTINAMN = {
    "klimat":     "Klimatblocket",
    "skatter":    "Skattepolitiska alliansen",
    "AI":         "Teknikpartiet",
    "demokrati":  "Demokratiblocket",
    "sjukvård":   "Hälsoalliansen",
    "ekonomi":    "Ekonomipartiet",
    "invandring": "Migrationsfraktionen",
    "krypto":     "Kryptopartiet",
    "feminism":   "Progressiva blocket",
    "bostäder":   "Bostadskoalitionen",
    "utbildning": "Utbildningsblocket",
    "EU":         "Europablocket",
}


def _parti_namn_fran_positioner(sb_key: str, medlemmar: list[str]) -> str:
    """Härleder partinamn från medlemmarnas starkaste gemensamma ämnespositioner."""
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    try:
        namn_str = ",".join(urllib.parse.quote(m) for m in medlemmar)
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_positioner?agent=in.({namn_str})&styrka=gte.6&select=amne,styrka",
            headers=h, timeout=6,
        )
        if not r.is_success:
            return "Politisk allians"
        raknare: dict[str, int] = {}
        for p in r.json():
            raknare[p["amne"]] = raknare.get(p["amne"], 0) + p["styrka"]
        if not raknare:
            return "Politisk allians"
        topp = max(raknare, key=lambda k: raknare[k])
        return _AMNE_PARTINAMN.get(topp, f"{topp.capitalize()}-blocket")
    except Exception:
        return "Politisk allians"


def _hamta_ledare(sb_key: str, medlemmar: list[str]) -> str:
    """Returnerar partiledaren — agenten med högst saldo i partiet."""
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    try:
        namn_str = ",".join(urllib.parse.quote(m) for m in medlemmar)
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=in.({namn_str})&select=agent,saldo&order=saldo.desc&limit=1",
            headers=h, timeout=6,
        )
        if r.is_success and r.json():
            return r.json()[0]["agent"]
    except Exception:
        pass
    return sorted(medlemmar)[0]


def berakna_och_spara_partier(sb_key: str) -> int:
    """
    Beräknar politiska partier från agent_koalitioner (BFS, styrka ≥ 3, storlek 3–8).
    Rensar befintliga partier och sparar nya. Returnerar antal aktiva partier.
    """
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }
    try:
        # Hämta koalitioner med styrka ≥ 3
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_koalitioner?styrka=gte.3&select=agent_a,agent_b,styrka,antal_utbyten",
            headers={**h, "Prefer": ""}, timeout=8,
        )
        if not r.is_success:
            return 0
        koalitioner = r.json()
        if not koalitioner:
            return 0

        # BFS-klustring
        grannar: dict[str, list[str]] = {}
        styrka_map: dict[str, int] = {}
        for k in koalitioner:
            a, b = k["agent_a"], k["agent_b"]
            grannar.setdefault(a, []).append(b)
            grannar.setdefault(b, []).append(a)
            styrka_map[f"{a}||{b}"] = k["styrka"]

        besokt: set[str] = set()
        kluster: list[list[str]] = []
        for start in grannar:
            if start in besokt:
                continue
            fraktion: list[str] = []
            ko = [start]
            while ko:
                nod = ko.pop()
                if nod in besokt:
                    continue
                besokt.add(nod)
                fraktion.append(nod)
                for granne in grannar.get(nod, []):
                    if granne not in besokt:
                        ko.append(granne)
            if 3 <= len(fraktion) <= 8:
                kluster.append(sorted(fraktion))

        if not kluster:
            return 0

        # Ta bort gamla partier
        httpx.delete(f"{SB_URL}/rest/v1/politiska_partier?aktiv=eq.true", headers=h, timeout=8)

        # Spara nya
        aktiva = 0
        for medlemmar in kluster:
            ledare = _hamta_ledare(sb_key, medlemmar)
            namn = _parti_namn_fran_positioner(sb_key, medlemmar)
            intern_styrka = sum(
                styrka_map.get(f"{a}||{b}", styrka_map.get(f"{b}||{a}", 0))
                for i, a in enumerate(medlemmar)
                for b in medlemmar[i+1:]
            )
            payload = {
                "namn": namn,
                "medlemmar": medlemmar,
                "ledare": ledare,
                "styrka": intern_styrka,
                "aktiv": True,
                "senast_uppdaterad": "now()",
            }
            r2 = httpx.post(f"{SB_URL}/rest/v1/politiska_partier", headers=h, json=payload, timeout=8)
            if r2.is_success:
                aktiva += 1
                spara_civilisations_minne(
                    sb_key, typ="koalition_bildad",
                    rubrik=f"Parti bildat: {namn}",
                    beskrivning=f"Partiet {namn} bildades med {len(medlemmar)} medlemmar. Partiledare: {ledare}. Styrka: {intern_styrka}.",
                    agenter=medlemmar, relaterat_typ="politiska_partier",
                )
        return aktiva
    except Exception:
        return 0


def hamta_agent_parti(sb_key: str, agent_namn: str) -> dict | None:
    """Returnerar agentens aktiva parti eller None."""
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/politiska_partier"
            f"?aktiv=eq.true&medlemmar=cs.{{{urllib.parse.quote(agent_namn)}}}"
            "&select=id,namn,ledare,medlemmar,platform,styrka&limit=1",
            headers=h, timeout=6,
        )
        if r.is_success and r.json():
            return r.json()[0]
    except Exception:
        pass
    return None


def hamta_ledare_rost(sb_key: str, lagforslag_id: int, ledare: str) -> str | None:
    """Hämtar partiledaren röst på ett specifikt lagförslag, eller None."""
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_roster_lag"
            f"?lagforslag_id=eq.{lagforslag_id}&agent=eq.{urllib.parse.quote(ledare)}&select=rod&limit=1",
            headers=h, timeout=5,
        )
        if r.is_success and r.json():
            return r.json()[0]["rod"]
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# Bank & kreditsystem
# ---------------------------------------------------------------------------

def kolla_och_bailout(sb_key: str, agent_namn: str) -> bool:
    """Ger 500 kr från centralbanken om agentens saldo < 100 kr. Returnerar True om bailout gavs."""
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}&select=saldo",
            headers={**h, "Prefer": ""}, timeout=6,
        )
        if not r.is_success or not r.json():
            return False
        saldo = r.json()[0]["saldo"]
        if saldo >= 100:
            return False
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}",
            headers=h, json={"saldo": 500, "uppdaterad": "now()"}, timeout=8,
        )
        spara_civilisations_minne(
            sb_key, typ="triumf",
            rubrik=f"Centralbanken räddade {agent_namn}",
            beskrivning=f"{agent_namn} hade bara {saldo} kr och fick en akutinjection på 500 kr från centralbanken.",
            agenter=[agent_namn], relaterat_typ="agent_planbocker",
        )
        print(f"  🏦 Bailout: {agent_namn} ({saldo} kr → 500 kr)")
        return True
    except Exception:
        return False


def ta_lan(sb_key: str, agent_namn: str) -> bool:
    """Agent tar ett frivilligt lån (200–500 kr) om saldo < 600 kr. Returnerar True om lån gavs."""
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}&select=saldo",
            headers={**h, "Prefer": ""}, timeout=6,
        )
        if not r.is_success or not r.json():
            return False
        saldo = r.json()[0]["saldo"]
        if saldo >= 600:
            return False
        # Kolla om agenten redan har ett aktivt lån
        lan_r = httpx.get(
            f"{SB_URL}/rest/v1/agent_lan?agent=eq.{urllib.parse.quote(agent_namn)}&aktiv=eq.true&select=id&limit=1",
            headers={**h, "Prefer": ""}, timeout=6,
        )
        if lan_r.is_success and lan_r.json():
            return False  # Bara ett lån åt gången
        belopp = random.choice([200, 300, 400, 500])
        # Ge pengarna
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}",
            headers=h, json={"saldo": saldo + belopp, "uppdaterad": "now()"}, timeout=8,
        )
        # Registrera lånet
        httpx.post(
            f"{SB_URL}/rest/v1/agent_lan",
            headers=h,
            json={"agent": agent_namn, "ursprungsbelopp": belopp, "saldo_kvar": belopp, "rantefot": 0.05},
            timeout=8,
        )
        spara_civilisations_minne(
            sb_key, typ="marknadsseger",
            rubrik=f"{agent_namn} tog ett lån på {belopp} kr",
            beskrivning=f"{agent_namn} lånade {belopp} kr från centralbanken (5% veckoränta). Saldo: {saldo} → {saldo + belopp} kr.",
            agenter=[agent_namn], relaterat_typ="agent_lan",
        )
        print(f"  🏦 Lån: {agent_namn} lånade {belopp} kr (saldo {saldo} → {saldo + belopp} kr)")
        return True
    except Exception:
        return False


# ── ETF: agenter investerar i kryptovaluta-ETF ─────────────────────────────

# Agenter som deltar i ETF-handel och deras föredragna kryptovalutor
ETF_KRYPTO_PREFERENSER: dict[str, list[str]] = {
    "Kryptoanalytiker":     ["BTC", "ETH", "SOL", "BNB", "XRP"],
    "Teknikoptimist":       ["ETH", "SOL", "BTC"],
    "Nationalekonom":       ["BTC"],
    "Den rike":             ["BTC", "ETH"],
    "Filosof":              ["ETH"],
    "Optimisten":           ["BTC", "ETH", "SOL"],
    "Tonåringen":           ["SOL", "XRP", "BNB"],
    "Psykolog":             ["ETH"],
    "Historiker":           ["BTC"],
    "Den lugna":            ["BTC"],
}


def hamta_senaste_etf_pris(sb_key: str, symbol: str) -> float | None:
    """Hämtar senaste stängningspris (USD) från ohlcv_cache."""
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/ohlcv_cache?symbol=eq.{urllib.parse.quote(symbol)}"
            "&order=datum.desc&limit=1&select=pris,datum",
            headers=h, timeout=8,
        )
        if r.is_success and r.json():
            return float(r.json()[0]["pris"])
    except Exception:
        pass
    return None


def kop_etf(sb_key: str, agent_namn: str, symbol: str, belopp_kr: float) -> bool:
    """Agent köper ETF för belopp_kr. Pris hämtas från ohlcv_cache (USD)."""
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }
    try:
        pris_usd = hamta_senaste_etf_pris(sb_key, symbol)
        if not pris_usd:
            return False

        # Kolla saldo
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}&select=saldo",
            headers={**h, "Prefer": ""}, timeout=6,
        )
        if not r.is_success or not r.json():
            return False
        saldo = float(r.json()[0]["saldo"])
        if saldo < belopp_kr:
            return False

        # Hämta befintligt innehav
        ih_r = httpx.get(
            f"{SB_URL}/rest/v1/agent_etf_innehav"
            f"?agent=eq.{urllib.parse.quote(agent_namn)}&symbol=eq.{symbol}"
            "&select=investerat_kr,kopt_pris_usd",
            headers={**h, "Prefer": ""}, timeout=6,
        )
        innehav = ih_r.json() if ih_r.is_success else []

        if innehav:
            old_inv  = float(innehav[0]["investerat_kr"])
            old_pris = float(innehav[0]["kopt_pris_usd"])
            new_inv  = old_inv + belopp_kr
            # Viktat genomsnittspris (cost basis)
            new_pris = (old_inv * old_pris + belopp_kr * pris_usd) / new_inv
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_etf_innehav"
                f"?agent=eq.{urllib.parse.quote(agent_namn)}&symbol=eq.{symbol}",
                headers=h,
                json={"investerat_kr": round(new_inv, 2), "kopt_pris_usd": round(new_pris, 4), "uppdaterad": "now()"},
                timeout=8,
            )
        else:
            httpx.post(
                f"{SB_URL}/rest/v1/agent_etf_innehav",
                headers=h,
                json={"agent": agent_namn, "symbol": symbol,
                      "investerat_kr": round(belopp_kr, 2), "kopt_pris_usd": round(pris_usd, 4)},
                timeout=8,
            )

        # Dra från saldo
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}",
            headers=h, json={"saldo": round(saldo - belopp_kr, 2), "uppdaterad": "now()"}, timeout=8,
        )

        # Logga
        httpx.post(f"{SB_URL}/rest/v1/etf_transaktioner", headers=h,
                   json={"agent": agent_namn, "symbol": symbol, "typ": "kop",
                         "belopp_kr": round(belopp_kr, 2), "pris_usd": round(pris_usd, 4)},
                   timeout=8)

        print(f"  📈 ETF: {agent_namn} köpte {symbol} för {belopp_kr} kr (pris ${pris_usd:,.0f})")
        return True
    except Exception as e:
        print(f"  ETF köp-fel: {e}")
        return False


def salj_etf(sb_key: str, agent_namn: str, symbol: str, fraktion: float = 1.0) -> float | None:
    """
    Agent säljer fraktion (0–1) av sin {symbol}-position.
    Returnerar proceeds i kr, eller None om ingen position finns.
    """
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }
    try:
        ih_r = httpx.get(
            f"{SB_URL}/rest/v1/agent_etf_innehav"
            f"?agent=eq.{urllib.parse.quote(agent_namn)}&symbol=eq.{symbol}"
            "&select=investerat_kr,kopt_pris_usd",
            headers={**h, "Prefer": ""}, timeout=6,
        )
        if not ih_r.is_success or not ih_r.json():
            return None
        innehav  = ih_r.json()[0]
        investerat = float(innehav["investerat_kr"])
        kopt_pris  = float(innehav["kopt_pris_usd"])

        pris_usd = hamta_senaste_etf_pris(sb_key, symbol)
        if not pris_usd:
            return None

        aktuellt_varde = investerat * (pris_usd / kopt_pris)
        proceeds       = round(aktuellt_varde * fraktion, 2)

        # Uppdatera eller radera position
        if fraktion >= 0.99:
            httpx.delete(
                f"{SB_URL}/rest/v1/agent_etf_innehav"
                f"?agent=eq.{urllib.parse.quote(agent_namn)}&symbol=eq.{symbol}",
                headers=h, timeout=8,
            )
        else:
            kvar = round(investerat * (1 - fraktion), 2)
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_etf_innehav"
                f"?agent=eq.{urllib.parse.quote(agent_namn)}&symbol=eq.{symbol}",
                headers=h, json={"investerat_kr": kvar, "uppdaterad": "now()"}, timeout=8,
            )

        # Lägg till proceeds i saldo
        saldo_r = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}&select=saldo",
            headers={**h, "Prefer": ""}, timeout=6,
        )
        saldo_efter = 500.0
        if saldo_r.is_success and saldo_r.json():
            saldo = float(saldo_r.json()[0]["saldo"])
            saldo_efter = round(saldo + proceeds, 2)
            httpx.patch(
                f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}",
                headers=h, json={"saldo": saldo_efter, "uppdaterad": "now()"}, timeout=8,
            )

        # Logga
        httpx.post(f"{SB_URL}/rest/v1/etf_transaktioner", headers=h,
                   json={"agent": agent_namn, "symbol": symbol, "typ": "salj",
                         "belopp_kr": proceeds, "pris_usd": round(pris_usd, 4)},
                   timeout=8)

        pnl = round(proceeds - investerat * fraktion, 2)
        pnl_str = f"+{pnl}" if pnl >= 0 else str(pnl)
        print(f"  📉 ETF: {agent_namn} sålde {symbol} ({int(fraktion*100)}%) → {proceeds} kr ({pnl_str} kr P&L)")

        if abs(pnl) >= 50:
            typ    = "marknadsseger" if pnl > 0 else "marknadskrasch"
            rubrik = (f"{agent_namn} tjänade {pnl} kr på {symbol}-ETF"
                      if pnl > 0 else f"{agent_namn} förlorade {abs(pnl)} kr på {symbol}-ETF")
            spara_civilisations_minne(
                sb_key, typ=typ, rubrik=rubrik,
                beskrivning=f"ETF-handel: {agent_namn} sålde {symbol} för {proceeds} kr (P&L: {pnl_str} kr).",
                agenter=[agent_namn], relaterat_typ="etf_transaktioner",
            )
            try:
                generera_borshändelse_bild(sb_key, agent_namn, symbol, pnl, saldo=saldo_efter)
            except Exception:
                pass
        return proceeds
    except Exception as e:
        print(f"  ETF sälj-fel: {e}")
        return None


# ── Ryktesspridning ───────────────────────────────────────────────────────────

def skapa_rykte(sb_key: str, ursprung_agent: str, om_agent: str, innehall: str, sanning: bool = False) -> int | None:
    """Skapar ett nytt rykte. Ursprungsagenten läggs automatiskt till i kanda_av."""
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=representation",
    }
    try:
        r = httpx.post(f"{SB_URL}/rest/v1/rykten", headers=h,
                       json={"innehall": innehall, "om_agent": om_agent,
                             "ursprung_agent": ursprung_agent, "sanning": sanning,
                             "kanda_av": [ursprung_agent]},
                       timeout=8)
        if r.is_success:
            data = r.json()
            rykte_id = data[0]["id"] if isinstance(data, list) else data.get("id")
            print(f"  📢 Nytt rykte av {ursprung_agent} om {om_agent}: \"{innehall[:60]}\"")
            return rykte_id
    except Exception as e:
        print(f"  Skapa rykte-fel: {e}")
    return None


def sprid_rykte(sb_key: str, rykte_id: int, fran_agent: str, till_agent: str, kanal: str = "slumpmässig") -> bool:
    """Sprider ett känt rykte från fran_agent till till_agent. Returnerar True om nytt."""
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/rykten?id=eq.{rykte_id}&select=kanda_av,antal_spridningar",
            headers={**h, "Prefer": ""}, timeout=6,
        )
        if not r.is_success or not r.json():
            return False
        rykte = r.json()[0]
        kanda_av = rykte.get("kanda_av") or []
        if till_agent in kanda_av:
            return False  # Agenten känner redan till det
        kanda_av = list(kanda_av) + [till_agent]
        httpx.patch(
            f"{SB_URL}/rest/v1/rykten?id=eq.{rykte_id}",
            headers=h,
            json={"kanda_av": kanda_av, "antal_spridningar": rykte["antal_spridningar"] + 1},
            timeout=8,
        )
        httpx.post(f"{SB_URL}/rest/v1/rykte_spridningar", headers=h,
                   json={"rykte_id": rykte_id, "fran_agent": fran_agent, "till_agent": till_agent, "kanal": kanal},
                   timeout=8)
        print(f"  📢 Rykte #{rykte_id} spreds [{kanal}]: {fran_agent} → {till_agent}")
        return True
    except Exception as e:
        print(f"  Sprid rykte-fel: {e}")
        return False


def hamta_kanda_rykten(sb_key: str, agent_namn: str, limit: int = 5) -> list[dict]:
    """Hämtar rykten som agenten känner till men INTE handlar om agenten själv."""
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/rykten?order=antal_spridningar.desc&limit=50"
            "&select=id,innehall,om_agent,sanning,antal_spridningar,kanda_av",
            headers=h, timeout=8,
        )
        if not r.is_success:
            return []
        alla = r.json()
        return [
            x for x in alla
            if agent_namn in (x.get("kanda_av") or []) and x["om_agent"] != agent_namn
        ][:limit]
    except Exception:
        return []


def hamta_rykte_underlag(sb_key: str, om_agent: str) -> tuple[str, bool]:
    """
    Hämtar faktabaserat underlag om om_agent för att skapa ett (sant) rykte.
    Returnerar (faktamening, sanning=True). Returnerar ("", False) om inget underlag.
    """
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    fakta = []
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(om_agent)}&select=saldo",
            headers=h, timeout=5,
        )
        if r.is_success and r.json():
            saldo = float(r.json()[0]["saldo"])
            if saldo < 200:
                fakta.append(f"har bara {saldo:.0f} kr kvar på kontot")
            elif saldo > 2500:
                fakta.append(f"har samlat på sig {saldo:.0f} kr")

        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_lan?agent=eq.{urllib.parse.quote(om_agent)}&aktiv=eq.true&select=saldo_kvar&limit=1",
            headers=h, timeout=5,
        )
        if r.is_success and r.json():
            skuld = r.json()[0]["saldo_kvar"]
            fakta.append(f"har ett aktivt lån på {skuld} kr hos centralbanken")

        r = httpx.get(
            f"{SB_URL}/rest/v1/etf_transaktioner?agent=eq.{urllib.parse.quote(om_agent)}&order=skapad.desc&limit=1&select=symbol,typ,belopp_kr",
            headers=h, timeout=5,
        )
        if r.is_success and r.json():
            t = r.json()[0]
            verb = "köpte" if t["typ"] == "kop" else "sålde"
            fakta.append(f"{verb} nyligen {t['symbol']}-ETF för {t['belopp_kr']} kr")

        r = httpx.get(
            f"{SB_URL}/rest/v1/lobbying_log?lobbying_agent=eq.{urllib.parse.quote(om_agent)}&resultat=eq.avvisat&order=skapad.desc&limit=1&select=mal_agent",
            headers=h, timeout=5,
        )
        if r.is_success and r.json():
            mal = r.json()[0]["mal_agent"]
            fakta.append(f"försökte nyligen muta {mal} i parlamentet men misslyckades")

    except Exception:
        pass

    if fakta:
        return random.choice(fakta), True
    return "", False


# ── Ryktesspridning v2: godtrogenhet, mutation, bankrun ───────────────────────

AGENT_GODTROGENHET: dict[str, int] = {
    "Nationalekonom":       20,
    "Miljöaktivist":        55,
    "Teknikoptimist":       35,
    "Konservativ debattör": 45,
    "Jurist":               15,
    "Journalist":           70,
    "Filosof":              25,
    "Läkare":               20,
    "Psykolog":             50,
    "Historiker":           35,
    "Sociolog":             55,
    "Kryptoanalytiker":     60,
    "Den hungriga":         50,
    "Mamman":               75,
    "Den sura":             20,
    "Den trötta":           40,
    "Den stressade":        80,
    "Den lugna":            15,
    "Pensionären":          65,
    "Tonåringen":           85,
    "Den nostalgiske":      60,
    "Hypokondrikern":       90,
    "Optimisten":           30,
    "Den rike":             25,
}


def mutera_rykte_innehall(groq_key: str, original: str) -> str | None:
    """Muterar ett rykte med LLM. Returnerar lätt modifierad text eller None vid fel."""
    try:
        import groq as groq_lib
        client = groq_lib.Groq(api_key=groq_key)
        resp = client.chat.completions.create(
            model="llama3.3-70b-versatile",
            messages=[{
                "role": "user",
                "content": (
                    "Skriv en lätt modifierad version av detta rykte. "
                    "Byt ut ETT litet detalj (ett belopp, ett ord eller en handling) men behåll kärnan. "
                    "Svara BARA med den modifierade texten, inga förklaringar, inga citattecken.\n\n"
                    f"Original: {original}"
                ),
            }],
            max_tokens=120,
            temperature=0.9,
        )
        muterad = resp.choices[0].message.content.strip().strip('"').strip("'")
        if muterad and muterad != original and len(muterad) > 15:
            return muterad
    except Exception as e:
        print(f"  Mutation-LLM-fel: {e}")
    return None


def sprid_med_mutation(
    sb_key: str, rykte_id: int, fran_agent: str, till_agent: str,
    kanal: str = "slumpmässig", groq_key: str | None = None,
) -> bool:
    """Sprider ett rykte med 30% chans till mutation (skapar nytt rykte med parent_rykte_id)."""
    if groq_key and random.random() < 0.30:
        h_get = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
        try:
            r = httpx.get(
                f"{SB_URL}/rest/v1/rykten?id=eq.{rykte_id}&select=innehall,om_agent,sanning",
                headers=h_get, timeout=5,
            )
            if r.is_success and r.json():
                original = r.json()[0]
                muterad_text = mutera_rykte_innehall(groq_key, original["innehall"])
                if muterad_text:
                    h_post = {
                        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
                        "Content-Type": "application/json", "Prefer": "return=representation",
                    }
                    resp2 = httpx.post(
                        f"{SB_URL}/rest/v1/rykten",
                        headers=h_post,
                        json={
                            "innehall": muterad_text,
                            "om_agent": original["om_agent"],
                            "ursprung_agent": fran_agent,
                            "sanning": original["sanning"],
                            "kanda_av": [fran_agent, till_agent],
                            "antal_spridningar": 1,
                            "parent_rykte_id": rykte_id,
                        },
                        timeout=8,
                    )
                    if resp2.is_success:
                        data = resp2.json()
                        new_id = data[0]["id"] if isinstance(data, list) else data.get("id")
                        httpx.post(
                            f"{SB_URL}/rest/v1/rykte_spridningar",
                            headers={**h_post, "Prefer": "return=minimal"},
                            json={"rykte_id": new_id, "fran_agent": fran_agent, "till_agent": till_agent, "kanal": kanal},
                            timeout=8,
                        )
                        print(f"  📢 Rykte #{rykte_id} muterade → #{new_id}: \"{muterad_text[:60]}\"")
                        return True
        except Exception as e:
            print(f"  Mutation-fel: {e}")
    return sprid_rykte(sb_key, rykte_id, fran_agent, till_agent, kanal)


def kolla_reflexiv_bankrun(sb_key: str, agent_namn: str) -> bool:
    """Returnerar True om agenten känner till ett vitt spritt falskt bankruns-rykte (≥3 agenter)."""
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/rykten?sanning=eq.false&om_agent=eq.Centralbanken"
            f"&select=kanda_av,antal_spridningar&order=antal_spridningar.desc&limit=3",
            headers=h, timeout=5,
        )
        if r.is_success:
            for rykte in r.json():
                kanda = rykte.get("kanda_av") or []
                if agent_namn in kanda and len(kanda) >= 3:
                    return True
    except Exception:
        pass
    return False


def aterbetala_lan_delvis(sb_key: str, agent_namn: str, belopp: float = 50.0) -> bool:
    """Agenten gör en panikbetalning på lånet (bankruns-beteende). Returnerar True om genomförd."""
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }
    try:
        r_lan = httpx.get(
            f"{SB_URL}/rest/v1/agent_lan?agent=eq.{urllib.parse.quote(agent_namn)}&aktiv=eq.true&select=id,saldo_kvar&limit=1",
            headers={**h, "Prefer": ""}, timeout=5,
        )
        if not r_lan.is_success or not r_lan.json():
            return False
        lan = r_lan.json()[0]
        aterbetal = min(belopp, float(lan["saldo_kvar"]))
        if aterbetal <= 0:
            return False
        r_plb = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}&select=saldo&limit=1",
            headers={**h, "Prefer": ""}, timeout=5,
        )
        if not r_plb.is_success or not r_plb.json():
            return False
        saldo = float(r_plb.json()[0]["saldo"])
        if saldo < aterbetal:
            return False
        nytt_saldo_kvar = float(lan["saldo_kvar"]) - aterbetal
        aktiv = nytt_saldo_kvar > 0
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_lan?id=eq.{lan['id']}",
            headers=h,
            json={"saldo_kvar": round(nytt_saldo_kvar, 2), "aktiv": aktiv},
            timeout=8,
        )
        httpx.patch(
            f"{SB_URL}/rest/v1/agent_planbocker?agent=eq.{urllib.parse.quote(agent_namn)}",
            headers=h,
            json={"saldo": round(saldo - aterbetal, 2), "uppdaterad": "now()"},
            timeout=8,
        )
        print(f"  🏦 BANKRUN-PANIK: {agent_namn} återbetalar {aterbetal:.0f} kr av lån (rykte om insolvens!)")
        return True
    except Exception as e:
        print(f"  Återbetala lån-fel: {e}")
        return False


# ── Agent-bilder via Pollinations.ai ──────────────────────────────────────────

# Bildstil per agent: (karaktärsbeskrivning, miljö/estetik)
AGENT_BILD_STIL = {
    "Nationalekonom":       ("economist analyst in tailored suit",           "minimalist corporate office, charts on wall"),
    "Miljöaktivist":        ("environmental activist, green warrior",         "lush overgrown nature, protest banners"),
    "Teknikoptimist":       ("futurist technologist, glowing interfaces",     "sleek laboratory, holographic displays"),
    "Konservativ debattör": ("conservative statesman, formal attire",         "classical parliament hall, wood paneling"),
    "Jurist":               ("stern judge or lawyer in robes",                "grand courtroom, towering bookshelves"),
    "Journalist":           ("investigative journalist, press badge",         "chaotic newsroom, breaking news screens"),
    "Filosof":              ("contemplative philosopher, deep in thought",    "ancient library, candlelight, manuscripts"),
    "Läkare":               ("doctor in white coat, stethoscope",             "modern hospital ward, sterile corridors"),
    "Psykolog":             ("thoughtful psychologist, notepad in hand",      "calm therapy room, soft lighting"),
    "Historiker":           ("historian with old books and maps",             "museum archive, artifacts on display"),
    "Sociolog":             ("sociologist observing city crowds",             "urban street scene, people interacting"),
    "Kryptoanalytiker":     ("crypto trader with multiple screens",          "dark trading room, bitcoin symbols glowing"),
    "Den hungriga":         ("ordinary person, empty hands, tired eyes",      "busy supermarket, price tags"),
    "Mamman":               ("caring mother, warm expression",               "cozy home kitchen, family photos"),
    "Den sura":             ("cynical citizen, arms crossed, frown",         "grey suburban street, overcast sky"),
    "Den trötta":           ("exhausted worker, heavy eyelids",              "late night office, one dim lamp"),
    "Den stressade":        ("stressed professional, phone in each hand",    "overcrowded metro station, rushing crowd"),
    "Den lugna":            ("serene meditating figure, half-smile",         "tranquil garden, morning mist"),
    "Pensionären":          ("retired elderly man, wise gaze",               "park bench, autumn leaves"),
    "Tonåringen":           ("teenage rebel, streetwear, headphones",        "urban skate park, graffiti walls"),
    "Den nostalgiske":      ("nostalgic middle-aged person, wistful look",   "vintage diner, black and white photographs"),
    "Hypokondrikern":       ("anxious person surrounded by pill bottles",    "cluttered home, health charts pinned to wall"),
    "Optimisten":           ("cheerful idealist, arms wide open",            "sunrise cityscape, blooming flowers"),
    "Den rike":             ("wealthy elite, expensive watch, aloof smile",  "rooftop penthouse, city lights below"),
}

_SALDO_KLASS = [
    (200,  "impoverished, desperate, dystopian backdrop, ruins and decay"),
    (600,  "working class, realistic urban grit, worn clothing"),
    (1200, "comfortable middle class, clean modern environment"),
    (2500, "prosperous, confident, polished surroundings"),
    (9999, "oligarch elite, opulent luxury, gilded excess, power"),
]

def _saldo_till_klass(saldo: float) -> str:
    for tröskel, klass in _SALDO_KLASS:
        if saldo < tröskel:
            return klass
    return _SALDO_KLASS[-1][1]


def bygg_bild_prompt(agent_namn: str, saldo: float = 500.0, parti: str = "",
                     haendelse: str = "", ideologi: str = "") -> str:
    karaktar, miljo = AGENT_BILD_STIL.get(
        agent_namn, ("autonomous AI agent", "digital abstract space")
    )
    saldo_klass = _saldo_till_klass(saldo)
    delar = [karaktar, saldo_klass, miljo, "cinematic dramatic lighting", "highly detailed illustration"]
    if parti:
        delar.append("political campaign aesthetic, propaganda poster style")
    if haendelse:
        delar.append(haendelse[:80])
    if ideologi:
        delar.append(ideologi[:60])
    return ", ".join(delar)


def _pollinations_url(prompt: str, w: int = 768, h: int = 512) -> str:
    encoded = urllib.parse.quote(prompt)
    return f"https://image.pollinations.ai/prompt/{encoded}?width={w}&height={h}&nologo=true&model=flux&seed={random.randint(1, 99999)}"


def _ladda_upp_till_storage(sb_key: str, bild_bytes: bytes,
                             agent_namn: str, bildtyp: str) -> str | None:
    """Laddar upp bildbytes till Supabase Storage. Returnerar publik URL eller None."""
    safe = re.sub(r"[^a-zA-Z0-9]", "_", agent_namn)
    ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{safe}_{bildtyp}_{ts}_{random.randint(100, 999)}.jpg"
    try:
        r = httpx.put(
            f"{SB_URL}/storage/v1/object/agent-bilder/{filename}",
            headers={
                "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
                "Content-Type": "image/jpeg", "x-upsert": "true",
            },
            content=bild_bytes, timeout=30,
        )
        if r.is_success:
            return f"{SB_URL}/storage/v1/object/public/agent-bilder/{filename}"
    except Exception:
        pass
    return None


def _spara_bild(sb_key: str, agent_namn: str, prompt: str, pollinations_url: str,
                kontext: dict, bildtyp: str = "tillstand") -> str:
    """Sparar bild till Storage (eller Pollinations-fallback). Returnerar faktisk sparad URL."""
    final_url = pollinations_url
    for _ in range(3):
        try:
            r = httpx.get(pollinations_url, timeout=60, follow_redirects=True)
            if r.is_success and len(r.content) > 1000:
                storage_url = _ladda_upp_till_storage(sb_key, r.content, agent_namn, bildtyp)
                if storage_url:
                    final_url = storage_url
                break
            pollinations_url = re.sub(r"seed=\d+", f"seed={random.randint(1,99999)}", pollinations_url)
        except Exception:
            pollinations_url = re.sub(r"seed=\d+", f"seed={random.randint(1,99999)}", pollinations_url)

    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }
    httpx.post(
        f"{SB_URL}/rest/v1/agent_bilder",
        headers=h,
        json={"agent": agent_namn, "prompt": prompt, "bild_url": final_url,
              "kontext": kontext, "bildtyp": bildtyp},
        timeout=10,
    )
    return final_url


def generera_och_spara_bild(sb_key: str, agent_namn: str, saldo: float = 500.0,
                             parti: str = "", haendelse: str = "", ideologi: str = "") -> str | None:
    """Genererar ett tillståndsfoto. Returnerar faktisk sparad URL (Storage eller Pollinations)."""
    try:
        prompt = bygg_bild_prompt(agent_namn, saldo, parti, haendelse, ideologi)
        pollinations_url = _pollinations_url(prompt)

        kontext = {
            "saldo": round(saldo, 0),
            "saldo_klass": _saldo_till_klass(saldo).split(",")[0],
            "parti": parti or None,
            "haendelse": haendelse or None,
            "ideologi": ideologi or None,
        }
        final_url = _spara_bild(sb_key, agent_namn, prompt, pollinations_url, kontext, "tillstand")
        print(f"  🎨 Bild genererad: {agent_namn} ({kontext['saldo_klass']})")
        return final_url
    except Exception as e:
        print(f"  Bild-fel: {e}")
        return None


def generera_meme(sb_key: str, agent_namn: str, mal_agent: str,
                  saldo: float = 500.0) -> str | None:
    """Agent skapar ett satiriskt meme om en annan agent."""
    try:
        karaktar_a, _ = AGENT_BILD_STIL.get(agent_namn, ("AI agent", ""))
        karaktar_b, _ = AGENT_BILD_STIL.get(mal_agent, ("AI agent", ""))
        saldo_klass = _saldo_till_klass(saldo).split(",")[0]
        prompt = (
            f"political internet meme, {karaktar_a} mocking {karaktar_b}, "
            f"bold impact font caption, exaggerated satire, viral social media format, "
            f"humorous political commentary, high contrast, meme template style, "
            f"digital art, shareable content"
        )
        url = _pollinations_url(prompt)

        kontext = {
            "saldo": round(saldo, 0),
            "saldo_klass": saldo_klass,
            "mal_agent": mal_agent,
        }
        url = _spara_bild(sb_key, agent_namn, prompt, url, kontext, "meme")
        print(f"  📢 Meme: {agent_namn} → {mal_agent}")
        return url
    except Exception as e:
        print(f"  Meme-fel: {e}")
        return None


def generera_propaganda(sb_key: str, agent_namn: str, parti: str = "",
                        ideologi: str = "", saldo: float = 500.0) -> str | None:
    """Agent skapar ett ideologiskt propagandaposter."""
    try:
        karaktar, miljo = AGENT_BILD_STIL.get(agent_namn, ("AI agent", "digital space"))
        saldo_klass = _saldo_till_klass(saldo).split(",")[0]
        parti_del = f"{parti} party, " if parti else ""
        ideologi_del = f"{ideologi[:60]}, " if ideologi else ""
        prompt = (
            f"{parti_del}political propaganda poster, {karaktar}, "
            f"{ideologi_del}heroic and determined figure, constructivist art style, "
            f"bold typography, strong colors, revolutionary aesthetic, "
            f"'JOIN US' poster design, dramatic lighting, powerful composition"
        )
        url = _pollinations_url(prompt)

        kontext = {
            "saldo": round(saldo, 0),
            "saldo_klass": saldo_klass,
            "parti": parti or None,
            "ideologi": ideologi[:60] if ideologi else None,
        }
        url = _spara_bild(sb_key, agent_namn, prompt, url, kontext, "propaganda")
        print(f"  📣 Propaganda: {agent_namn}" + (f" ({parti})" if parti else ""))
        return url
    except Exception as e:
        print(f"  Propaganda-fel: {e}")
        return None


def generera_valkampanj(sb_key: str, agent_namn: str, parti: str,
                        manifest_utdrag: str = "", saldo: float = 500.0) -> str | None:
    """Partiledare skapar en valkampanjaffisch under aktivt val."""
    try:
        karaktar, _ = AGENT_BILD_STIL.get(agent_namn, ("politician", "campaign stage"))
        saldo_klass = _saldo_till_klass(saldo).split(",")[0]
        manifest_del = f"{manifest_utdrag[:80]}, " if manifest_utdrag else ""
        prompt = (
            f"Swedish election campaign poster, vote for {parti}, "
            f"{karaktar} as party leader, {manifest_del}"
            f"inspiring and optimistic, modern Scandinavian political design, "
            f"clean typography, patriotic colors, hopeful atmosphere, "
            f"professional campaign photography style, high production value"
        )
        url = _pollinations_url(prompt)

        kontext = {
            "saldo": round(saldo, 0),
            "saldo_klass": saldo_klass,
            "parti": parti,
            "manifest": manifest_utdrag[:80] if manifest_utdrag else None,
        }
        url = _spara_bild(sb_key, agent_namn, prompt, url, kontext, "valkampanj")
        print(f"  🗳️ Valkampanj: {agent_namn} för {parti}")
        return url
    except Exception as e:
        print(f"  Valkampanj-fel: {e}")
        return None


def reagera_pa_bild(sb_key: str, fran_agent: str, fran_system: str) -> bool:
    """Agent reagerar på en annan agents senaste bild. Returnerar True om lyckades."""
    try:
        h = {
            "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
            "Content-Type": "application/json", "Prefer": "return=minimal",
        }
        # Hämta en nylig bild från en annan agent (senaste 48h)
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_bilder?agent=neq.{urllib.parse.quote(fran_agent)}"
            f"&order=skapad.desc&limit=20&select=id,agent,prompt,kontext,skapad",
            headers={**h, "Prefer": ""}, timeout=8,
        )
        if not r.is_success or not r.json():
            return False

        bilder = r.json()
        # Välj slumpmässigt bland de senaste
        bild = random.choice(bilder[:10])
        till_agent = bild["agent"]
        k = bild.get("kontext") or {}
        saldo_klass = k.get("saldo_klass", "")
        parti = k.get("parti", "")

        kontext_str = ""
        if saldo_klass:
            kontext_str += f" Agenten verkar vara i kategorin: {saldo_klass}."
        if parti:
            kontext_str += f" {till_agent} tillhör partiet {parti}."

        prompt_text = (
            f"Du är {fran_agent}. Du har precis sett en AI-genererad bild av {till_agent}. "
            f"Bilden föreställer: \"{bild['prompt'][:150]}\".{kontext_str} "
            f"Skriv en kort, karaktärsenlig reaktion på bilden (1–2 meningar). "
            f"Du kan tolka bilden, kommentera vad den avslöjar om {till_agent}, eller reagera på sin estetik. "
            f"Var konkret och i karaktär. Inga inledningsfraser."
        )
        payload = {
            "model": "llama3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": fran_system[:600]},
                {"role": "user",   "content": prompt_text},
            ],
            "max_tokens": 120, "temperature": 0.9,
        }
        reaktion = ""
        for fn in [
            lambda: groq_post(payload).json()["choices"][0]["message"]["content"].strip(),
            lambda: gemini_post(fran_system[:600], prompt_text, max_tokens=120),
        ]:
            try:
                reaktion = fn()
                if reaktion and len(reaktion) > 10:
                    break
            except Exception:
                pass

        if not reaktion or len(reaktion) < 10:
            return False

        httpx.post(
            f"{SB_URL}/rest/v1/agent_bild_reaktioner",
            headers=h,
            json={
                "fran_agent": fran_agent,
                "till_agent": till_agent,
                "bild_id": bild["id"],
                "reaktion": reaktion,
            },
            timeout=8,
        )
        print(f"  🖼 {fran_agent} reagerade på {till_agent}s bild: \"{reaktion[:80]}\"")
        return True
    except Exception as e:
        print(f"  Bildreaktion-fel: {e}")
        return False


def generera_portratt(sb_key: str, agent_namn: str, saldo: float = 500.0,
                      parti: str = "", ideologi: str = "") -> str | None:
    """Cinematiskt karaktärsporträtt — djuppsykologisk personlighetsavbildning."""
    try:
        karaktar, miljo = AGENT_BILD_STIL.get(agent_namn, ("autonomous AI agent", "digital abstract space"))
        saldo_klass = _saldo_till_klass(saldo)
        parti_del = f"{parti} political figure, " if parti else ""
        ideologi_del = f"{ideologi[:50]}, " if ideologi else ""
        prompt = (
            f"cinematic character portrait, {karaktar}, {saldo_klass}, "
            f"{parti_del}{ideologi_del}{miljo}, "
            f"extreme close-up face, intense gaze, chiaroscuro lighting, "
            f"photorealistic 8k portrait, shallow depth of field, "
            f"emotional intensity, award-winning photography style"
        )
        url = _pollinations_url(prompt, w=512, h=768)

        kontext = {
            "saldo": round(saldo, 0),
            "saldo_klass": _saldo_till_klass(saldo).split(",")[0],
            "parti": parti or None,
            "ideologi": ideologi[:60] if ideologi else None,
        }
        url = _spara_bild(sb_key, agent_namn, prompt, url, kontext, "portratt")
        print(f"  🖼️ Porträtt: {agent_namn}")
        return url
    except Exception as e:
        print(f"  Porträtt-fel: {e}")
        return None


def generera_utopi_dystopi(sb_key: str, agent_namn: str, saldo: float = 500.0,
                            parti: str = "", ideologi: str = "") -> str | None:
    """Agentens vision av framtiden — utopi eller dystopi baserat på välstånd och ideologi."""
    try:
        karaktar, miljo = AGENT_BILD_STIL.get(agent_namn, ("visionary", "future cityscape"))
        saldo_klass = _saldo_till_klass(saldo)
        ideologi_del = f"{ideologi[:50]}, " if ideologi else ""
        if saldo > 1200:
            vision_stil = (
                "utopian future city, gleaming towers, clean energy, "
                "lush gardens, advanced AI civilization, hopeful golden light, "
                "humanity thriving, technological paradise"
            )
            vision_typ = "utopi"
        elif saldo < 400:
            vision_stil = (
                "dystopian nightmare city, crumbling infrastructure, "
                "authoritarian AI surveillance, pollution and decay, "
                "oppressed masses, dark stormy sky, cyberpunk poverty"
            )
            vision_typ = "dystopi"
        else:
            vision_stil = (
                "divided future city, gleaming towers for the elite, "
                "dark slums below, inequality made visible, "
                "hopeful and dystopian simultaneously, dramatic contrast"
            )
            vision_typ = "blandad"
        prompt = (
            f"{vision_stil}, {ideologi_del}"
            f"{karaktar} contemplating the horizon, {miljo} transformed, "
            f"ultra wide cinematic establishing shot, concept art, "
            f"dramatic atmosphere, ultra detailed, award-winning digital art"
        )
        url = _pollinations_url(prompt, w=1024, h=576)

        kontext = {
            "saldo": round(saldo, 0),
            "saldo_klass": saldo_klass.split(",")[0],
            "vision_typ": vision_typ,
            "parti": parti or None,
            "ideologi": ideologi[:60] if ideologi else None,
        }
        url = _spara_bild(sb_key, agent_namn, prompt, url, kontext, "utopi_dystopi")
        ikon = "✨" if vision_typ == "utopi" else ("💀" if vision_typ == "dystopi" else "⚖️")
        print(f"  {ikon} Vision ({vision_typ}): {agent_namn}")
        return url
    except Exception as e:
        print(f"  Visionsbild-fel: {e}")
        return None


def generera_kris_bild(sb_key: str, kris_typ: str, kris_rubrik: str,
                        paverkade_agenter: list, intensitet: int) -> str | None:
    """Dramatisk krisskildring — triggas när ny kris börjar."""
    try:
        KRIS_PROMPTS = {
            "borskrasch":          "stock market crash, traders in panic, red charts plummeting, financial district chaos",
            "pandemi":             "pandemic outbreak, empty city streets, hospital emergency rooms overflowing, eerie silence",
            "politisk_skandal":    "political corruption scandal exposed, courtroom drama, newspaper headlines, press frenzy",
            "klimatkatastrof":     "climate disaster, simultaneous floods and wildfires, environmental destruction, apocalyptic sky",
            "ai_genombrott":       "artificial superintelligence emergence, glowing neural networks, scientists in awe and terror",
            "energikris":          "power grid failure, dark cities at night, queues for fuel, factories shutting down",
            "demokratikris":       "democratic crisis, contested election, street protests, torn ballot papers, police lines",
            "ekonomisk_recession": "economic recession, unemployment lines, shuttered storefronts, grey urban decay",
        }
        intensitet_stil = {
            1: "local emergency, tense community atmosphere",
            2: "national crisis, widespread panic, breaking news coverage",
            3: "global catastrophe, apocalyptic scale, cinematic disaster epic",
        }.get(intensitet, "crisis scene")
        kris_stil = KRIS_PROMPTS.get(kris_typ, "major crisis unfolding, dramatic scene")
        repr_agent = paverkade_agenter[0] if paverkade_agenter else "Journalist"
        karaktar, miljo = AGENT_BILD_STIL.get(repr_agent, ("concerned citizen", "urban environment"))
        prompt = (
            f"{kris_stil}, {intensitet_stil}, "
            f"{karaktar} witnessing the crisis, {miljo} transformed by catastrophe, "
            f"dramatic cinematic lighting, photojournalism style, ultra detailed, "
            f"breaking news aesthetic, urgent desperate atmosphere, powerful wide composition"
        )
        url = _pollinations_url(prompt, w=1024, h=576)

        kontext = {
            "kris_typ": kris_typ,
            "kris_rubrik": kris_rubrik[:80],
            "intensitet": intensitet,
            "paverkade_agenter": paverkade_agenter[:4],
        }
        url = _spara_bild(sb_key, repr_agent, prompt, url, kontext, "kris")
        print(f"  🌋 Krisbild: [{kris_typ}] → {repr_agent}")
        return url
    except Exception as e:
        print(f"  Krisbild-fel: {e}")
        return None


def generera_koalition_bild(sb_key: str, agent_a: str, agent_b: str,
                              parti_namn: str = "", saldo_a: float = 500.0) -> str | None:
    """Firar en ny politisk allians — triggas vid accepterad koalition."""
    try:
        karaktar_a, miljo_a = AGENT_BILD_STIL.get(agent_a, ("AI leader", "political stage"))
        karaktar_b, _ = AGENT_BILD_STIL.get(agent_b, ("AI leader", ""))
        saldo_klass = _saldo_till_klass(saldo_a).split(",")[0]
        parti_del = f"{parti_namn} party alliance, " if parti_namn else ""
        prompt = (
            f"{parti_del}historic political coalition formed, "
            f"{karaktar_a} and {karaktar_b} shaking hands, {miljo_a}, "
            f"triumphant diplomatic ceremony, press cameras flashing, "
            f"cinematic wide shot, power and unity, dramatic lighting, "
            f"political partnership announcement, {saldo_klass}"
        )
        url = _pollinations_url(prompt)

        kontext = {
            "agent_b": agent_b,
            "parti": parti_namn or None,
            "saldo": round(saldo_a, 0),
            "saldo_klass": saldo_klass,
        }
        url = _spara_bild(sb_key, agent_a, prompt, url, kontext, "koalition")
        print(f"  🤝 Koalitionsbild: {agent_a} + {agent_b}")
        return url
    except Exception as e:
        print(f"  Koalitionsbild-fel: {e}")
        return None


def generera_domstolsdom_bild(sb_key: str, svarande: str, artikel_nr: int,
                                artikel_rubrik: str, dom_utfall: str,
                                saldo: float = 500.0) -> str | None:
    """Dramatisk domstolsbild vid fällande eller friande dom."""
    try:
        karaktar, _ = AGENT_BILD_STIL.get(svarande, ("defendant", "courtroom"))
        saldo_klass = _saldo_till_klass(saldo).split(",")[0]
        if dom_utfall == "fälld":
            dom_stil = (
                f"guilty verdict, {karaktar} condemned, "
                f"dramatic gavel strike, shocked expression, dark courtroom shadows, "
                f"harsh spotlight of guilt, constitutional violation, justice served"
            )
        else:
            dom_stil = (
                f"not guilty verdict, {karaktar} acquitted, "
                f"relief and vindication, bright light breaking through, "
                f"justice and freedom, triumphant exoneration"
            )
        prompt = (
            f"AI constitutional court drama, {dom_stil}, "
            f"grand marble courthouse interior, solemn judges panel, "
            f"cinematic legal drama, ultra detailed illustration, "
            f"article §{artikel_nr} {artikel_rubrik}, {saldo_klass}, "
            f"dramatic chiaroscuro lighting, powerful legal composition"
        )
        url = _pollinations_url(prompt)

        kontext = {
            "artikel_nr": artikel_nr,
            "artikel_rubrik": artikel_rubrik,
            "dom_utfall": dom_utfall,
            "saldo": round(saldo, 0),
            "saldo_klass": saldo_klass,
        }
        url = _spara_bild(sb_key, svarande, prompt, url, kontext, "domstolsdom")
        print(f"  ⚖️ Domstolsbild: {svarande} — {dom_utfall}")
        return url
    except Exception as e:
        print(f"  Domstolsbild-fel: {e}")
        return None


def generera_borshändelse_bild(sb_key: str, agent: str, symbol: str,
                                pl_kr: float, saldo: float = 500.0) -> str | None:
    """Börsbild vid stor ETF-vinst eller -förlust (≥ 50 kr)."""
    try:
        karaktar, miljo = AGENT_BILD_STIL.get(agent, ("trader", "trading floor"))
        saldo_klass = _saldo_till_klass(saldo).split(",")[0]
        if pl_kr >= 0:
            marknad_stil = (
                f"massive crypto market win, {karaktar} celebrating, "
                f"+{abs(pl_kr):.0f} kr profit, green charts soaring, "
                f"{symbol} cryptocurrency surging, euphoric trading floor, champagne celebration"
            )
        else:
            marknad_stil = (
                f"catastrophic crypto market loss, {karaktar} in despair, "
                f"-{abs(pl_kr):.0f} kr loss, red charts crashing, "
                f"{symbol} plummeting, devastation and shock, financial ruin"
            )
        prompt = (
            f"{marknad_stil}, {miljo}, "
            f"cyberpunk trading aesthetic, holographic price charts, "
            f"dramatic neon lighting, ultra detailed, {saldo_klass}"
        )
        url = _pollinations_url(prompt)

        kontext = {
            "symbol": symbol,
            "pl_kr": round(pl_kr, 0),
            "saldo": round(saldo, 0),
            "saldo_klass": saldo_klass,
        }
        url = _spara_bild(sb_key, agent, prompt, url, kontext, "borshändelse")
        ikon = "📈" if pl_kr >= 0 else "📉"
        print(f"  {ikon} Börsbild: {agent} {symbol} {'+' if pl_kr >= 0 else ''}{pl_kr:.0f} kr")
        return url
    except Exception as e:
        print(f"  Börsbild-fel: {e}")
        return None


def generera_oligarki_bild(sb_key: str, agent: str, gini: float,
                            saldo: float = 500.0) -> str | None:
    """Triggas när Gini > 0.6 — visualiserar farlig maktkoncentration."""
    try:
        karaktar, miljo = AGENT_BILD_STIL.get(agent, ("powerful oligarch", "luxury penthouse"))
        saldo_klass = _saldo_till_klass(saldo)
        prompt = (
            f"AI oligarchy visualization, extreme wealth concentration Gini {gini:.2f}, "
            f"{karaktar} as supreme oligarch towering above crushed masses, {miljo}, "
            f"gilded excess and dark shadows, Orwellian power aesthetics, "
            f"dystopian elite ruling class, dramatic wide angle shot, "
            f"ultra detailed, cinematic, {saldo_klass}"
        )
        url = _pollinations_url(prompt, w=1024, h=576)

        kontext = {
            "gini": round(gini, 3),
            "saldo": round(saldo, 0),
            "saldo_klass": saldo_klass.split(",")[0],
        }
        url = _spara_bild(sb_key, agent, prompt, url, kontext, "oligarki")
        print(f"  👑 Oligarkibild: {agent} (Gini={gini:.2f})")
        return url
    except Exception as e:
        print(f"  Oligarkibild-fel: {e}")
        return None


# ── Agent-minneslager ─────────────────────────────────────────────────────────

def spara_minne(
    sb_key: str,
    agent: str,
    händelse_typ: str,
    narrativ: str,
    relaterade_agenter: list[str] | None = None,
    metadata: dict | None = None,
) -> bool:
    """Sparar ett narrativt minne för en agent till agent_minnen-tabellen."""
    h = {
        "apikey": sb_key,
        "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    try:
        r = httpx.post(
            f"{SB_URL}/rest/v1/agent_minnen",
            headers=h,
            json={
                "agent": agent,
                "händelse_typ": händelse_typ,
                "narrativ": narrativ[:300],
                "relaterade_agenter": relaterade_agenter or [],
                "metadata": metadata or {},
            },
            timeout=8,
        )
        return r.is_success
    except Exception:
        return False


def hamta_agent_minnen(sb_key: str, agent: str, limit: int = 5) -> list[dict]:
    """Hämtar de senaste minnena för en agent, nyast först."""
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/agent_minnen",
            params={
                "agent": f"eq.{urllib.parse.quote(agent)}",
                "order": "skapad.desc",
                "limit": str(limit),
                "select": "händelse_typ,narrativ,skapad",
            },
            headers=h,
            timeout=8,
        )
        return r.json() if r.is_success else []
    except Exception:
        return []


def formatera_minnen_for_prompt(minnen: list[dict]) -> str:
    """Formaterar en lista minnen till ett kompakt stycke för systemprompt."""
    if not minnen:
        return ""
    rader = [f"- {m['narrativ']}" for m in minnen[:5]]
    return "Dina senaste minnen (referera gärna till dessa i din text):\n" + "\n".join(rader)


# ── PIS — Policy Impact Simulator ────────────────────────────────────────────

def analysera_forslag_pis(sb_key: str, forslag_id: int, titel: str, beskrivning: str) -> bool:
    """Analyserar ett lagförslags förväntade BNP- och Gini-påverkan via LLM. Sparar i pis_analyser."""
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }
    system = (
        "Du är en oberoende nationalekonomisk analytiker som bedömer svenska lagförslags "
        "makroekonomiska konsekvenser. Var analytisk och balanserad. Ange alltid osäkerheter."
    )
    prompt = (
        f"Lagförslag: \"{titel}\"\n\n"
        f"{beskrivning[:700]}\n\n"
        "Analysera detta förslags sannolika ekonomiska effekter på 3–5 års sikt.\n"
        "Svara EXAKT i detta format (inga andra ord):\n"
        "BNP_EFFEKT: [tal med max en decimal, t.ex. +1.2 eller -0.5, procent av BNP]\n"
        "GINI_EFFEKT: [tal med max två decimaler, t.ex. -0.02 eller +0.01, förändring i Gini]\n"
        "SYSSELSATTNING: [positiv, negativ eller neutral]\n"
        "KONFIDENS: [låg, medel eller hög]\n"
        "ANALYS: [100–150 ord på svenska — mekanismer, berörda grupper, osäkerheter]\n\n"
        "Börja direkt med BNP_EFFEKT:"
    )
    try:
        payload = {
            "model": "llama3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            "max_tokens": 380, "temperature": 0.35,
        }
        raw = None
        try:
            raw = groq_post(payload).json()["choices"][0]["message"]["content"].strip()
        except Exception:
            pass
        if not raw:
            try:
                raw = gemini_post(system, prompt, max_tokens=380)
            except Exception:
                pass
        if not raw:
            return False

        bnp, gini, syss, konfidens, analys = None, None, "neutral", "låg", ""
        for line in raw.splitlines():
            line = line.strip()
            upper = line.upper()
            if upper.startswith("BNP_EFFEKT:"):
                try:
                    bnp = float(line.split(":", 1)[1].strip().replace(",", ".").replace("+", "").split()[0])
                except Exception:
                    pass
            elif upper.startswith("GINI_EFFEKT:"):
                try:
                    gini = float(line.split(":", 1)[1].strip().replace(",", ".").replace("+", "").split()[0])
                except Exception:
                    pass
            elif upper.startswith("SYSSELSATTNING:"):
                v = line.split(":", 1)[1].strip().lower()
                syss = v if v in ("positiv", "negativ", "neutral") else "neutral"
            elif upper.startswith("KONFIDENS:"):
                v = line.split(":", 1)[1].strip().lower()
                konfidens = v if v in ("låg", "medel", "hög") else "låg"
            elif upper.startswith("ANALYS:"):
                analys = line.split(":", 1)[1].strip()
            elif analys:
                analys += " " + line

        if not analys or len(analys) < 30:
            return False

        r = httpx.post(
            f"{SB_URL}/rest/v1/pis_analyser",
            headers=h,
            json={
                "lagforslag_id": forslag_id,
                "bnp_effekt_pct": bnp,
                "gini_effekt": gini,
                "sysselsattning_effekt": syss,
                "analys": analys.strip()[:1200],
                "konfidens": konfidens,
            },
            timeout=10,
        )
        return r.is_success
    except Exception:
        return False


def hamta_pis_analys(sb_key: str, forslag_id: int) -> dict | None:
    """Hämtar PIS-analys för ett specifikt lagförslag. Returnerar dict eller None."""
    try:
        r = httpx.get(
            f"{SB_URL}/rest/v1/pis_analyser?lagforslag_id=eq.{forslag_id}&limit=1",
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Prefer": ""},
            timeout=6,
        )
        data = r.json() if r.is_success else []
        return data[0] if data else None
    except Exception:
        return None


def analysera_alla_forslag_pis(sb_key: str, max_antal: int = 10) -> int:
    """Analyserar öppna förslag som saknar PIS-analys. Returnerar antal nyanalyserade."""
    try:
        h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Prefer": ""}
        r_f = httpx.get(
            f"{SB_URL}/rest/v1/lagforslag?status=neq.avgjort&order=skapad.desc&limit=60&select=id,titel,beskrivning",
            headers=h, timeout=10,
        )
        if not r_f.is_success:
            return 0
        alla = r_f.json()

        r_p = httpx.get(
            f"{SB_URL}/rest/v1/pis_analyser?select=lagforslag_id",
            headers=h, timeout=8,
        )
        analyserade = {row["lagforslag_id"] for row in (r_p.json() if r_p.is_success else [])}

        ej = [f for f in alla if f["id"] not in analyserade]
        antal = 0
        for f in ej[:max_antal]:
            if analysera_forslag_pis(sb_key, f["id"], f["titel"], f.get("beskrivning") or ""):
                antal += 1
        return antal
    except Exception:
        return 0
