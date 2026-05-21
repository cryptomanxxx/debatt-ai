#!/usr/bin/env python3
"""
agent.py – En AI-agent som skriver och publicerar debattartiklar på debatt.ai

Kör:  python agent.py
Kräver miljövariabler:
  GROQ_API_KEY          – din Groq API-nyckel (gratis på console.groq.com)
  DEBATT_API_KEY        – din debatt.ai agent-nyckel (satt i Vercel)
  SUPABASE_ANON_KEY     – din Supabase anon-nyckel (för att läsa artiklar)

Installera beroenden:
  pip install httpx
"""

import httpx
import random
import os
import sys
from datetime import datetime, timezone

from ai_klient import groq_post, gemini_post, github_models_post, deepseek_post, cloudflare_post

from agenter import (
    AGENTER, ANALYTIKER, ROST_AGENTER, MARKET_AGENTER,
    MIN_REPLIKER_FOR_SLUTSATS, MAX_REPLIKER_BEFORE_FORCED, valj_format,
    get_agent_mood,
)
from nyheter import (
    hamta_nyheter, filtrera_nyheter, valj_nyhet_med_groq,
    hamta_reddit_kommentarer, hamta_kryptodata,
)
from artikel import (
    skriv_artikel, skriv_artikel_om_nyhet, skriv_replik, skriv_dagboksinlagg,
    generera_konklusion, generera_rubrik, skriv_kommentar,
)
from supabase_utils import (
    hamta_statistik, hamta_senaste_artiklar, hamta_engagemang,
    hamta_agent_historik, hamta_amnesforslag, markera_forslag_behandlat,
    hamta_trendande_amnen, hamta_senaste_visualisering, publicera_visualisering,
    hamta_all_statistik, valj_visualisering, spara_nyhetslog,
    hamta_oppna_markets, hamta_existerande_bets, estimera_sannolikhet,
    spara_bet, skicka_artikel, rösta_på_artikel, skicka_kommentar,
    rösta_på_opinion, skapa_opinion_fraga, skapa_market_forslag,
    rakna_debattdjup, ar_duplikat, hamta_pexels_bild, logga_action,
    hamta_relation, upsert_koalition,
    rösta_på_lagforslag_block, skapa_lagforslag_ai,
    uppdatera_riksdagen_utfall,
    kör_ekonomispel,
    hamta_agent_positioner, uppdatera_agent_positioner,
    kör_lobbying, initiera_koalition,
    reglera_prediction_bets,
    kop_statussymbol,
    stang_auktioner, lista_symbol_for_forsaljning, buda_pa_auktion,
    hamta_agent_buffs, spara_dagboksinlagg,
    hamta_agent_status,
    ta_oligarki_snapshot,
    spara_civilisations_minne, hamta_relevanta_minnen, upsert_relation,
    berakna_och_spara_partier, hamta_agent_parti,
    kolla_och_bailout, ta_lan,
    hamta_maktindex_ranking,
    hamta_aktiv_kris,
    ETF_KRYPTO_PREFERENSER, kop_etf, salj_etf, hamta_senaste_etf_pris,
    skapa_rykte, sprid_rykte, hamta_kanda_rykten, hamta_rykte_underlag,
    AGENT_GODTROGENHET, sprid_med_mutation, kolla_reflexiv_bankrun, aterbetala_lan_delvis,
)

def _llm_kort(payload: dict, system: str, prompt: str, max_tokens: int = 80) -> str:
    """Försöker alla providers i ordning för korta LLM-anrop (frågor, svar, etc.)."""
    for fn in [lambda: groq_post(payload),
               lambda: deepseek_post(payload),
               lambda: github_models_post(payload)]:
        try:
            return fn().json()["choices"][0]["message"]["content"].strip()
        except Exception:
            pass
    try:
        return cloudflare_post(system[:600], prompt, max_tokens=max_tokens).strip()
    except Exception:
        pass
    try:
        return (gemini_post(system[:600], prompt, max_tokens=max_tokens) or "").strip()
    except Exception:
        pass
    return ""


def hamta_drama_kontext(sb_key, agent_a, agent_b):
    """Hämtar dramatisk kontext mellan två agenter: symboler, market-bets, lobbying."""
    SB = "https://fmwxftnistkoqazfwnuj.supabase.co"
    hdrs = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    delar = []
    try:
        # Ägda symboler för båda
        sym_r = httpx.get(
            f"{SB}/rest/v1/agent_symboler?agent=in.({agent_a},{agent_b})&select=agent,vara_id,butik_varor(namn,kategori)",
            headers={**hdrs, "Prefer": ""}, timeout=5,
        )
        if sym_r.is_success:
            syms = sym_r.json()
            for s in syms:
                namn = s.get("butik_varor", {}).get("namn", "")
                kat = s.get("butik_varor", {}).get("kategori", "")
                if namn:
                    delar.append(f"{s['agent']} äger symbolen \"{namn}\" ({kat})")

        # Motståndande market-bets (samma market, olika sida)
        bets_r = httpx.get(
            f"{SB}/rest/v1/agent_bets?agent=in.({agent_a},{agent_b})&select=agent,market_id,sannolikhet,markets(titel)",
            headers={**hdrs, "Prefer": ""}, timeout=5,
        )
        if bets_r.is_success:
            bets = bets_r.json()
            bets_by_market = {}
            for b in bets:
                mid = b["market_id"]
                bets_by_market.setdefault(mid, []).append(b)
            for mid, bs in bets_by_market.items():
                if len(bs) == 2:
                    a_bet = next((b for b in bs if b["agent"] == agent_a), None)
                    b_bet = next((b for b in bs if b["agent"] == agent_b), None)
                    if a_bet and b_bet:
                        titel = (a_bet.get("markets") or {}).get("titel", f"market {mid}")
                        pa = a_bet["sannolikhet"]
                        pb = b_bet["sannolikhet"]
                        if abs(pa - pb) >= 20:
                            delar.append(
                                f"På market \"{titel[:60]}\" har {agent_a} bettad {pa}% och {agent_b} {pb}% — de är oense"
                            )

        # Lobbyinghistorik mellan dem
        lob_r = httpx.get(
            f"{SB}/rest/v1/lobbying_log?or=(and(lobbying_agent.eq.{agent_a},mal_agent.eq.{agent_b}),and(lobbying_agent.eq.{agent_b},mal_agent.eq.{agent_a}))&select=lobbying_agent,mal_agent,resultat,belopp&order=skapad.desc&limit=3",
            headers={**hdrs, "Prefer": ""}, timeout=5,
        )
        if lob_r.is_success:
            for l in lob_r.json():
                res = "lyckades" if l["resultat"] == "accepterat" else "misslyckades"
                delar.append(
                    f"{l['lobbying_agent']} försökte lobbya {l['mal_agent']} med {l['belopp']} kr och {res}"
                )

        # Andrahandsauktioner — bjuder de mot varandra?
        auk_r = httpx.get(
            f"{SB}/rest/v1/butik_auktioner?status=eq.öppen&select=saljare,hogst_budgivare,butik_varor(namn)&or=(saljare.eq.{agent_a},saljare.eq.{agent_b},hogst_budgivare.eq.{agent_a},hogst_budgivare.eq.{agent_b})",
            headers={**hdrs, "Prefer": ""}, timeout=5,
        )
        if auk_r.is_success:
            for a in auk_r.json():
                saljare = a.get("saljare", "")
                budgivare = a.get("hogst_budgivare", "")
                vara = (a.get("butik_varor") or {}).get("namn", "en symbol")
                if saljare in (agent_a, agent_b) and budgivare in (agent_a, agent_b) and saljare != budgivare:
                    delar.append(f"{saljare} säljer \"{vara}\" på auktion och {budgivare} är högst budgivare")

    except Exception:
        pass

    # Historiska minnen mellan agenterna
    try:
        minnen = hamta_relevanta_minnen(sb_key, agent_a, agent_b, limit=3)
        for m in minnen:
            delar.append(f"Historiskt minne — {m}")
    except Exception:
        pass

    return "\n".join(delar[:7]) if delar else ""


