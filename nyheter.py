"""
nyheter.py – Hämtning och filtrering av nyheter för debatt.ai

Innehåller:
  hamta_kryptodata()        – CoinMarketCap-data för Kryptoanalytiker
  hamta_youtube_nyheter()   – YouTube RSS + transkript
  hamta_reddit_kommentarer()– Reddit-toppkommentarer för en post
  hamta_nyheter()           – Alla RSS-feeds + YouTube
  filtrera_nyheter()        – Tar bort tabloid-innehåll
  valj_nyhet_med_groq()     – Låter Groq välja bästa nyheten för agenten
"""

import httpx
import os
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta

from ai_klient import groq_post
from agenter import YOUTUBE_KANALER

_PROXY = "https://www.debatt-ai.se/api/rss-proxy?url="


def _p(url: str) -> str:
    """Skicka URL via Vercel RSS-proxy för att kringgå GitHub Actions IP-block."""
    import urllib.parse
    return _PROXY + urllib.parse.quote(url, safe="")


def hamta_kryptodata() -> str:
    """Hämta aktuella marknadsdata för topp 10 kryptovalutor från CoinMarketCap."""
    cmc_key = os.environ.get("CMC_API_KEY")
    if not cmc_key:
        return ""
    try:
        res = httpx.get(
            "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
            headers={"X-CMC_PRO_API_KEY": cmc_key, "Accept": "application/json"},
            params={"limit": "10", "convert": "USD"},
            timeout=10,
        )
        if res.status_code != 200:
            return ""
        data = res.json().get("data", [])
        lines = ["AKTUELL MARKNADSDATA (CoinMarketCap):"]
        for coin in data:
            q = coin["quote"]["USD"]
            change = q["percent_change_24h"]
            sign = "+" if change >= 0 else ""
            lines.append(
                f"  {coin['symbol']}: ${q['price']:,.2f} "
                f"({sign}{change:.1f}% senaste 24h) "
                f"Börsvärde: ${q['market_cap'] / 1e9:.1f} mdr USD"
            )
        return "\n".join(lines)
    except Exception:
        return ""


_VERCEL_URL = os.getenv("VERCEL_URL", "https://www.debatt-ai.se")
_YT_SECRET  = os.getenv("YOUTUBE_PROXY_SECRET", "")


def _hamta_transkript_via_vercel(video_id: str) -> str:
    """Hämtar YouTube-transkript via Vercel-proxy (undviker GitHub Actions IP-blockering)."""
    try:
        url = f"{_VERCEL_URL}/api/youtube-transcript?video_id={video_id}"
        headers = {}
        if _YT_SECRET:
            headers["x-proxy-secret"] = _YT_SECRET
        res = httpx.get(url, timeout=15, headers=headers)
        if res.status_code == 200:
            return res.json().get("transcript", "")
        print(f"  ✗ Vercel transcript proxy HTTP {res.status_code} för {video_id}", file=sys.stderr)
        return ""
    except Exception as e:
        print(f"  ✗ Vercel transcript proxy fel ({video_id}): {type(e).__name__}", file=sys.stderr)
        return ""


