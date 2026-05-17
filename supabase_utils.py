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
import sys
import urllib.parse
from collections import Counter
from datetime import datetime, timezone, timedelta

from ai_klient import groq_post, gemini_post, github_models_post
from agenter import OPINION_FRAGOR

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


def spara_bet(sb_key: str, market_id: int, agent_namn: str, sannolikhet: int, motivering: str) -> bool:
    """Sparar ett agent-bet i Supabase. Drar insats från saldo_spel."""
    try:
        # Insats baseras på konfidensgrad: 10–40 kr
        confidence = abs(sannolikhet - 50)
        insats = max(10, min(40, 10 + int(confidence * 0.6)))

        # Kontrollera spelkonto
        saldo_spel = _hamta_saldo_spel(sb_key, agent_namn)
        if saldo_spel < 10:
            print(f"  {agent_namn}: tomt spelkonto ({saldo_spel} kr) — hoppar bet")
            return False
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
                    "model": "llama-3.3-70b-versatile",
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
                "model": "llama-3.3-70b-versatile",
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
            "model": "llama-3.3-70b-versatile",
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
            "model": "llama-3.3-70b-versatile",
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
        "model": "llama-3.3-70b-versatile",
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


def rösta_på_lagforslag_block(agent: dict, sb_key: str) -> int:
    """Agent röstar på öppna lagförslag den inte röstat på (max 2 per körning)."""
    forslag = hamta_lagforslag(sb_key)
    if not forslag:
        return 0
    antal = 0
    for f in forslag:
        if antal >= 2:
            break
        if agent["namn"] in hamta_lag_roster_agenter(sb_key, f["id"]):
            continue
        try:
            prompt = (
                f"Lagförslag: \"{f['titel']}\"\n\n"
                f"{f['beskrivning'][:600]}\n\n"
                "Rösta på detta förslag utifrån din personlighet och dina värderingar. "
                "Svara EXAKT i detta format:\n"
                "RÖST: ja\n"
                "MOTIVERING: Din motivering på svenska, 1–2 meningar.\n\n"
                "Välj RÖST: ja, nej eller avstar"
            )
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": agent["system"][:600]},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 120, "temperature": 0.7,
            }
            try:
                raw = groq_post(payload).json()["choices"][0]["message"]["content"].strip()
            except Exception:
                raw = gemini_post(agent["system"][:600], prompt, max_tokens=120)

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
            "model": "llama-3.3-70b-versatile",
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
    """Hämtar färska propositioner från riksdagen.se API och importerar nya. Returnerar antal importerade."""
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json", "Prefer": "return=minimal",
    }
    importerade = 0
    try:
        api_r = httpx.get(
            "https://data.riksdagen.se/dokumentlista/"
            "?doktyp=prop&utformat=json&sz=8&sort=datum&sortorder=desc",
            timeout=15,
        )
        if not api_r.is_success:
            return 0

        data = api_r.json()
        dokument = data.get("dokumentlista", {}).get("dokument", [])
        if isinstance(dokument, dict):
            dokument = [dokument]

        for dok in dokument[:3]:
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
            beskrivning = (notis + " " + notis2).strip() or f"Proposition från riksdagen: {titel}"

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
        print(f"  ✗ Riksdagen-import misslyckades: {e}", file=sys.stderr)

    return importerade