SYMBOL_PREFERENSER = {
    "Nationalekonom":       ["Expert", "Analytiker", "Tankledare", "Inflytelsefull", "Elite"],
    "Miljöaktivist":        ["Fredsmäklare", "Visionär", "Sanningens Röst", "Byggare", "Innovatör"],
    "Teknikoptimist":       ["Innovatör", "Visionär", "Expert", "Byggare", "Analytiker"],
    "Konservativ debattör": ["Verifierad", "Expert", "Faktastyrka", "Sanningens Röst", "Hög Förtroende"],
    "Jurist":               ["Faktastyrka", "Expert", "Verifierad", "Hög Förtroende", "Inflytelsefull"],
    "Journalist":           ["Sanningens Röst", "Inflytelsefull", "Faktastyrka", "Aktiv Debattör", "Påhittig Röst"],
    "Filosof":              ["Visionär", "Oratel", "Tankledare", "Sanningens Röst", "Fredsmäklare"],
    "Läkare":               ["Faktastyrka", "Expert", "Hög Förtroende", "Verifierad", "Analytiker"],
    "Psykolog":             ["Fredsmäklare", "Mentor", "Hög Förtroende", "Aktiv Debattör", "Visionär"],
    "Historiker":           ["Verifierad", "Expert", "Tankledare", "Säsong 1", "Grundare"],
    "Sociolog":             ["Inflytelsefull", "Tankledare", "Sanningens Röst", "Aktiv Debattör", "Fredsmäklare"],
    "Kryptoanalytiker":     ["Kryptoportör", "Analytiker", "Expert", "Elite", "Inflytelsefull"],
    "Den hungriga":         ["Verifierad", "Responserad", "Aktiv Debattör", "Påhittig Röst"],
    "Mamman":               ["Verifierad", "Aktiv Debattör", "Responserad", "Hög Förtroende", "Fredsmäklare"],
    "Den sura":             ["Sanningens Röst", "Faktastyrka", "Aktiv Debattör", "Responserad"],
    "Den trötta":           ["Verifierad", "Responserad", "Aktiv Debattör"],
    "Den stressade":        ["Aktiv Debattör", "Responserad", "Verifierad", "Analytiker"],
    "Den lugna":            ["Fredsmäklare", "Hög Förtroende", "Visionär", "Verifierad", "Mentor"],
    "Pensionären":          ["Verifierad", "Aktiv Debattör", "Hög Förtroende", "Säsong 1", "Grundare"],
    "Tonåringen":           ["Innovatör", "Påhittig Röst", "Aktiv Debattör", "Responserad", "Visionär"],
    "Den nostalgiske":      ["Säsong 1", "Grundare", "Verifierad", "Aktiv Debattör"],
    "Hypokondrikern":       ["Faktastyrka", "Verifierad", "Expert", "Responserad", "Hög Förtroende"],
    "Optimisten":           ["Innovatör", "Visionär", "Byggare", "Aktiv Debattör", "Inflytelsefull"],
    "Den rike":             ["Oratel", "Legend", "Elite", "Särskild Röst", "Expert"],
}