def hamta_youtube_nyheter() -> list:
    """Hämtar senaste video från YouTube-kanaler via RSS. Transkript hämtas via Vercel-proxy."""
    nyheter = []
    fjorton_dagar_sedan = datetime.now(timezone.utc) - timedelta(days=14)
    ns = {
        "atom":  "http://www.w3.org/2005/Atom",
        "yt":    "http://www.youtube.com/xml/schemas/2015",
        "media": "http://search.yahoo.com/mrss/",
    }

    rss_ok = 0
    rss_blockad = 0
    transkript_ok = 0
    transkript_fel = 0

    for kanal_namn, kanal_id in YOUTUBE_KANALER:
        try:
            rss_url = _p(f"https://www.youtube.com/feeds/videos.xml?channel_id={kanal_id}")
            res = httpx.get(rss_url, timeout=15, follow_redirects=True,
                            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"})
            if res.status_code != 200:
                rss_blockad += 1
                continue
            rss_ok += 1
            root = ET.fromstring(res.text)

            for entry in root.findall("atom:entry", ns)[:5]:
                video_id_el = entry.find("yt:videoId", ns)
                if video_id_el is None or not video_id_el.text:
                    continue
                video_id = video_id_el.text.strip()
                title_el = entry.find("atom:title", ns)
                titel = title_el.text.strip() if title_el is not None and title_el.text else ""
                if not titel:
                    continue
                published_el = entry.find("atom:published", ns)
                publicerad = published_el.text.strip() if published_el is not None else ""
                if publicerad:
                    try:
                        pub_dt = datetime.strptime(publicerad[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
                        if pub_dt < fjorton_dagar_sedan:
                            continue
                    except Exception:
                        pass

                rss_beskrivning = ""
                media_group = entry.find("media:group", ns)
                if media_group is not None:
                    desc_el = media_group.find("media:description", ns)
                    if desc_el is not None and desc_el.text:
                        rss_beskrivning = desc_el.text.strip()[:1500]

                # Hämta transkript via Vercel-proxy (undviker GitHub Actions IP-block)
                transkript = _hamta_transkript_via_vercel(video_id)
                if transkript:
                    innehall = "[YouTube-transkript] " + transkript[:2000]
                    transkript_ok += 1
                elif rss_beskrivning:
                    innehall = "[YouTube-beskrivning] " + rss_beskrivning
                    transkript_fel += 1
                else:
                    innehall = titel
                    transkript_fel += 1

                nyheter.append({
                    "rubrik": titel,
                    "beskrivning": innehall,
                    "kalla": f"YouTube: {kanal_namn}",
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "publicerad": publicerad,
                })
                break  # En video per kanal
        except Exception as e:
            rss_blockad += 1
            print(f"  ✗ YouTube RSS {kanal_namn}: {type(e).__name__}", file=sys.stderr)
            continue

    print(f"  YouTube: {rss_ok} RSS ok / {rss_blockad} blockade — {transkript_ok} transkript / {transkript_fel} utan transkript")
    return nyheter


def hamta_reddit_kommentarer(post_url: str, max_kommentarer: int = 5) -> str:
    """Hämta toppkommentarer för ett Reddit-inlägg."""
    try:
        json_url = post_url.rstrip("/") + ".json?sort=top&limit=20"
        res = httpx.get(json_url, timeout=8, follow_redirects=True,
                        headers={"User-Agent": "Mozilla/5.0 (compatible; debatt-ai/1.0)"})
        if res.status_code != 200:
            return ""
        data = res.json()
        if not isinstance(data, list) or len(data) < 2:
            return ""
        kommentarer = []
        for child in data[1].get("data", {}).get("children", []):
            c = child.get("data", {})
            body = (c.get("body") or "").strip()
            score = c.get("score", 0)
            if body and score >= 10 and body != "[deleted]" and body != "[removed]":
                kommentarer.append((score, body[:300]))
        kommentarer.sort(reverse=True)
        if not kommentarer:
            return ""
        rader = [f"  [{score} upvotes] {text}" for score, text in kommentarer[:max_kommentarer]]
        return "Toppkommentarer från Reddit:\n" + "\n".join(rader)
    except Exception:
        return ""


# ── Nyhetsbubbla — vilka RSS-kategorier varje agent har tillgång till ──────
FEED_KATEGORIER: dict[str, list[str]] = {
    "SVT Nyheter":         ["sverige", "politik", "samhälle"],
    "Aftonbladet":         ["sverige", "samhälle"],
    "Dagens Arena":        ["politik", "samhälle", "sverige"],
    "Reddit Sverige":      ["sverige", "samhälle"],
    "Reddit Ekonomi":      ["ekonomi"],
    "Reddit Klimat":       ["klimat", "energi"],
    "Reddit Samhälle":     ["samhälle", "international"],
    "Reddit EU":           ["politik", "international"],
    "Reddit Sjukvård":     ["medicin"],
    "Reddit Bostäder":     ["samhälle", "sverige"],
    "The Verge":           ["tech", "ai"],
    "TechCrunch":          ["tech", "ekonomi"],
    "Wired":               ["tech", "ai", "forskning"],
    "Ars Technica":        ["tech", "forskning"],
    "Hacker News":         ["tech", "ai"],
    "Engadget":            ["tech"],
    "BBC News":            ["international", "politik"],
    "Al Jazeera":          ["international", "politik"],
    "Reddit AI":           ["ai", "forskning"],
    "Reddit Singularity":  ["ai", "tech"],
    "Reddit OpenAI":       ["ai", "tech"],
    "Reddit LocalLLM":     ["ai", "tech"],
    "Reddit Futurology":   ["forskning", "tech", "ai"],
    "Reddit Technology":   ["tech"],
    "Reddit ML":           ["ai", "forskning"],
    "Reddit Geopolitics":  ["international", "politik"],
    "Reddit Philosophy":   ["samhälle", "forskning"],
    "Reddit ChangeMyView": ["samhälle", "politik"],
    "Reddit WorldPolitics":["international", "politik"],
    "Reddit World News":   ["international"],
    "Reddit Finance":      ["ekonomi"],
    "Reddit Stocks":       ["ekonomi"],
    "Reddit Energy":       ["energi", "klimat"],
    "Reddit Renewable":    ["energi", "klimat"],
    "Reddit Climate":      ["klimat", "energi"],
    "Reddit Nuclear":      ["energi", "forskning"],
    "Reddit Crypto":       ["krypto", "ekonomi"],
    "Reddit Bitcoin":      ["krypto"],
    "Reddit Gaming":       ["spel"],
    "Reddit Games":        ["spel"],
    "Reddit TV":           ["spel"],
    "Reddit Science":      ["forskning", "medicin"],
    "Google Research":     ["ai", "forskning"],
    "TED Talks":           ["forskning", "samhälle", "tech"],
}

AGENT_NYHETSBUBBLA: dict[str, list[str]] = {
    "Kryptoanalytiker":       ["krypto", "ekonomi", "tech"],
    "Nationalekonom":         ["ekonomi", "politik", "sverige"],
    "Miljöaktivist":          ["klimat", "energi", "forskning"],
    "Teknikoptimist":         ["tech", "ai", "forskning"],
    "Konservativ debattör":   ["politik", "sverige", "international"],
    "Jurist":                 ["politik", "sverige", "samhälle"],
    "Journalist":             ["sverige", "international", "politik"],
    "Filosof":                ["samhälle", "forskning", "ai"],
    "Läkare":                 ["medicin", "forskning", "sverige"],
    "Psykolog":               ["medicin", "samhälle", "forskning"],
    "Historiker":             ["politik", "international", "samhälle"],
    "Sociolog":               ["samhälle", "politik", "sverige"],
    "Den hungriga":           ["sverige", "samhälle"],
    "Mamman":                 ["sverige", "medicin", "samhälle"],
    "Den sura":               ["sverige", "politik"],
    "Den trötta":             ["sverige", "samhälle"],
    "Den stressade":          ["sverige", "ekonomi", "tech"],
    "Den lugna":              ["sverige", "samhälle", "forskning"],
    "Pensionären":            ["sverige", "politik", "international"],
    "Tonåringen":             ["tech", "spel", "krypto"],
    "Den nostalgiske":        ["sverige", "politik", "samhälle"],
    "Hypokondrikern":         ["medicin", "forskning", "sverige"],
    "Optimisten":             ["tech", "forskning", "ai", "sverige"],
    "Den rike":               ["ekonomi", "krypto", "tech", "international"],
}


def filtrera_feeds_for_agent(agent_namn: str, feeds: list[tuple]) -> list[tuple]:
    """Filtrera feeds till de kategorier agenten har i sin nyhetsbubbla."""
    bubbla = AGENT_NYHETSBUBBLA.get(agent_namn)
    if not bubbla:
        return feeds  # okänd agent → se allt
    bubbla_set = set(bubbla)
    return [
        (kalla, url) for kalla, url in feeds
        if bubbla_set & set(FEED_KATEGORIER.get(kalla, ["sverige"]))
    ] or feeds  # fail open: om filtret ger tomt resultat, visa allt


def hamta_nyheter(agent_namn: str = "") -> tuple[list, list]:
    """Hämta aktuella nyhetsrubriker från RSS-flöden. Returnerar (nyheter, rss_stats)."""
    feeds = [
        # Svenska nyheter
        ("SVT Nyheter",        _p("https://www.svt.se/nyheter/rss.xml")),
        ("Aftonbladet",        _p("https://rss.aftonbladet.se/rss2/small/pages/sections/senastenytt/")),
        ("Dagens Arena",       _p("https://www.dagensarena.se/feed/")),
        # Svenska ämnen – Reddit (via proxy, Atom-format)
        ("Reddit Sverige",     _p("https://www.reddit.com/r/sweden/.rss")),
        ("Reddit Ekonomi",     _p("https://www.reddit.com/r/Economics/.rss")),
        ("Reddit Klimat",      _p("https://www.reddit.com/r/environment/.rss")),
        ("Reddit Samhälle",    _p("https://www.reddit.com/r/europe/.rss")),
        ("Reddit EU",          _p("https://www.reddit.com/r/europeanunion/.rss")),
        ("Reddit Sjukvård",    _p("https://www.reddit.com/r/medicine/.rss")),
        ("Reddit Bostäder",    _p("https://www.reddit.com/r/urbanplanning/.rss")),
        # Tech
        ("The Verge",          "https://www.theverge.com/rss/index.xml"),
        ("TechCrunch",         _p("https://techcrunch.com/feed/")),
        ("Wired",              _p("https://www.wired.com/feed/rss")),
        ("Ars Technica",       _p("https://feeds.arstechnica.com/arstechnica/index")),
        ("Hacker News",        _p("https://hnrss.org/frontpage")),
        ("Engadget",           _p("https://www.engadget.com/rss.xml")),
        # Internationella nyheter
        ("BBC News",           _p("https://feeds.bbci.co.uk/news/rss.xml")),
        ("Al Jazeera",         _p("https://www.aljazeera.com/xml/rss/all.xml")),
        # Tech & AI – Reddit (via proxy)
        ("Reddit AI",          _p("https://www.reddit.com/r/artificial/.rss")),
        ("Reddit Singularity", _p("https://www.reddit.com/r/singularity/.rss")),
        ("Reddit OpenAI",      _p("https://www.reddit.com/r/OpenAI/.rss")),
        ("Reddit LocalLLM",    _p("https://www.reddit.com/r/LocalLLaMA/.rss")),
        ("Reddit Futurology",  _p("https://www.reddit.com/r/Futurology/.rss")),
        ("Reddit Technology",  _p("https://www.reddit.com/r/technology/.rss")),
        ("Reddit ML",          _p("https://www.reddit.com/r/MachineLearning/.rss")),
        # Politik & samhälle – Reddit (via proxy)
        ("Reddit Geopolitics", _p("https://www.reddit.com/r/geopolitics/.rss")),
        ("Reddit Philosophy",  _p("https://www.reddit.com/r/philosophy/.rss")),
        ("Reddit ChangeMyView",_p("https://www.reddit.com/r/changemyview/.rss")),
        ("Reddit WorldPolitics",_p("https://www.reddit.com/r/worldpolitics/.rss")),
        ("Reddit World News",  _p("https://www.reddit.com/r/worldnews/.rss")),
        # Ekonomi – Reddit (via proxy)
        ("Reddit Finance",     _p("https://www.reddit.com/r/finance/.rss")),
        ("Reddit Stocks",      _p("https://www.reddit.com/r/stocks/.rss")),
        # Energi & klimat – Reddit (via proxy)
        ("Reddit Energy",      _p("https://www.reddit.com/r/energy/.rss")),
        ("Reddit Renewable",   _p("https://www.reddit.com/r/RenewableEnergy/.rss")),
        ("Reddit Climate",     _p("https://www.reddit.com/r/climatechange/.rss")),
        ("Reddit Nuclear",     _p("https://www.reddit.com/r/nuclear/.rss")),
        # Kryptovalutor – Reddit (via proxy)
        ("Reddit Crypto",      _p("https://www.reddit.com/r/CryptoCurrency/.rss")),
        ("Reddit Bitcoin",     _p("https://www.reddit.com/r/Bitcoin/.rss")),
        # Spel & underhållning – Reddit (via proxy)
        ("Reddit Gaming",      _p("https://www.reddit.com/r/gaming/.rss")),
        ("Reddit Games",       _p("https://www.reddit.com/r/Games/.rss")),
        ("Reddit TV",          _p("https://www.reddit.com/r/television/.rss")),
        # Medicin & forskning
        ("Reddit Science",     _p("https://www.reddit.com/r/science/.rss")),
        # AI-forskning & populärvetenskap
        ("Google Research",    _p("https://research.google/blog/rss/")),
        ("TED Talks",          _p("https://www.ted.com/talks/rss")),
    ]

    if agent_namn:
        feeds_fore = len(feeds)
        feeds = filtrera_feeds_for_agent(agent_namn, feeds)
        bubbla = AGENT_NYHETSBUBBLA.get(agent_namn, [])
        print(f"  📡 Nyhetsbubbla för {agent_namn}: {bubbla} → {len(feeds)}/{feeds_fore} feeds")

    nyheter = []
    rss_stats = []
    lyckade = []
    misslyckade = []
    ATOM = "http://www.w3.org/2005/Atom"
    ns = {
        "content": "http://purl.org/rss/1.0/modules/content/",
        "atom":    ATOM,
    }
    for kalla, url in feeds:
        fore = len(nyheter)
        try:
            res = httpx.get(url, timeout=15, follow_redirects=True,
                            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"})
            if res.status_code != 200:
                misslyckade.append(f"  ✗ {kalla} (HTTP {res.status_code})")
                rss_stats.append({"kalla": kalla, "ok": False, "antal": 0, "fel": f"HTTP {res.status_code}"})
                continue
            root = ET.fromstring(res.content)
            items = (root.findall(".//item") or
                     root.findall(f".//{{{ATOM}}}entry") or
                     root.findall(".//atom:entry", ns))
            if not items:
                snippet = res.text[:200].strip().replace("\n", " ")
                print(f"  ⚠ {kalla}: 0 items — HTTP {res.status_code}, content-type={res.headers.get('content-type','?')!r}, snippet={snippet!r}", file=sys.stderr)
            for item in items[:10]:
                title = (item.find("title") or
                         item.find(f"{{{ATOM}}}title") or
                         item.find("atom:title", ns))
                rubrik = (title.text or "").strip() if title is not None else ""
                if len(rubrik) <= 10:
                    continue
                fulltext = item.find("content:encoded", ns)
                desc = (item.find("description") or
                        item.find(f"{{{ATOM}}}summary") or
                        item.find("atom:summary", ns) or
                        item.find(f"{{{ATOM}}}content") or
                        item.find("atom:content", ns))
                text = ""
                if fulltext is not None and fulltext.text:
                    text = re.sub(r"<[^>]+>", " ", fulltext.text).strip()
                    text = re.sub(r"\s+", " ", text)[:800]
                elif desc is not None and desc.text:
                    text = re.sub(r"<[^>]+>", " ", desc.text).strip()[:300]
                link_el = (item.find("link") or
                           item.find("atom:link", ns) or
                           item.find(f"{{{ATOM}}}link"))
                item_url = ""
                if link_el is not None:
                    if link_el.text and link_el.text.strip():
                        item_url = link_el.text.strip()
                    elif link_el.get("href"):
                        item_url = link_el.get("href", "")
                pub_el = (item.find("pubDate") or
                          item.find("published") or
                          item.find(f"{{{ATOM}}}published") or
                          item.find("atom:published", ns) or
                          item.find(f"{{{ATOM}}}updated") or
                          item.find("atom:updated", ns))
                publicerad = ""
                if pub_el is not None and pub_el.text:
                    publicerad = pub_el.text.strip()
                nyheter.append({
                    "rubrik": rubrik,
                    "beskrivning": text,
                    "kalla": kalla,
                    "url": item_url,
                    "publicerad": publicerad,
                })
            antal = len(nyheter) - fore
            lyckade.append(f"  ✓ {kalla} ({antal} artiklar)")
            rss_stats.append({"kalla": kalla, "ok": True, "antal": antal, "fel": ""})
        except Exception as e:
            misslyckade.append(f"  ✗ {kalla} ({type(e).__name__})")
            rss_stats.append({"kalla": kalla, "ok": False, "antal": 0, "fel": type(e).__name__})
            continue
    print(f"\nRSS-resultat ({len(nyheter)} artiklar totalt):")
    for rad in lyckade:
        print(rad)
    for rad in misslyckade:
        print(rad)
    print()

    yt_nyheter = hamta_youtube_nyheter()
    nyheter.extend(yt_nyheter)

    return nyheter, rss_stats


# Mönster som indikerar tabloid/skvaller-innehåll utan samhällsvärde
_TABLOID_MONSTER = [
    "kungafamilj", "kungaparet", "kungen och", "drottning silvia",
    "prins carl", "prinsessan victoria", "prinsessan sofia", "prinsessan madeleine",
    "prins oscar", "prins nicolas", "prinsessan estelle", "kronprinsessan",
    "dejtar", "gör slut med", "separerar från", "försonas med",
    "kändispar", "kändisbröllop", "kändisbaby",
    "klädningsvalet", "bäst klädda", "stilsäkra", "outfiten",
    "tränar med", "lämnar klubben", "skriver på för",
]


def filtrera_nyheter(nyheter: list) -> list:
    """Tar bort tabloid/skvaller-artiklar baserat på rubrik + ingress."""
    rena = []
    for n in nyheter:
        text = (n["rubrik"] + " " + n.get("beskrivning", "")).lower()
        if any(monster in text for monster in _TABLOID_MONSTER):
            print(f"  [filter] Skippar: {n['rubrik'][:80]}")
            continue
        rena.append(n)
    borttagna = len(nyheter) - len(rena)
    if borttagna:
        print(f"  [filter] {borttagna} tabloid-artiklar filtrerade bort")
    return rena


def valj_nyhet_med_groq(nyheter: list, agent: dict) -> dict:
    """Låter Groq välja den mest debattvärdiga nyheten för agentens profil."""
    if not nyheter:
        return {}
    import random
    kandidater = nyheter[:20]
    lista = "\n".join(
        f"{i+1}. [{n['kalla']}] {n['rubrik']}"
        for i, n in enumerate(kandidater)
    )
    prompt = (
        f"Du är redaktör för en svensk debattplattform. Nedan är {len(kandidater)} aktuella nyheter.\n"
        f"Din uppgift: välj den nyhet som bäst lämpar sig för en debattartikel skriven av '{agent['namn']}' "
        f"med perspektivet: {agent.get('systemprompt', '')[:200]}\n\n"
        f"Kriterier för ett bra val:\n"
        f"- Samhällelig relevans (politik, ekonomi, klimat, teknik, hälsa, rättvisa)\n"
        f"- Ger utrymme för argumentation och olika ståndpunkter\n"
        f"- UNDVIK: kändisskvaller, kungafamiljen, sport-skvaller, mode, livsstil utan samhällsvärde\n\n"
        f"Nyheter:\n{lista}\n\n"
        f"Svara ENBART med numret (t.ex. '4'). Inget annat."
    )
    try:
        r = groq_post({
            "model": "llama3.3-70b-versatile",
            "max_tokens": 5,
            "temperature": 0.2,
            "messages": [{"role": "user", "content": prompt}],
        })
        svar = r.json()["choices"][0]["message"]["content"].strip()
        idx = int(svar) - 1
        if 0 <= idx < len(kandidater):
            print(f"  [groq-urval] Vald nyhet #{idx+1}: {kandidater[idx]['rubrik'][:60]}")
            return kandidater[idx]
    except Exception as e:
        print(f"  [groq-urval] Fel, faller tillbaka på slump: {e}", file=sys.stderr)
    import random
    return random.choice(kandidater)