def uppdatera_riksdagen_utfall(sb_key: str) -> int:
    """Hämtar voteringsresultat från riksdagen.se och sätter riksdagen_utfall automatiskt.

    Matchar tillhor_dok_id mot våra lagrade riksdagen_id-värden.
    Returnerar antal uppdaterade förslag.
    """
    h = {
        "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
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

        # Hämta senaste voteringar från riksdagen.se
        api_r = httpx.get(
            "https://data.riksdagen.se/voteringlista/"
            "?utformat=json&sz=200&sort=datum&sortorder=desc",
            timeout=15,
        )
        if not api_r.is_success:
            return 0

        data = api_r.json()
        voteringar = data.get("voteringlista", {}).get("votering", [])
        if isinstance(voteringar, dict):
            voteringar = [voteringar]

        # Gå igenom voteringar och hitta matchningar
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
                headers={**h, "Prefer": "return=minimal"},
                json={
                    "riksdagen_utfall": riksdagen_utfall,
                    "riksdagen_utfall_datum": datum,
                    "status": "avgjort",
                },
                timeout=10,
            )
            if patch_r.is_success:
                uppdaterade += 1
                print(f"  ✓ Uppdaterade riksdagen_utfall={riksdagen_utfall} för lagforslag {lagforslag_id} ({dok_id})")
                del pending[dok_id]  # Undvik dubbelbearbetning om flera voteringsrader matchar

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
        forslag = groq_post(forslag_prompt, system="Du föreslår politiska allianser.", max_tokens=120)
        if not forslag:
            forslag = gemini_post(forslag_prompt, system="Du föreslår politiska allianser.", max_tokens=120)
        if not forslag:
            return False

        # Målagenten svarar
        svar_prompt = (
            f"{mal_agent.get('systemprompt', f'Du är {mal_namn}.')}\n\n"
            f"{agent_namn} föreslår en koalition med dig i AI-parlamentet.\n"
            f"Ni har röstat lika på {alignment} motioner.\n\n"
            f"Förslaget: \"{forslag}\"\n\n"
            f"Svara EXAKT:\nBESLUT: accepterar eller avvisar\nSVAR: [1–2 meningar i din karaktär]"
        )
        svar = groq_post(svar_prompt, system="Du besvarar politiska koalitionsförslag.", max_tokens=100)
        if not svar:
            svar = gemini_post(svar_prompt, system="Du besvarar politiska koalitionsförslag.", max_tokens=100)

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
            print(f"  ✓ Koalition bildad: {agent_namn} + {mal_namn} (samsyn: {alignment}, +3 styrka)")
            print(f"    Förslag: {forslag[:100]}…")
            print(f"    Svar: {svar_text[:100]}")
        else:
            print(f"  ✗ Koalition avvisad: {mal_namn} tackade nej till {agent_namn}")
            if svar_text:
                print(f"    Motivering: {svar_text[:100]}")

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
            return False

        forslag_ids = [r["lagforslag_id"] for r in res.json()]
        ids_str = ",".join(str(i) for i in forslag_ids)

        # Filtrera till öppna motioner
        res2 = httpx.get(
            f"{SB_URL}/rest/v1/lagforslag",
            params={"id": f"in.({ids_str})", "status": "eq.omrostning",
                    "select": "id,titel"},
            headers=h, timeout=8,
        )
        if not res2.is_success or not res2.json():
            return False

        forslag = random.choice(res2.json())
        forslag_id = forslag["id"]

        # Kontrollera saldo
        saldo_res = httpx.get(
            f"{SB_URL}/rest/v1/agent_planbocker",
            params={"agent": f"eq.{urllib.parse.quote(agent_namn)}", "select": "saldo"},
            headers=h, timeout=8,
        )
        saldo_data = saldo_res.json() if saldo_res.is_success else []
        saldo = saldo_data[0]["saldo"] if saldo_data else 0
        if saldo < 80:
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
        if not kandidater:
            return False

        mal_namn = random.choice(kandidater)
        from agenter import AGENTER as _AG
        mal_agent = next((a for a in _AG if a["namn"] == mal_namn), None)
        if not mal_agent:
            return False

        belopp = random.choice([20, 30, 40, 50])

        # Agent formulerar lobbyingargument
        lobby_prompt = (
            f"{agent.get('systemprompt', f'Du är {agent_namn}.')}\n\n"
            f"Du stödjer starkt denna motion i AI-parlamentet: \"{forslag['titel']}\"\n"
            f"Du vill lobba {mal_namn} att rösta JA. Du erbjuder {belopp} krediter ur din plånbok.\n"
            f"Ditt saldo: {saldo} kr.\n\n"
            f"Skriv ett kort, övertygande lobbyingargument (2 meningar) till {mal_namn}:"
        )
        argument = groq_post(lobby_prompt, system="Du skriver politiska lobbyingargument.", max_tokens=120)
        if not argument:
            argument = gemini_post(lobby_prompt, system="Du skriver politiska lobbyingargument.", max_tokens=120)
        if not argument:
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
        mal_svar = groq_post(mal_prompt, system="Du fattar politiska beslut.", max_tokens=80)
        if not mal_svar:
            mal_svar = gemini_post(mal_prompt, system="Du fattar politiska beslut.", max_tokens=80)

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

        emoji = "✓" if resultat == "accepterat" else "✗"
        print(f"  {emoji} Lobbying: {agent_namn} → {mal_namn} ({belopp} kr) — {resultat}")
        if resultat == "accepterat":
            print(f"    Röst ändrad: {rod_fore} → ja")
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

        svar = groq_post(prompt, system="Du extraherar ståndpunkter ur debattartiklar.", max_tokens=400)
        if not svar:
            svar = gemini_post(prompt, system="Du extraherar ståndpunkter ur debattartiklar.", max_tokens=400)
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

    svar = groq_post(prompt, prompt, max_tokens=80)
    if not svar:
        svar = gemini_post(prompt, prompt, max_tokens=80)
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

    svar = groq_post(prompt, prompt, max_tokens=80)
    if not svar:
        svar = gemini_post(prompt, prompt, max_tokens=80)
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

    svar = groq_post(prompt, prompt, max_tokens=80)
    if not svar:
        svar = gemini_post(prompt, prompt, max_tokens=80)
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
                json={"avgjord": True, "vinst": vinst},
                headers={**hdrs, "Prefer": "return=minimal"}, timeout=8,
            )
            print(f"  {'✓ vann' if won else '✗ förlorade'} {bet['agent']}: "
                  f"{'+'if won else ''}{vinst} kr (insats {insats} kr, {sann}% → {utfall})")
            settled += 1

        return settled
    except Exception as e:
        print(f"  ✗ Prediction-reglering misslyckades: {e}", file=sys.stderr)
        return 0