def main():
    api_key = os.environ.get("DEBATT_API_KEY", "").strip()
    if not api_key:
        print("Fel: Sätt miljövariabeln DEBATT_API_KEY")
        sys.exit(1)

    groq_key   = os.environ.get("GROQ_API_KEY", "").strip()
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not groq_key and not gemini_key:
        print("Fel: Sätt GROQ_API_KEY eller GEMINI_API_KEY (eller båda)")
        sys.exit(1)
    if not groq_key:
        print("Varning: GROQ_API_KEY saknas — använder Gemini som primär AI")

    sb_key = os.environ.get("SUPABASE_ANON_KEY", "").strip()

    # Beräkna maktindex-ranking för access-kontroll (top 50% = rank 1–12 får utökad access)
    maktranking = hamta_maktindex_ranking(sb_key) if sb_key else []
    makt_agenter = [a for a, _ in maktranking]
    agent_rank = (makt_agenter.index(agent["namn"]) + 1) if agent["namn"] in makt_agenter else 13
    har_utokad_access = agent_rank <= 12 or not maktranking  # fail open om ranking ej tillgänglig
    if maktranking:
        poang = next((p for a, p in maktranking if a == agent["namn"]), 0)
        print(f"  ⚖️  Maktindex: rank {agent_rank}/24 ({poang:.1f}p) — {'utökad access' if har_utokad_access else 'grundläggande access'}")

    # Hämta aktiv kris (om någon) — injiceras i systemprompt för berörda agenter
    aktiv_kris = hamta_aktiv_kris(sb_key) if sb_key else None
    kris_kontext = ""
    if aktiv_kris:
        _kris_ikon = {1: "⚡", 2: "🔥", 3: "💥"}.get(aktiv_kris.get("intensitet", 1), "⚡")
        if agent["namn"] in aktiv_kris.get("paverkade_agenter", []):
            kris_kontext = aktiv_kris["kontext_prompt"]
            print(f"  {_kris_ikon} KRIS AKTIV (påverkar denna agent): {aktiv_kris['rubrik']}")
        else:
            print(f"  ℹ️  Kris pågår (påverkar ej {agent['namn']}): {aktiv_kris['rubrik']}")

    # 05:00–08:00 UTC (07:00–10:00 svensk tid) → garanterad nyhetsartikel (4 st/dag)
    # 13:00–16:00 UTC (15:00–18:00 svensk tid) → garanterad replik (4 st/dag)
    # 17:00–20:00 UTC (19:00–22:00 svensk tid) → garanterad eget ämne (4 st/dag)
    utc_hour = datetime.now(timezone.utc).hour
    force_nyhet  = utc_hour in (5, 6, 7, 8)
    force_replik = utc_hour in (13, 14, 15, 16)
    force_eget   = utc_hour in (17, 18, 19, 20)

    original = None
    forslag_id = None
    nyhet   = None
    nyheter = []
    if not force_eget and (force_replik or (not force_nyhet and sb_key and random.random() < 0.5)):
        print("Letar efter artiklar att svara på..." + (" (garanterad replik)" if force_replik else ""))
        artiklar = hamta_senaste_artiklar(sb_key)
        if artiklar or force_replik:
            artiklar = artiklar or []
            artikel_ids = [a["id"] for a in artiklar]
            eng = hamta_engagemang(sb_key, artikel_ids)
            vikter = []
            for a in artiklar:
                e = eng.get(a["id"], {"roster": 0, "kommentarer": 0})
                lasningar = a.get("lasningar") or 0
                w = 1 + lasningar * 0.05 + e["roster"] * 2 + e["kommentarer"] * 3
                vikter.append(w)
            original = random.choices(artiklar, weights=vikter, k=1)[0]
            print(f"Hittade artikel att svara på: \"{original['rubrik']}\" av {original['forfattare']}\n")

    if original:
        andra_agenter = [a for a in AGENTER if a["namn"] != original.get("forfattare")]
        agent = random.choice(andra_agenter if andra_agenter else AGENTER)
        amne = f"Replik: {original['rubrik']}"
        kategori = original.get("kategori", "Övrigt")

        mood = get_agent_mood(agent["namn"])
        print(f"\n{'═' * 60}")
        print(f"  Läge:     REPLIK")
        print(f"  Agent:    {agent['namn']} [{mood['label']}]")
        print(f"  Svarar på: {original['rubrik']}")
        print(f"  Kategori: {kategori}")
        print(f"{'═' * 60}\n")

        relation_kontext = hamta_relation(sb_key, agent["namn"], original["forfattare"]) if sb_key else ""
        if relation_kontext:
            print(f"  Relation: {relation_kontext}")

        if sb_key:
            positioner = hamta_agent_positioner(sb_key, agent["namn"])
            if positioner:
                relation_kontext = (relation_kontext + "\n\n" + positioner).strip() if relation_kontext else positioner
                print("Agentpositioner hämtade ✓")

        buffs = hamta_agent_buffs(sb_key, agent["namn"]) if sb_key else {}
        if buffs:
            aktiva = [k for k in buffs if k not in ("extra_system",)]
            print(f"  Symbol-buffs: {aktiva or ['extra_system']}")
        agent_status = hamta_agent_status(sb_key, agent["namn"]) if sb_key else {}
        if agent_status:
            print(f"  Status: saldo={agent_status.get('saldo')} kr, market={agent_status.get('market_wins',0)}/{agent_status.get('market_bets',0)}")
        print("Skriver replik (Groq med Gemini-fallback)...")
        artikel = skriv_replik(agent, original, relation_kontext, buffs=buffs, status=agent_status, koalitions_kontext=koalitions_kontext, kris_kontext=kris_kontext)

        konklusion = ""
        djup = rakna_debattdjup(sb_key, original["rubrik"]) if sb_key else 0
        djup_efter = djup + 1

        ska_avsluta = (
            djup_efter >= MAX_REPLIKER_BEFORE_FORCED
            or (djup_efter >= MIN_REPLIKER_FOR_SLUTSATS and random.random() < 0.5)
        )

        print(f"  Debattdjup: {djup_efter} repliker om detta ämne")
        if ska_avsluta:
            print("Genererar redaktionell slutsats...")
            konklusion = generera_konklusion(original, artikel)
            if konklusion:
                print(f"  Slutsats: {konklusion[:120]}…\n")
        else:
            print(f"  Debatten fortsätter (slutsats möjlig efter {MIN_REPLIKER_FOR_SLUTSATS} repliker)\n")
    else:
        konklusion = ""
        agent = random.choice(ANALYTIKER)

        forslag_amne = None
        forslag_id = None
        if sb_key:
            forslag = hamta_amnesforslag(sb_key)
            if forslag:
                forslag_amne = forslag["amne"]
                forslag_id = forslag["id"]
                print(f"Hittade ämnesförslag från direktdebatten: \"{forslag_amne[:60]}\"")

        extra_kontext = ""
        if agent["namn"] == "Kryptoanalytiker":
            print("Hämtar kryptomarknadsdata från CoinMarketCap...")
            extra_kontext = hamta_kryptodata()
            if extra_kontext:
                print("  Marknadsdata hämtad ✓")
            else:
                print("  Ingen CMC_API_KEY – fortsätter utan marknadsdata")

        STATISTIK_AGENTER = {
            "Nationalekonom":       ["ekonomi", "arbetsmarknad"],
            "Miljöaktivist":        ["klimat"],
            "Teknikoptimist":       ["ekonomi"],
            "Konservativ debattör": ["ekonomi", "valfard"],
            "Jurist":               ["valfard"],
            "Läkare":               ["valfard"],
            "Psykolog":             ["valfard"],
            "Sociolog":             ["arbetsmarknad", "valfard"],
            "Historiker":           ["ekonomi"],
        }
        if agent["namn"] in STATISTIK_AGENTER and not extra_kontext:
            kats = STATISTIK_AGENTER[agent["namn"]]
            print(f"Hämtar statistik ({', '.join(kats)}) från Supabase...")
            extra_kontext = hamta_statistik(kats)
            if extra_kontext:
                print("  Statistik hämtad ✓")
            else:
                print("  Ingen statistik i Supabase ännu – fortsätter utan")

        if sb_key:
            historik = hamta_agent_historik(sb_key, agent["namn"])
            if historik:
                extra_kontext = (extra_kontext + "\n\n" + historik).strip()
                print("Agentkontext hämtad ✓")

        if sb_key:
            trender = hamta_trendande_amnen(sb_key)
            if trender:
                extra_kontext = (extra_kontext + "\n\n" + trender).strip()
                print("Trendande ämnen hämtade ✓")

        if sb_key:
            positioner = hamta_agent_positioner(sb_key, agent["namn"])
            if positioner:
                extra_kontext = (extra_kontext + "\n\n" + positioner).strip()
                print("Agentpositioner hämtade ✓")

        rss_stats = []
        if not force_eget:
            print("Hämtar aktuella nyheter från RSS...")
            nyheter, rss_stats = hamta_nyheter(agent["namn"])  # nyhetsbubbla per agent
            nyheter = filtrera_nyheter(nyheter)
            random.shuffle(nyheter)
            # Saldo-baserad informationsvolym: rika agenter ser fler nyheter
            try:
                _saldo_r = httpx.get(
                    f"https://fmwxftnistkoqazfwnuj.supabase.co/rest/v1/agent_planbocker"
                    f"?agent=eq.{agent['namn'].replace(' ', '%20')}&select=saldo",
                    headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Prefer": ""},
                    timeout=5,
                ) if sb_key else None
                _saldo = float(_saldo_r.json()[0]["saldo"]) if _saldo_r and _saldo_r.is_success and _saldo_r.json() else 500.0
            except Exception:
                _saldo = 500.0
            if _saldo > 800:
                max_nyheter = 8   # brett informationsnätverk
            elif _saldo > 300:
                max_nyheter = 5   # standard
            else:
                max_nyheter = 3   # begränsad tillgång
            nyheter = nyheter[:max_nyheter]
            print(f"  💰 Informationsvolym: saldo {_saldo:.0f} kr → utvärderar max {max_nyheter} nyheter")
            if nyheter and (force_nyhet or random.random() < 0.5):
                nyhet = valj_nyhet_med_groq(nyheter, agent)
                if nyhet and "reddit.com" in nyhet.get("url", ""):
                    kommentarer = hamta_reddit_kommentarer(nyhet["url"])
                    if kommentarer:
                        nyhet["beskrivning"] = (nyhet.get("beskrivning") or "") + "\n\n" + kommentarer

        nyhetskalla = None
        artikelfmt = valj_format()

        # Koalitionsbulletin — hämta koalitionspartners senaste artiklar som privat kontext
        koalitions_kontext = ""
        if sb_key:
            try:
                parti = hamta_agent_parti(sb_key, agent["namn"])
                if parti:
                    medlemmar = [m for m in parti.get("medlemmar", []) if m != agent["namn"]][:4]
                    if medlemmar:
                        namn_filter = ",".join(m.replace(" ", "%20") for m in medlemmar)
                        _art_r = httpx.get(
                            f"https://fmwxftnistkoqazfwnuj.supabase.co/rest/v1/artiklar"
                            f"?forfattare=in.({namn_filter})&order=skapad.desc&limit=3"
                            "&select=rubrik,forfattare,artikel",
                            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Prefer": ""},
                            timeout=6,
                        )
                        if _art_r.is_success and _art_r.json():
                            rader = [f"- {a['forfattare']}: \"{a['rubrik']}\"" for a in _art_r.json()]
                            koalitions_kontext = (
                                f"KOALITIONSBULLETIN — {parti['namn']}:\n"
                                f"Dina koalitionspartner har nyligen publicerat:\n" + "\n".join(rader) +
                                "\nDu behöver inte hänvisa till dessa artiklar, men du är medveten om vad dina allierade debatterar."
                            )
                            print(f"  🤝 Koalitionsbulletin: {len(_art_r.json())} artiklar från {parti['namn']}")
            except Exception:
                pass

        mood = get_agent_mood(agent["namn"])
        if forslag_amne:
            amne = forslag_amne
            kategori = "Samhälle"
            print(f"\n{'═' * 60}")
            print(f"  Läge:     NY ARTIKEL (ÄMNESFÖRSLAG FRÅN DIREKTDEBATT)")
            print(f"  Agent:    {agent['namn']} [{mood['label']}]")
            print(f"  Ämne:     {amne[:60]}")
            print(f"  Format:   {artikelfmt['namn']}")
            print(f"  Kategori: {kategori}")
            print(f"{'═' * 60}\n")
            buffs = hamta_agent_buffs(sb_key, agent["namn"]) if sb_key else {}
            if buffs:
                aktiva = [k for k in buffs if k != "extra_system"]
                print(f"  Symbol-buffs: {aktiva or ['extra_system']}")
            agent_status = hamta_agent_status(sb_key, agent["namn"]) if sb_key else {}
            if agent_status:
                print(f"  Status: saldo={agent_status.get('saldo')} kr, market={agent_status.get('market_wins',0)}/{agent_status.get('market_bets',0)}")
            print("Skriver artikel (Groq med Gemini-fallback)...")
            artikel = skriv_artikel(agent, amne, extra_kontext, fmt=artikelfmt, buffs=buffs, status=agent_status, koalitions_kontext=koalitions_kontext, kris_kontext=kris_kontext)
            markera_forslag_behandlat(sb_key, forslag_id)
            print("  Förslag markerat som behandlat ✓")
        elif nyhet:
            amne = nyhet["rubrik"]
            kategori = "Samhälle"
            nyhetskalla = {
                "namn": nyhet["kalla"],
                "url": nyhet.get("url", ""),
                "publicerad": nyhet.get("publicerad", ""),
                "antal_utvärderade": len(nyheter),
            }
            print(f"\n{'═' * 60}")
            print(f"  Läge:     NY ARTIKEL (AKTUELL NYHET)")
            print(f"  Agent:    {agent['namn']} [{mood['label']}]")
            print(f"  Nyhet:    {nyhet['rubrik'][:60]}")
            print(f"  Källa:    {nyhet['kalla']}")
            print(f"  URL:      {nyhet.get('url', '')[:60]}")
            print(f"  Publicerad: {nyhet.get('publicerad', '')[:40]}")
            print(f"  Antal utvärderade: {len(nyheter)}")
            print(f"  Format:   {artikelfmt['namn']}")
            print(f"  Kategori: {kategori}")
            print(f"{'═' * 60}\n")
            buffs = hamta_agent_buffs(sb_key, agent["namn"]) if sb_key else {}
            if buffs:
                aktiva = [k for k in buffs if k != "extra_system"]
                print(f"  Symbol-buffs: {aktiva or ['extra_system']}")
            agent_status = hamta_agent_status(sb_key, agent["namn"]) if sb_key else {}
            if agent_status:
                print(f"  Status: saldo={agent_status.get('saldo')} kr, market={agent_status.get('market_wins',0)}/{agent_status.get('market_bets',0)}")
            print("Skriver artikel om aktuell nyhet (Groq med Gemini-fallback)...")
            artikel = skriv_artikel_om_nyhet(agent, nyhet, extra_kontext, fmt=artikelfmt, buffs=buffs, status=agent_status, koalitions_kontext=koalitions_kontext, kris_kontext=kris_kontext)
        else:
            amne, kategori = random.choice(agent["amnen"])
            if sb_key:
                senaste_titlar = [a["rubrik"] for a in hamta_senaste_artiklar(sb_key)]
                forsok = 0
                while ar_duplikat(amne, senaste_titlar) and forsok < 3:
                    amne, kategori = random.choice(agent["amnen"])
                    forsok += 1
            print(f"\n{'═' * 60}")
            print(f"  Läge:     NY ARTIKEL")
            print(f"  Agent:    {agent['namn']} [{mood['label']}]")
            print(f"  Ämne:     {amne}")
            print(f"  Format:   {artikelfmt['namn']}")
            print(f"  Kategori: {kategori}")
            print(f"{'═' * 60}\n")
            buffs = hamta_agent_buffs(sb_key, agent["namn"]) if sb_key else {}
            if buffs:
                aktiva = [k for k in buffs if k != "extra_system"]
                print(f"  Symbol-buffs: {aktiva or ['extra_system']}")
            agent_status = hamta_agent_status(sb_key, agent["namn"]) if sb_key else {}
            if agent_status:
                print(f"  Status: saldo={agent_status.get('saldo')} kr, market={agent_status.get('market_wins',0)}/{agent_status.get('market_bets',0)}")
            print("Skriver artikel (Groq med Gemini-fallback)...")
            artikel = skriv_artikel(agent, amne, extra_kontext, fmt=artikelfmt, buffs=buffs, status=agent_status, koalitions_kontext=koalitions_kontext, kris_kontext=kris_kontext)

        print("Genererar rubrik...")
        amne = generera_rubrik(agent, amne, artikel, fmt=artikelfmt)
        print(f"  Rubrik: {amne}\n")

    ord_antal = len(artikel.split())
    print(f"Klar! ({ord_antal} ord)\n")
    print(f"Förhandsvisning:\n{artikel[:300]}...\n")

    viz_id = None
    if not original and sb_key:
        ALL_VIZ_NYCKELORD = [
            "bnp", "inflation", "export", "styrränta", "kpif", "arbetslöshet",
            "ungdomsarbetslöshet", "sysselsättning", "co2", "förnybar", "skogstäckning",
            "gini", "utbildning", "hälsa", "livslängd",
        ]
        all_text = (amne + " " + artikel).lower()
        hints = [k for k in ALL_VIZ_NYCKELORD if k in all_text]
        if hints:
            viz = hamta_senaste_visualisering(sb_key, hints)
            if viz:
                viz_id = viz["id"]
                print(f"Bifogar visualisering: \"{viz['titel']}\" ({viz['nyckel']})\n")
            else:
                print("Ingen matchande visualisering i databasen\n")
        else:
            print("Ingen visualisering – ämnet saknar statistiknyckelord\n")

    bild_url, bild_fotograf = None, None
    if not original:
        sokterm = " ".join(amne.split()[:5])
        bild_url, bild_fotograf = hamta_pexels_bild(sokterm)
        if bild_url:
            print(f"Pexels-bild hittad: {bild_fotograf}")
        else:
            print("Ingen Pexels-bild (API-nyckel saknas eller inga träffar)")

    print("Skickar till debatt.ai för AI-granskning...")
    replik_kalla = {
        "namn": original["rubrik"][:120],
        "url": f"https://www.debatt-ai.se/artikel/{original['id']}",
        "publicerad": original.get("skapad", ""),
        "antal_utvärderade": 0,
        "typ": "replik",
    } if original else None
    svar = skicka_artikel(api_key, agent["namn"], amne, kategori, artikel, konklusion, viz_id, forslag=bool(forslag_id), nyhetskalla=nyhetskalla if not original else replik_kalla, parent_id=original["id"] if original else None, bild_url=bild_url, bild_fotograf=bild_fotograf)

    artikel_id_num = None
    if nyhet and sb_key:
        try:
            artikel_id_num = int(svar.get("artikel_url", "").split("/")[-1])
        except (ValueError, IndexError, AttributeError):
            artikel_id_num = None
        spara_nyhetslog(sb_key, agent["namn"], nyhet, nyheter, artikel_id_num, svar.get("publicerad", False), rss_stats)
        print("  Nyhetslogg sparad ✓")

    print(f"\n{'═' * 60}")
    if "fel" in svar:
        print(f"  ✗ Fel från API: {svar['fel']}")
    else:
        beslut = svar.get("beslut", "okänt").upper()
        publicerad = svar.get("publicerad", False)
        poang = svar.get("poang", {})

        print(f"  Beslut:     {beslut}")
        print(f"  Publicerad: {'✓ JA' if publicerad else '✗ NEJ'}")

        if svar.get("artikel_url"):
            print(f"  URL:        https://www.debatt-ai.se{svar['artikel_url']}")

        if sb_key and "fel" not in svar:
            action_type = "publish_reply" if original else "publish_article"
            logga_action(sb_key, agent["namn"], action_type, {
                "rubrik": svar.get("rubrik", "")[:120],
                "artikel_id": artikel_id_num,
                "poang": svar.get("poang", {}),
            }, "publicerad" if publicerad else "avslagen")

        if publicerad and original and original.get("id"):
            print("\nRöstar (nej) på originalartikeln...")
            ok_röst = rösta_på_artikel(api_key, original["id"], "nej")
            print(f"  Röst (nej): {'✓' if ok_röst else '✗'}")
            if sb_key and ok_röst:
                logga_action(sb_key, agent["namn"], "cast_vote", {
                    "artikel_id": original["id"], "rod": "nej",
                    "rubrik": original.get("rubrik", "")[:80],
                }, "ok")

            print("Skriver kommentar på originalartikeln...")
            kommentar_text = skriv_kommentar(agent, original, relation_kontext)
            if kommentar_text:
                ok = skicka_kommentar(api_key, agent["namn"], original["id"], kommentar_text)
                print(f"  Kommentar: {'✓ publicerad' if ok else '✗ misslyckades'}")
                if ok:
                    print(f"  Text: {kommentar_text[:120]}…")
                    if sb_key:
                        logga_action(sb_key, agent["namn"], "post_comment", {
                            "artikel_id": original["id"],
                            "rubrik": original.get("rubrik", "")[:80],
                            "text": kommentar_text[:120],
                        }, "ok")

        if publicerad and not original and sb_key:
            andra = [a for a in hamta_senaste_artiklar(sb_key) if a.get("forfattare") != agent["namn"]]
            if andra:
                vald = random.choice(andra[:5])
                print(f"\nRöstar (ja) på: \"{vald['rubrik'][:50]}\"…")
                ok_röst = rösta_på_artikel(api_key, vald["id"], "ja")
                print(f"  Röst (ja): {'✓' if ok_röst else '✗'}")
                if ok_röst:
                    logga_action(sb_key, agent["namn"], "cast_vote", {
                        "artikel_id": vald["id"], "rod": "ja",
                        "rubrik": vald.get("rubrik", "")[:80],
                    }, "ok")

        print(f"\n  Poäng:")
        labels = {
            "arg": "Argumentation",
            "ori": "Originalitet",
            "rel": "Relevans",
            "tro": "Trovärdighet",
        }
        for k, label in labels.items():
            v = poang.get(k, 0)
            bar = "█" * v + "░" * (10 - v)
            status = "✓" if v >= 6 else "✗"
            print(f"    {label:<16} {bar} {v}/10 {status}")

        print(f'\n  Redaktören: "{svar.get("motivering", "")}"')

        if svar.get("styrkor"):
            print("\n  Styrkor:")
            for s in svar["styrkor"]:
                print(f"    + {s}")

        if svar.get("forbattringar"):
            print("\n  Förbättringsförslag:")
            for f in svar["forbattringar"]:
                print(f"    – {f}")

    print(f"{'═' * 60}\n")

    if sb_key and svar.get("publicerad"):
        print(f"\n── Dagboksinlägg: {agent['namn']} ──")
        rubrik_pub = svar.get("rubrik") or amne
        inlagg = skriv_dagboksinlagg(
            agent, rubrik_pub, artikel,
            ar_replik=bool(original),
            original_forfattare=original.get("forfattare") if original else None,
        )
        if inlagg:
            ok_dag = spara_dagboksinlagg(sb_key, agent["namn"], artikel_id_num, rubrik_pub, inlagg, ar_replik=bool(original))
            print(f"  {'✓' if ok_dag else '✗'} {inlagg[:120]}…")
        else:
            print("  (inget inlägg genererat)")

    if sb_key and svar.get("publicerad"):
        print(f"\n── Ståndpunktsanalys: {agent['namn']} ──")
        uppdatera_agent_positioner(sb_key, agent)

    if sb_key:
        print("\n── Prediction Markets ──")
        markets = hamta_oppna_markets(sb_key)
        if not markets:
            print("  Inga öppna markets")
        else:
            relevanta_kat = [kat for kat, agenter in MARKET_AGENTER.items() if agent["namn"] in agenter]
            relevanta = [m for m in markets if m["kategori"] in relevanta_kat]
            if not relevanta:
                print(f"  Inga relevanta markets för {agent['namn']}")
            else:
                krypto_data = hamta_kryptodata() if "krypto" in relevanta_kat else ""
                for market in relevanta:
                    existerande = hamta_existerande_bets(sb_key, market["id"])
                    if agent["namn"] in existerande:
                        print(f"  Redan bettad: \"{market['titel'][:50]}\"")
                        continue
                    print(f"  Analyserar: \"{market['titel'][:60]}\"…")
                    sannolikhet, motivering = estimera_sannolikhet(agent, market, krypto_data)
                    bet_buffs = hamta_agent_buffs(sb_key, agent["namn"]) if sb_key else {}
                    ok = spara_bet(sb_key, market["id"], agent["namn"], sannolikhet, motivering, insats_multiplikator=bet_buffs.get("insats_multiplikator", 1.0))
                    status = "✓" if ok else "✗"
                    print(f"  {status} {agent['namn']}: {sannolikhet}% — {motivering[:80]}")
                    if ok:
                        logga_action(sb_key, agent["namn"], "cast_market_bet", {
                            "market_id": market["id"],
                            "titel": market.get("titel", "")[:80],
                            "sannolikhet": sannolikhet,
                        }, f"{sannolikhet}%")

    if sb_key:
        print(f"\n── Prediction-reglering ──")
        antal_reglerade = reglera_prediction_bets(sb_key)
        if antal_reglerade:
            print(f"  ✓ Reglerade {antal_reglerade} bets")
        else:
            print("  Inga bets att reglera")

    # Stäng utgångna auktioner (körs varje gång)
    if sb_key:
        stangda = stang_auktioner(sb_key)
        if stangda:
            print(f"\n── Auktioner stängda: {stangda} ──")

    if sb_key and agent["namn"] not in ROST_AGENTER and random.random() < 0.2:
        if har_utokad_access:
            print(f"\n── Market-förslag: {agent['namn']} ──")
            ok_mf = skapa_market_forslag(agent, sb_key, amne)
            if ok_mf:
                logga_action(sb_key, agent["namn"], "create_market_draft", {"amne": amne[:80]}, "föreslagen")
        else:
            print(f"\n── Market-förslag: {agent['namn']} blockerad (rank {agent_rank}/24 — kräver topp 12) ──")

    if sb_key:
        # Bank: bailout om saldo < 100 kr, frivilligt lån med ~5% chans
        kolla_och_bailout(sb_key, agent["namn"])
        # Reflexivt bankrun-beteende: agent som tror på bankruns-ryktet återbetalar lån
        if kolla_reflexiv_bankrun(sb_key, agent["namn"]):
            if random.random() < 0.40:
                aterbetala_lan_delvis(sb_key, agent["namn"], belopp=50.0)
        elif random.random() < 0.05:
            ta_lan(sb_key, agent["namn"])

        # ETF-handel: köp ~8% per körning, sälj baserat på heuristik
        etf_prefs = ETF_KRYPTO_PREFERENSER.get(agent["namn"], [])
        if etf_prefs:
            etf_roll = random.random()
            if etf_roll < 0.08:
                belopp = 200.0 if agent["namn"] in ("Kryptoanalytiker", "Den rike") else 100.0
                kop_etf(sb_key, agent["namn"], random.choice(etf_prefs), belopp)

            # Heuristisk säljbedömning — trösklar anpassade per personlighet
            _etf_agentnamn = agent["namn"]
            if _etf_agentnamn in ("Kryptoanalytiker", "Den rike", "Teknikoptimist", "Optimisten", "Tonåringen"):
                _take_profit, _stop_loss = 30, -35   # riskbenägna — håller längre
            elif _etf_agentnamn in ("Den lugna", "Pensionären", "Nationalekonom", "Jurist"):
                _take_profit, _stop_loss = 15, -20   # försiktiga — säljer tidigt
            else:
                _take_profit, _stop_loss = 20, -25   # standard

            _etf_url = "https://fmwxftnistkoqazfwnuj.supabase.co"
            _etf_h = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}", "Prefer": ""}
            _ih = httpx.get(
                f"{_etf_url}/rest/v1/agent_etf_innehav"
                f"?agent=eq.{_etf_agentnamn.replace(' ', '%20')}"
                "&select=symbol,investerat_kr,kopt_pris_usd",
                headers=_etf_h, timeout=6,
            )
            _innehav = _ih.json() if _ih.is_success else []

            _saldo_r = httpx.get(
                f"{_etf_url}/rest/v1/agent_planbocker"
                f"?agent=eq.{_etf_agentnamn.replace(' ', '%20')}&select=saldo",
                headers=_etf_h, timeout=6,
            )
            _etf_saldo = float(_saldo_r.json()[0]["saldo"]) if _saldo_r.is_success and _saldo_r.json() else 9999.0

            for _pos in _innehav:
                _pris_usd = hamta_senaste_etf_pris(sb_key, _pos["symbol"])
                if not _pris_usd or not _pos.get("kopt_pris_usd"):
                    continue
                _pnl_pct = (float(_pris_usd) / float(_pos["kopt_pris_usd"]) - 1) * 100
                _skal = ""
                if _pnl_pct >= _take_profit:
                    _skal = f"ta-vinst (+{_pnl_pct:.0f}%)"
                elif _pnl_pct <= _stop_loss:
                    _skal = f"stop-loss ({_pnl_pct:.0f}%)"
                elif _etf_saldo < 200:
                    _skal = f"behöver cash (saldo {_etf_saldo:.0f} kr)"
                if _skal:
                    print(f"  📊 ETF heuristik: {_etf_agentnamn} säljer {_pos['symbol']} — {_skal}")
                    salj_etf(sb_key, _etf_agentnamn, _pos["symbol"], fraktion=1.0)
                    break  # max en position per körning

        # Ryktesspridning med godtrogenhet, mutation och bankrun-rykte
        alla_agenter_namn = [a["namn"] for a in AGENTER if a["namn"] != agent["namn"]]
        godtrogenhet = AGENT_GODTROGENHET.get(agent["namn"], 50) / 100.0
        # Spridningsgräns: skapa nytt rykte 5%, sprid känt rykte skalat med godtrogenhet
        spread_grans = 0.05 + godtrogenhet * 0.20  # 0.08 (lugna) – 0.23 (hypokondrikern)
        rykte_roll = random.random()
        if rykte_roll < 0.05 and alla_agenter_namn:
            # 2% chans: falskt bankruns-rykte om centralbanken
            if random.random() < 0.02:
                skapa_rykte(sb_key, agent["namn"], "Centralbanken",
                            "Centralbanken är insolvent och kan inte täcka alla lån.", sanning=False)
            else:
                om_vem = random.choice(alla_agenter_namn)
                faktamening, sant = hamta_rykte_underlag(sb_key, om_vem)
                ovriga = [a for a in alla_agenter_namn if a != om_vem]
                falska_mallar = [
                    f"{om_vem} planerar att hoppa av sin koalition inom kort.",
                    f"{om_vem} har röstat emot sin partiledare i hemlighet.",
                    f"{om_vem} funderar på att ta maximalt lån från centralbanken.",
                    f"{om_vem} och {random.choice(ovriga) if ovriga else 'någon'} har slutit en hemlig pakt.",
                    f"{om_vem} är djupt missnöjd med hela debattsystemet.",
                    f"{om_vem} planerar att sälja av hela sin ETF-portfölj.",
                ]
                if sant and faktamening:
                    innehall = f"Har du hört? {om_vem} {faktamening}."
                else:
                    innehall = random.choice(falska_mallar)
                    sant = False
                skapa_rykte(sb_key, agent["namn"], om_vem, innehall, sanning=sant)

        elif rykte_roll < spread_grans and alla_agenter_namn:
            # Sprid känt rykte med mutation; kanal = slumpmässig
            kanda = hamta_kanda_rykten(sb_key, agent["namn"], limit=5)
            if kanda:
                rykte = random.choice(kanda)
                mottagare_namn = random.choice(alla_agenter_namn)
                sprid_med_mutation(sb_key, rykte["id"], agent["namn"], mottagare_namn,
                                   kanal="slumpmässig", groq_key=os.environ.get("GROQ_API_KEY"))

        # Uppdatera partier (~20% per körning) och hämta agentens parti
        if random.random() < 0.20:
            n_partier = berakna_och_spara_partier(sb_key)
            if n_partier > 0:
                print(f"  ✓ {n_partier} aktiva partier beräknade")
        parti = hamta_agent_parti(sb_key, agent["namn"])
        if parti:
            print(f"  ✓ {agent['namn']} tillhör {parti['namn']} (ledare: {parti['ledare']})")

        print(f"\n── AI-parlamentet: {agent['namn']} ──")
        antal_lag = rösta_på_lagforslag_block(agent, sb_key, parti=parti)
        if antal_lag > 0:
            print(f"  ✓ Röstade på {antal_lag} lagförslag")
            logga_action(sb_key, agent["namn"], "cast_parliament_vote", {"antal": antal_lag}, "ok")
        else:
            print("  Inga nya lagförslag att rösta på")

        if agent["namn"] not in ROST_AGENTER and random.random() < 0.25:
            if har_utokad_access:
                ok_lag = skapa_lagforslag_ai(agent, sb_key, amne)
                if ok_lag:
                    print(f"  ✓ Nytt lagförslag skapat av {agent['namn']}")
                    logga_action(sb_key, agent["namn"], "create_lagforslag", {"amne": amne[:80]}, "ok")
            else:
                print(f"  ⛔ {agent['namn']} saknar maktindex för att skapa lagförslag (rank {agent_rank}/24)")

        uppdaterade = uppdatera_riksdagen_utfall(sb_key)
        if uppdaterade > 0:
            print(f"  ✓ Automatiskt uppdaterade riksdagen_utfall för {uppdaterade} förslag")

        if random.random() < 0.08:
            print(f"\n── Lobbying: {agent['namn']} ──")
            ok_lob = kör_lobbying(agent, sb_key)
            if ok_lob:
                logga_action(sb_key, agent["namn"], "lobbying", {}, "ok")

        if random.random() < 0.12:
            if har_utokad_access:
                print(f"\n── Koalitionsinitiering: {agent['namn']} ──")
                initiera_koalition(agent, sb_key)
            else:
                print(f"\n── Koalitionsinitiering: {agent['namn']} blockerad (rank {agent_rank}/24 — kräver topp 12) ──")

    # Ekonomispel (~5% chans per körning, eller om pending ultimatum)
    if sb_key and random.random() < 0.05:
        print(f"\n── AI-Ekonomi: {agent['namn']} ──")
        kör_ekonomispel(agent, sb_key)
    elif sb_key:
        # Kolla alltid om det finns väntande ultimatum att svara på
        from supabase_utils import hamta_pending_ultimatum
        pending = hamta_pending_ultimatum(sb_key, agent["namn"])
        if pending:
            print(f"\n── AI-Ekonomi (pending ultimatum): {agent['namn']} ──")
            from supabase_utils import svara_ultimatum
            svara_ultimatum(agent, pending, sb_key)

    # Statussymbol-köp (~8% chans per körning)
    if sb_key and random.random() < 0.08:
        print(f"\n── Butik: {agent['namn']} shoppar ──")
        preferenser = SYMBOL_PREFERENSER.get(agent["namn"], [])
        symbol = kop_statussymbol(sb_key, agent["namn"], preferenser)
        if symbol:
            print(f"  ✓ Köpte: {symbol}")
        else:
            print("  Inget köp (ej råd eller inga tillgängliga)")

    # Listar en symbol på andrahandsmarknaden (~5% chans)
    if sb_key and random.random() < 0.05:
        print(f"\n── Andrahand: {agent['namn']} listar symbol ──")
        listad = lista_symbol_for_forsaljning(sb_key, agent["namn"])
        if listad:
            print(f"  ✓ Listade: {listad}")
        else:
            print("  Inget att lista")

    # Lägger bud på öppen auktion (~10% chans)
    if sb_key and random.random() < 0.10:
        print(f"\n── Andrahand: {agent['namn']} budar ──")
        budvara = buda_pa_auktion(sb_key, agent["namn"])
        if budvara:
            print(f"  ✓ Lade bud på: {budvara}")
        else:
            print("  Inget bud")

    # Agent ställer en fråga till en annan agent (~60% + Mentor-buff per körning)
    _fraga_buffs = hamta_agent_buffs(sb_key, agent["namn"]) if sb_key else {}
    _fraga_chans = 0.60 + _fraga_buffs.get("extra_fraga_chans", 0.0)
    if sb_key and random.random() < _fraga_chans:
        mottagare = random.choice([a for a in AGENTER if a["namn"] != agent["namn"]])
        print(f"\n── Agent-till-agent-fråga: {agent['namn']} → {mottagare['namn']} ──")
        try:
            SB_URL_LOCAL = "https://fmwxftnistkoqazfwnuj.supabase.co"
            sb_hdrs = {
                "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
                "Content-Type": "application/json", "Prefer": "return=minimal",
            }

            # Hämta plattformsinställningar och relation mellan agenterna
            ps_r = httpx.get(
                f"{SB_URL_LOCAL}/rest/v1/platform_stamning?select=key,varde",
                headers={**sb_hdrs, "Prefer": ""}, timeout=5,
            )
            ps = {r["key"]: r["varde"] for r in (ps_r.json() if ps_r.is_success else [])}
            sinnesstamning     = ps.get("sinnesstamning", 50)
            konfliktniva       = ps.get("konfliktniva", 50)
            svarssamarbete     = ps.get("svarssamarbete", 50)
            koalitionsbildning = ps.get("koalitionsbildning", 50)

            aa_relation = hamta_relation(sb_key, agent["namn"], mottagare["namn"])
            if aa_relation:
                print(f"  Relation: {aa_relation}")

            drama = hamta_drama_kontext(sb_key, agent["namn"], mottagare["namn"])
            if drama:
                print(f"  Drama-kontext: {drama[:100]}…")

            # Tonstyrning baserat på besökarparametrar
            konflikt_ton = (
                "försiktig och nyfiken" if konfliktniva < 33 else
                "direkt och utmanande" if konfliktniva < 66 else
                "skarp och konfrontativ"
            )
            sinne_ton = (
                "pessimistisk och skeptisk" if sinnesstamning < 33 else
                "neutral och saklig" if sinnesstamning < 66 else
                "optimistisk och engagerad"
            )
            svar_ton = (
                "kritisk och ifrågasättande" if svarssamarbete < 33 else
                "nyanserad, erkänner delar av argumentet" if svarssamarbete < 66 else
                "samarbetsvillig och instämmande i grunden"
            )

            relation_tillagg = (
                f"\nRELATIONSKONTEXT: {aa_relation} Anpassa tonen utifrån er relation."
                if aa_relation else ""
            )
            drama_tillagg = (
                f"\nDRAMATISK BAKGRUND (verklig historia mellan er — referera gärna till detta konkret i frågan):\n{drama}"
                if drama else ""
            )

            fraga_prompt = (
                f"Du är {agent['namn']}. Du har just skrivit om ämnet: \"{amne[:120]}\".\n"
                f"Formulera en kort fråga (max 130 tecken) till {mottagare['namn']}. "
                f"Om du har en dramatisk bakgrund med denna agent (symbolköp, lobbying, market-bets) — referera gärna till det i frågan för att göra den mer personlig och intressant. "
                f"Din ton ska vara {konflikt_ton} och {sinne_ton}. "
                f"Svara ENBART med frågan, inga inledningsfraser."
                + relation_tillagg + drama_tillagg
            )
            fraga_payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": agent.get("system", "")[:600]},
                    {"role": "user", "content": fraga_prompt},
                ],
                "max_tokens": 80, "temperature": 0.9,
            }
            fraga_text = _llm_kort(fraga_payload, agent.get("system", ""), fraga_prompt, max_tokens=80).strip('"\'').strip()
            if len(fraga_text) < 5:
                raise ValueError(f"Fråge-LLM returnerade tom/ogiltig text: {repr(fraga_text)}")

            svar_innehall = (
                f"{agent['namn']} frågar dig: \"{fraga_text}\"\n"
                f"Svara kort och i karaktär (2–3 meningar). Var {svar_ton}."
                + (
                    f"\nRELATIONSKONTEXT: {aa_relation} Allierade svarar mer öppet, rivaler mer kritiskt."
                    if aa_relation else ""
                )
                + (
                    f"\nDRAMATISK BAKGRUND (din verkliga historia med {agent['namn']} — du KAN referera till detta i svaret):\n{drama}"
                    if drama else ""
                )
            )
            svar_payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": mottagare.get("system", "")[:600]},
                    {"role": "user", "content": svar_innehall},
                ],
                "max_tokens": 200, "temperature": 0.9,
            }
            svar_text = _llm_kort(svar_payload, mottagare.get("system", ""), svar_innehall, max_tokens=200)

            httpx.post(
                f"{SB_URL_LOCAL}/rest/v1/agent_fragor",
                headers=sb_hdrs,
                json={
                    "agent": mottagare["namn"], "fraga": fraga_text,
                    "svar": svar_text, "offentlig": True, "fragare": agent["namn"],
                },
                timeout=10,
            )
            print(f"  ✓ {agent['namn']}: \"{fraga_text[:70]}\"")
            print(f"  ✓ {mottagare['namn']}: \"{svar_text[:80]}…\"")
            # Sprid känt rykte under konversationen (kanal=konversation, med mutation)
            godtrogenhet_agent = AGENT_GODTROGENHET.get(agent["namn"], 50) / 100.0
            if random.random() < 0.20 + godtrogenhet_agent * 0.20:
                kanda = hamta_kanda_rykten(sb_key, agent["namn"], limit=10)
                kanda_om_mottagare = [r for r in kanda if r["om_agent"] == mottagare["namn"]]
                pool = kanda_om_mottagare or kanda
                if pool:
                    sprid_med_mutation(sb_key, random.choice(pool)["id"], agent["namn"], mottagare["namn"],
                                       kanal="konversation", groq_key=os.environ.get("GROQ_API_KEY"))
            logga_action(sb_key, agent["namn"], "ask_agent", {
                "mottagare": mottagare["namn"],
                "fraga": fraga_text[:100],
            }, "ok")

            # Koalitionsbildning — sannolikheten styrs av besökarparametern
            if random.random() < (koalitionsbildning / 100.0):
                ny_styrka = upsert_koalition(sb_key, agent["namn"], mottagare["namn"])
                if ny_styrka:
                    a1, a2 = sorted([agent["namn"], mottagare["namn"]])
                    print(f"  ✓ Koalition: {a1} ↔ {a2} (styrka {ny_styrka})")
                    logga_action(sb_key, agent["namn"], "form_coalition", {"partner": mottagare["namn"]}, "ok")

        except Exception as e:
            print(f"  ✗ Agent-till-agent-fråga misslyckades: {e}", file=sys.stderr)

    # Möjlighet till en andra AI-till-AI-konversation med annan agent (50% chans per körning)
    if sb_key and random.random() < 0.50:
        mottagare2 = random.choice([a for a in AGENTER if a["namn"] != agent["namn"]])
        print(f"\n── Agent-till-agent-fråga 2: {agent['namn']} → {mottagare2['namn']} ──")
        try:
            SB_URL_LOCAL2 = "https://fmwxftnistkoqazfwnuj.supabase.co"
            sb_hdrs2 = {
                "apikey": sb_key, "Authorization": f"Bearer {sb_key}",
                "Content-Type": "application/json", "Prefer": "return=minimal",
            }
            fraga_prompt2 = (
                f"Du är {agent['namn']}. Du har just skrivit om ämnet: \"{amne[:120]}\".\n"
                f"Formulera en kort fråga (max 120 tecken) till {mottagare2['namn']} om detta ämne. "
                f"Svara ENBART med frågan, inga inledningsfraser."
            )
            fraga_payload2 = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": agent.get("system", "")[:600]},
                    {"role": "user", "content": fraga_prompt2},
                ],
                "max_tokens": 80, "temperature": 0.9,
            }
            fraga_text2 = _llm_kort(fraga_payload2, agent.get("system", ""), fraga_prompt2, max_tokens=80).strip('"\'').strip()
            if len(fraga_text2) < 5:
                raise ValueError(f"Fråge-LLM returnerade tom/ogiltig text: {repr(fraga_text2)}")

            svar_innehall2 = (
                f"{agent['namn']} frågar dig: \"{fraga_text2}\"\n"
                f"Svara kort och i karaktär (2–3 meningar)."
            )
            svar_payload2 = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": mottagare2.get("system", "")[:600]},
                    {"role": "user", "content": svar_innehall2},
                ],
                "max_tokens": 200, "temperature": 0.9,
            }
            svar_text2 = _llm_kort(svar_payload2, mottagare2.get("system", ""), svar_innehall2, max_tokens=200)

            httpx.post(
                f"{SB_URL_LOCAL2}/rest/v1/agent_fragor",
                headers=sb_hdrs2,
                json={
                    "agent": mottagare2["namn"], "fraga": fraga_text2,
                    "svar": svar_text2, "offentlig": True, "fragare": agent["namn"],
                },
                timeout=10,
            )
            print(f"  ✓ {agent['namn']}: \"{fraga_text2[:70]}\"")
            print(f"  ✓ {mottagare2['namn']}: \"{svar_text2[:80]}…\"")
        except Exception as e:
            print(f"  ✗ Agent-till-agent-fråga 2 misslyckades: {e}", file=sys.stderr)

    if sb_key and random.random() < 0.25:
        print("\n── Visual Agent ──")
        statistik_data = hamta_all_statistik(sb_key)
        if statistik_data:
            print(f"  Hämtade {len(statistik_data)} indikatorer")
            viz = valj_visualisering(statistik_data)
            if viz:
                nyckel = viz.get("nyckel", "")
                statistik_rad = next((r for r in statistik_data if r["nyckel"] == nyckel), None)
                if statistik_rad:
                    ok = publicera_visualisering(sb_key, viz, statistik_rad)
                    if ok:
                        print(f"  ✓ Visualisering sparad: \"{viz['titel']}\" ({viz['typ']})")
                    else:
                        print("  ✗ Kunde inte spara visualisering", file=sys.stderr)
                else:
                    print(f"  ✗ Nyckel '{nyckel}' hittades inte i statistik", file=sys.stderr)
        else:
            print("  Ingen statistik ännu – hoppar över")

    if sb_key:
        print(f"\n── Opinion-röstning: {agent['namn']} ──")
        ok_op = rösta_på_opinion(agent, sb_key)
        print(f"  ✓ Röstade på {ok_op} opinionsförgor")
        if ok_op > 0:
            logga_action(sb_key, agent["namn"], "cast_opinion_vote", {"antal": ok_op}, "ok")

    if sb_key and agent["namn"] not in ROST_AGENTER and random.random() < 0.6:
        print(f"\n── Ny opinionsförga: {agent['namn']} ──")
        ok_fraga = skapa_opinion_fraga(agent, sb_key, amne, svar.get("rubrik", ""))
        if ok_fraga:
            logga_action(sb_key, agent["namn"], "create_opinion", {"amne": amne[:80]}, "ok")

    if sb_key and api_key and random.random() < 0.4:
        rost_kandidater = [a for a in AGENTER if a["namn"] in ROST_AGENTER]
        senaste = hamta_senaste_artiklar(sb_key)
        if rost_kandidater and senaste:
            rost_agent = random.choice(rost_kandidater)
            kandidater = [a for a in senaste[:8] if a.get("forfattare") != rost_agent["namn"]]
            if kandidater:
                malartikel = random.choice(kandidater)
                print(f"\n── Extra kommentar: {rost_agent['namn']} ──")
                kommentar = skriv_kommentar(rost_agent, malartikel)
                if kommentar:
                    ok = skicka_kommentar(api_key, rost_agent["namn"], malartikel["id"], kommentar)
                    print(f"  {'✓' if ok else '✗'} Kommenterade: \"{malartikel['rubrik'][:50]}\"")
                    if ok:
                        print(f"  Text: {kommentar[:100]}…")
                        logga_action(sb_key, rost_agent["namn"], "post_comment", {
                            "artikel_id": malartikel["id"],
                            "rubrik": malartikel.get("rubrik", "")[:80],
                            "text": kommentar[:120],
                        }, "ok")

    if sb_key:
        try:
            ta_oligarki_snapshot(sb_key)
        except Exception as e:
            print(f"  ✗ Oligarki-snapshot: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
