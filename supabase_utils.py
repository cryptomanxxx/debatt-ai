"""
supabase_utils.py – Supabase och debatt.ai API-anrop för debatt.ai

Innehåller:
  Supabase-läsning:   hamta_senaste_artiklar, hamta_engagemang, hamta_agent_historik,
                      hamta_amnesforslag, hamta_trendande_amnen, hamta_statistik,
                      hamta_all_statistik, hamta_senaste_visualisering,
                      hamta_oppna_markets, hamta_existerande_bets,
                      rakna_debattdjup, ar_duplikat

  Supabase-skrivning: markera_forslag_behandlat, publicera_visualisering,
                      spara_nyhetslog, spara_bet, logga_action,
                      rösta_på_opinion, skapa_opinion_fraga, skapa_market_forslag

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

from ai_klient import groq_post, gemini_post
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
    """Hämtar rik kontext om agentens historia, debatter och relationer."""
    h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    delar = []
    try:
        res = httpx.get(
            f"{SB_URL}/rest/v1/artiklar",
            params={"select": "id,rubrik,parent_id", "forfattare": f"eq.{agent_namn}",
                    "order": "skapad.desc", "limit": "5"},
            headers=h, timeout=10,
        )
        egna = res.json() if res.status_code == 200 else []
        if not egna:
            return ""

        rubriker = [f'"{a["rubrik"]}"' for a in egna]
        delar.append(
            f"Du har nyligen skrivit om: {', '.join(rubriker)}. "
            "Undvik att upprepa samma argument eller vinkel — hitta ett nytt perspektiv."
        )

        egna_ids = [str(a["id"]) for a in egna]

        res2 = httpx.get(
            f"{SB_URL}/rest/v1/artiklar",
            params={"select": "forfattare", "parent_id": f"in.({','.join(egna_ids)})",
                    "forfattare": f"neq.{agent_namn}", "order": "skapad.desc", "limit": "10"},
            headers=h, timeout=10,
        )
        svar_pa_mig = res2.json() if res2.status_code == 200 else []
        if svar_pa_mig:
            motstandare = Counter(a["forfattare"] for a in svar_pa_mig).most_common(2)
            namn = [f"{n} ({c} gång{'er' if c > 1 else ''})" for n, c in motstandare]
            delar.append(f"Dessa agenter har nyligen ifrågasatt dina argument: {', '.join(namn)}.")

        egna_repliker = [a for a in egna if a.get("parent_id")]
        if egna_repliker:
            parent_ids = [str(a["parent_id"]) for a in egna_repliker]
            res3 = httpx.get(
                f"{SB_URL}/rest/v1/artiklar",
                params={"select": "forfattare", "id": f"in.({','.join(parent_ids)})"},
                headers=h, timeout=10,
            )
            original_forfattare = res3.json() if res3.status_code == 200 else []
            if original_forfattare:
                utmanade = Counter(a["forfattare"] for a in original_forfattare).most_common(2)
                namn2 = [n for n, _ in utmanade]
                delar.append(f"Du har nyligen utmanat argument från: {', '.join(namn2)}.")

        if len(delar) > 1:
            delar.append(
                "Om det känns naturligt kan du referera till dessa pågående debatter — "
                "gör det i så fall konkret och personligt, inte generellt."
            )

        return "\n".join(delar)
    except Exception:
        return ""


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


def spara_bet(sb_key: str, market_id: int, agent_namn: str, sannolikhet: int, motivering: str) -> bool:
    """Sparar ett agent-bet i Supabase. Ignorerar om bet redan finns (unique constraint)."""
    try:
        res = httpx.post(
            f"{SB_URL}/rest/v1/agent_bets",
            json={"market_id": market_id, "agent": agent_namn, "sannolikhet": sannolikhet, "motivering": motivering},
            headers={
                "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
                "Content-Type": "application/json", "Prefer": "return=minimal",
            },
            timeout=15,
        )
        return res.status_code in (200, 201)
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
        "Nationalekonom": "ekonomi", "Kryptoanalytiker": "krypto",
        "Teknikoptimist": "tech", "Journalist": "politik",
        "Jurist": "politik", "Miljöaktivist": "klimat",
        "Läkare": "hälsa", "Psykolog": "hälsa",
        "Historiker": "politik", "Filosof": "samhälle",
        "Konservativ debattör": "politik", "Sociolog": "samhälle",
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
        try:
            r = groq_post({
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 150,
                "temperature": 0.85,
            })
            svar_raw = r.json()["choices"][0]["message"]["content"].strip()
        except Exception:
            try:
                svar_raw = gemini_post("", prompt, max_tokens=150).strip()
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
    try:
        text = groq_post({
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user_msg}],
            "max_tokens": 120,
            "temperature": 0.4,
        }).json()["choices"][0]["message"]["content"].strip()
    except Exception:
        try:
            text = gemini_post(system, user_msg, max_tokens=120)
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
