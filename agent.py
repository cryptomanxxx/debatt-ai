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

import random
import os
import sys
from datetime import datetime, timezone

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
    skriv_artikel, skriv_artikel_om_nyhet, skriv_replik,
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
)


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

        print("Skriver replik (Groq med Gemini-fallback)...")
        artikel = skriv_replik(agent, original)

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

        rss_stats = []
        if not force_eget:
            print("Hämtar aktuella nyheter från RSS...")
            nyheter, rss_stats = hamta_nyheter()
            nyheter = filtrera_nyheter(nyheter)
            random.shuffle(nyheter)
            if nyheter and (force_nyhet or random.random() < 0.5):
                nyhet = valj_nyhet_med_groq(nyheter, agent)
                if nyhet and "reddit.com" in nyhet.get("url", ""):
                    kommentarer = hamta_reddit_kommentarer(nyhet["url"])
                    if kommentarer:
                        nyhet["beskrivning"] = (nyhet.get("beskrivning") or "") + "\n\n" + kommentarer

        nyhetskalla = None
        artikelfmt = valj_format()

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
            print("Skriver artikel (Groq med Gemini-fallback)...")
            artikel = skriv_artikel(agent, amne, extra_kontext, fmt=artikelfmt)
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
            print("Skriver artikel om aktuell nyhet (Groq med Gemini-fallback)...")
            artikel = skriv_artikel_om_nyhet(agent, nyhet, extra_kontext, fmt=artikelfmt)
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
            print("Skriver artikel (Groq med Gemini-fallback)...")
            artikel = skriv_artikel(agent, amne, extra_kontext, fmt=artikelfmt)

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
            kommentar_text = skriv_kommentar(agent, original)
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
                    ok = spara_bet(sb_key, market["id"], agent["namn"], sannolikhet, motivering)
                    status = "✓" if ok else "✗"
                    print(f"  {status} {agent['namn']}: {sannolikhet}% — {motivering[:80]}")
                    if ok:
                        logga_action(sb_key, agent["namn"], "cast_market_bet", {
                            "market_id": market["id"],
                            "titel": market.get("titel", "")[:80],
                            "sannolikhet": sannolikhet,
                        }, f"{sannolikhet}%")

    if sb_key and agent["namn"] not in ROST_AGENTER and random.random() < 0.2:
        print(f"\n── Market-förslag: {agent['namn']} ──")
        ok_mf = skapa_market_forslag(agent, sb_key, amne)
        if ok_mf:
            logga_action(sb_key, agent["namn"], "create_market_draft", {"amne": amne[:80]}, "föreslagen")

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


if __name__ == "__main__":
    main()
