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

import html
import httpx
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta

from ai_klient import hamta_kort_fns
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

# app/api/youtube-transcript/route.js svarar 401 av två olika, urskiljbara
# anledningar (se dess källa: `!SECRET || secret !== SECRET`) — och vilken av
# dem det är pekar ut EXAKT var felet ska rättas (GitHub Actions-secrets vs.
# Vercel-miljövariabler). Utan denna åtskillnad var alla 28 videor bara en
# identisk "HTTP 401"-rad, omöjlig att felsöka på utan att gissa. Visas bara
# en gång per körning — inte en gång per video — för att inte dränka loggen.
_yt_401_diagnos_visad = False


def _hamta_transkript_via_vercel(video_id: str) -> str:
    """Hämtar YouTube-transkript via Vercel-proxy (undviker GitHub Actions IP-blockering)."""
    global _yt_401_diagnos_visad
    try:
        url = f"{_VERCEL_URL}/api/youtube-transcript?video_id={video_id}"
        headers = {}
        if _YT_SECRET:
            headers["x-proxy-secret"] = _YT_SECRET
        res = httpx.get(url, timeout=15, headers=headers)
        if res.status_code == 200:
            return res.json().get("transcript", "")
        if res.status_code == 401 and not _yt_401_diagnos_visad:
            _yt_401_diagnos_visad = True
            if not _YT_SECRET:
                print(
                    "  ⚠ YOUTUBE_PROXY_SECRET är TOM i denna GitHub Actions-körning "
                    "— inget x-proxy-secret-anrop skickas alls, så "
                    "/api/youtube-transcript avvisar varje anrop per definition. "
                    "Fix: lägg till/kontrollera secreten YOUTUBE_PROXY_SECRET under "
                    "GitHub → repo Settings → Secrets and variables → Actions.",
                    file=sys.stderr,
                )
            else:
                print(
                    "  ⚠ YOUTUBE_PROXY_SECRET skickades men avvisades (401) — "
                    "värdet i GitHub Actions-secreten matchar INTE "
                    "YOUTUBE_PROXY_SECRET i Vercels miljövariabler (eller så "
                    "saknas den där helt). Fix: synka exakt samma värde på båda "
                    "ställen — GitHub → repo Settings → Secrets and variables → "
                    "Actions → YOUTUBE_PROXY_SECRET, och Vercel → Project → "
                    "Settings → Environment Variables → YOUTUBE_PROXY_SECRET.",
                    file=sys.stderr,
                )
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


def _forsta_traff(*element):
    """Returnerar första icke-None elementet i `element`.

    xml.etree.ElementTree.Element har en föråldrad __bool__ som är False
    för alla element UTAN barn-element — vilket träffar praktiskt taget
    alla <title>/<description>/<link>/<pubDate>-element, eftersom de bara
    innehåller text, inga undertaggar. Ett uttryck som `a or b or c` med
    Element-objekt kastar därför tyst bort ett fullt giltigt, textfyllt
    element och faller vidare till nästa alternativ (eller None) — inte
    "det första som hittades", som avsikten är. Måste jämföra mot None
    explicit istället för att lita på sanningsvärdet."""
    for el in element:
        if el is not None:
            return el
    return None


_ANVANDARAGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"


def _hamta_flode(url: str, kalla: str):
    """GET med ett enda omförsök vid 429 — väntar enligt Retry-After-headern
    (eller en rimlig standard om den saknas/inte är numerisk). Utan detta
    tappar en enskild, tillfällig rate-limit-träff källan helt för hela
    körningen istället för att bara vänta ut den."""
    res = httpx.get(url, timeout=15, follow_redirects=True, headers={"User-Agent": _ANVANDARAGENT})
    if res.status_code == 429:
        try:
            vantetid = min(int(res.headers.get("retry-after", 5)), 20)
        except (TypeError, ValueError):
            vantetid = 5
        print(f"  ⏳ {kalla}: 429, väntar {vantetid}s och försöker igen...")
        time.sleep(vantetid)
        res = httpx.get(url, timeout=15, follow_redirects=True, headers={"User-Agent": _ANVANDARAGENT})
    return res


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
    "arXiv: AI":                  ["ai", "forskning"],
    "arXiv: Machine Learning":    ["ai", "forskning", "tech"],
    "arXiv: Ekonomi":             ["ekonomi", "forskning"],
    "arXiv: Computers & Society": ["tech", "samhälle", "forskning"],
    "arXiv: Robotik":             ["tech", "forskning"],
    # Reddit-gruppernas kategorier = unionen av medlemssubbarnas kategorier
    # ovan (se REDDIT_GRUPPER nedan). Används bara för att avgöra OM en
    # agents nyhetsbubbla ska trigga hämtning av gruppen — varje post
    # taggas om till sin RIKTIGA individuella "kalla" efter fetch, så den
    # faktiska kategorin en post sparas med kommer alltid från raderna ovan.
    "Reddit-grupp: Sverige/samhälle 1":         ["sverige", "samhälle", "international"],
    "Reddit-grupp: Sverige/samhälle 2":         ["politik", "international", "medicin"],
    "Reddit-grupp: Sverige/samhälle 3":         ["samhälle", "sverige"],
    "Reddit-grupp: AI 1":                       ["ai", "forskning", "tech"],
    "Reddit-grupp: AI 2":                       ["ai", "tech"],
    "Reddit-grupp: AI 3":                       ["ai", "forskning"],
    "Reddit-grupp: Tech/vetenskap 1":           ["forskning", "tech", "ai"],
    "Reddit-grupp: Tech/vetenskap 2":           ["forskning", "medicin"],
    "Reddit-grupp: Politik/internationellt 1":  ["international", "politik", "samhälle", "forskning"],
    "Reddit-grupp: Politik/internationellt 2":  ["samhälle", "politik", "international"],
    "Reddit-grupp: Politik/internationellt 3":  ["international"],
    "Reddit-grupp: Ekonomi/krypto 1":           ["ekonomi"],
    "Reddit-grupp: Ekonomi/krypto 2":           ["ekonomi", "krypto"],
    "Reddit-grupp: Ekonomi/krypto 3":           ["krypto"],
    "Reddit-grupp: Energi/klimat 1":            ["klimat", "energi"],
    "Reddit-grupp: Energi/klimat 2":            ["energi", "klimat"],
    "Reddit-grupp: Energi/klimat 3":            ["energi", "forskning"],
    "Reddit-grupp: Spel 1":                     ["spel"],
    "Reddit-grupp: Spel 2":                     ["spel"],
}

# Reddit rate-limitar per HTTP-anrop (inte per subreddit) — 31 separata
# /r/<sub>/.rss-anrop mot samma Vercel-proxy-IP utlöste 429 på ~80% av dem i
# en verklig körning (2026-09-02). Reddits multireddit-syntax
# (r/sub1+sub2+sub3/.rss) hämtar flera subs i EN request. Varje post taggas
# om efter fetch till sin riktiga ursprungliga "kalla" (utläst ur postens
# länk via REDDIT_UNDER_KALLOR) så att kategorisering, agent-nyhetsbubblor
# och källattributionen läsare ser på publicerade artiklar (nyhet["kalla"])
# blir identisk med innan — bara antalet HTTP-anrop minskar.
#
# Codex-fynd (PR #1318, verifierat rimligt): en FEMvägs grupp delar samma
# hopslagna svar (max ~100 poster, se ?limit=100 nedan) INNAN kvoteringen
# (_reddit_grupp_kvoterad, max 10/sub) körs — om en enda medlemssub är mycket
# mer aktiv än de andra kan den fylla hela svaret och trycka undan upp till
# 4 tystare medlemmar helt, eftersom kvoteringen bara kan omfördela poster
# som faktiskt kom med i svaret, inte återskapa poster som aldrig hämtades.
# Reddits .rss-endpoint saknar tillförlitlig cursor-paginering, så en
# vattentät garanti (hämta tills ALLA medlemmar är representerade) är inte
# praktiskt möjlig utan att gå tillbaka till separata anrop per subreddit —
# vilket skulle återinföra 429-problemet detta helt existerar för att lösa.
# Kompromiss: grupper på MAX 2 medlemmar (istället för upp till 5) — det
# begränsar värsta scenariot till "1 tystare medlem kan trängas undan per
# anrop" istället för "upp till 4", till priset av fler HTTP-anrop (31 → 19,
# fortfarande en påtaglig minskning från de ursprungliga 31 som gav 429).
# Ingen matematisk garanti, men en verifierbar övre gräns på skadan.
REDDIT_UNDER_KALLOR: dict[str, str] = {
    "sweden": "Reddit Sverige",
    "economics": "Reddit Ekonomi",
    "environment": "Reddit Klimat",
    "europe": "Reddit Samhälle",
    "europeanunion": "Reddit EU",
    "medicine": "Reddit Sjukvård",
    "urbanplanning": "Reddit Bostäder",
    "artificial": "Reddit AI",
    "singularity": "Reddit Singularity",
    "openai": "Reddit OpenAI",
    "localllama": "Reddit LocalLLM",
    "futurology": "Reddit Futurology",
    "technology": "Reddit Technology",
    "machinelearning": "Reddit ML",
    "geopolitics": "Reddit Geopolitics",
    "philosophy": "Reddit Philosophy",
    "changemyview": "Reddit ChangeMyView",
    "worldpolitics": "Reddit WorldPolitics",
    "worldnews": "Reddit World News",
    "finance": "Reddit Finance",
    "stocks": "Reddit Stocks",
    "energy": "Reddit Energy",
    "renewableenergy": "Reddit Renewable",
    "climatechange": "Reddit Climate",
    "nuclear": "Reddit Nuclear",
    "cryptocurrency": "Reddit Crypto",
    "bitcoin": "Reddit Bitcoin",
    "gaming": "Reddit Gaming",
    "games": "Reddit Games",
    "television": "Reddit TV",
    "science": "Reddit Science",
}

REDDIT_GRUPPER: list[tuple[str, list[str]]] = [
    ("Reddit-grupp: Sverige/samhälle 1",        ["sweden", "europe"]),
    ("Reddit-grupp: Sverige/samhälle 2",        ["europeanunion", "medicine"]),
    ("Reddit-grupp: Sverige/samhälle 3",        ["urbanplanning"]),
    ("Reddit-grupp: AI 1",                      ["artificial", "singularity"]),
    ("Reddit-grupp: AI 2",                      ["OpenAI", "LocalLLaMA"]),
    ("Reddit-grupp: AI 3",                      ["MachineLearning"]),
    ("Reddit-grupp: Tech/vetenskap 1",          ["Futurology", "technology"]),
    ("Reddit-grupp: Tech/vetenskap 2",          ["science"]),
    ("Reddit-grupp: Politik/internationellt 1", ["geopolitics", "philosophy"]),
    ("Reddit-grupp: Politik/internationellt 2", ["changemyview", "worldpolitics"]),
    ("Reddit-grupp: Politik/internationellt 3", ["worldnews"]),
    ("Reddit-grupp: Ekonomi/krypto 1",          ["Economics", "finance"]),
    ("Reddit-grupp: Ekonomi/krypto 2",          ["stocks", "CryptoCurrency"]),
    ("Reddit-grupp: Ekonomi/krypto 3",          ["Bitcoin"]),
    ("Reddit-grupp: Energi/klimat 1",           ["environment", "energy"]),
    ("Reddit-grupp: Energi/klimat 2",           ["RenewableEnergy", "climatechange"]),
    ("Reddit-grupp: Energi/klimat 3",           ["nuclear"]),
    ("Reddit-grupp: Spel 1",                    ["gaming"]),
    ("Reddit-grupp: Spel 2",                    ["Games", "television"]),
]

_REDDIT_SUB_RE = re.compile(r"reddit\.com/r/([A-Za-z0-9_]+)/comments/", re.IGNORECASE)


def _reddit_kalla_for_url(url: str, fallback: str) -> str:
    """Läser ut vilken subreddit en post faktiskt kom ifrån (ur länken) och
    slår upp dess ursprungliga, finkorniga "kalla"-namn. Fallback = gruppens
    egna etikett om subreddit inte kan läsas ut eller inte känns igen."""
    m = _REDDIT_SUB_RE.search(url or "")
    if not m:
        return fallback
    return REDDIT_UNDER_KALLOR.get(m.group(1).lower(), fallback)


def _reddit_grupp_kvoterad(items, ns):
    """Reddits multireddit-RSS interfolierar poster från alla medlemssubs i
    EN tidsordnad lista. Codex-fynd (PR #1318): ett globalt tak på den
    hopslagna listan (t.ex. de första 50 posterna totalt) kan låta en enda
    högaktiv subreddit i gruppen dominera hela taket och tränga ut en
    tystare medlem helt — till skillnad från innan sammanslagningen då
    varje subreddit garanterat fick upp till 10 platser oavsett hur aktiva
    de andra var. Denna pre-pass läser bara ut länken (billigt, ingen full
    parsning) per post, avgör den RIKTIGA ursprungskällan, och behåller max
    10 poster per ursprunglig subreddit — i feedens egen tidsordning —
    INNAN huvudloopens fullständiga per-post-bearbetning körs. Ger samma
    per-källa-rättvisa som innan, bara med 7 HTTP-anrop istället för 31."""
    ATOM = "http://www.w3.org/2005/Atom"
    raknare: dict[str, int] = {}
    behall = []
    for item in items:
        link_el = _forsta_traff(item.find("link"), item.find("atom:link", ns), item.find(f"{{{ATOM}}}link"))
        url = ""
        if link_el is not None:
            if link_el.text and link_el.text.strip():
                url = link_el.text.strip()
            elif link_el.get("href"):
                url = link_el.get("href", "")
        kalla = _reddit_kalla_for_url(url, "?")
        if raknare.get(kalla, 0) >= 10:
            continue
        raknare[kalla] = raknare.get(kalla, 0) + 1
        behall.append(item)
    return behall


# Kategorier för YouTube-källor — nyckeln är kanalnamnet UTAN "YouTube: "-prefixet
# (kalla-fältet från hamta_youtube_nyheter() är formaterat "YouTube: {kanal_namn}",
# så en direkt FEED_KATEGORIER.get(kalla)-slagning missar alltid dessa 28 kanaler).
YOUTUBE_KATEGORIER: dict[str, list[str]] = {
    "SVT":                 ["sverige", "samhälle"],
    "TV4 Nyheterna":       ["sverige", "samhälle"],
    "Expressen":           ["sverige", "samhälle"],
    "Aftonbladet":         ["sverige", "samhälle"],
    "Riksdagen":           ["sverige", "politik"],
    "OpenAI":              ["ai", "tech"],
    "Anthropic":           ["ai", "tech"],
    "Google DeepMind":     ["ai", "tech"],
    "NVIDIA":              ["ai", "tech"],
    "Lex Fridman":         ["ai", "forskning", "samhälle"],
    "Two Minute Papers":   ["ai", "forskning"],
    "Fireship":            ["tech"],
    "Isaac Arthur":        ["forskning", "tech"],
    "ColdFusion":          ["tech", "forskning"],
    "Kurzgesagt":          ["forskning", "samhälle"],
    "Sabine Hossenfelder": ["forskning"],
    "BBC News":            ["international", "politik"],
    "DW News":             ["international", "politik"],
    "Reuters":             ["international", "politik"],
    "Associated Press":    ["international", "politik"],
    "Patrick Boyle":       ["ekonomi"],
    "Economics Explained": ["ekonomi"],
    "Bloomberg Originals": ["ekonomi"],
    "The Economist":       ["ekonomi", "politik", "international"],
    "TED":                 ["forskning", "samhälle", "tech"],
    "Engadget":            ["tech"],
    "The Verge":           ["tech", "ai"],
    "Forbes":              ["ekonomi", "tech"],
}


def hamta_kategorier(kalla: str) -> list[str]:
    """Slår upp kategorier för en källa — hanterar både RSS-flöden (FEED_KATEGORIER)
    och YouTube-kanaler (YOUTUBE_KATEGORIER, nyckel utan "YouTube: "-prefix)."""
    if kalla.startswith("YouTube: "):
        return YOUTUBE_KATEGORIER.get(kalla[len("YouTube: "):], [])
    return FEED_KATEGORIER.get(kalla, [])


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
        if bubbla_set & set(hamta_kategorier(kalla) or ["sverige"])
    ] or feeds  # fail open: om filtret ger tomt resultat, visa allt


def hamta_nyheter(agent_namn: str = "") -> tuple[list, list]:
    """Hämta aktuella nyhetsrubriker från RSS-flöden. Returnerar (nyheter, rss_stats)."""
    feeds = [
        # Svenska nyheter
        ("SVT Nyheter",        _p("https://www.svt.se/nyheter/rss.xml")),
        ("Aftonbladet",        _p("https://rss.aftonbladet.se/rss2/small/pages/sections/senastenytt/")),
        ("Dagens Arena",       _p("https://www.dagensarena.se/feed/")),
        # Reddit — 7 grupperade multi-subreddit-flöden istället för 31
        # separata anrop (se REDDIT_GRUPPER ovan i filen). Varje post taggas
        # om till sin riktiga individuella källa efter fetch.
        *[(label, _p(f"https://www.reddit.com/r/{'+'.join(subs)}/.rss?limit=100")) for label, subs in REDDIT_GRUPPER],
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
        # AI-forskning & populärvetenskap
        ("Google Research",    _p("https://research.google/blog/rss/")),
        ("TED Talks",          _p("https://www.ted.com/talks/rss")),
        # arXiv — riktiga vetenskapliga papers (rubrik + abstract), inte bara
        # nyhetsrapportering om forskning. Litet startset, kan utökas efter
        # hur volym och kvalitet ser ut i praktiken.
        ("arXiv: AI",                  _p("https://rss.arxiv.org/rss/cs.AI")),
        ("arXiv: Machine Learning",    _p("https://rss.arxiv.org/rss/cs.LG")),
        ("arXiv: Ekonomi",             _p("https://rss.arxiv.org/rss/econ.GN")),
        ("arXiv: Computers & Society", _p("https://rss.arxiv.org/rss/cs.CY")),
        ("arXiv: Robotik",             _p("https://rss.arxiv.org/rss/cs.RO")),
    ]

    if agent_namn:
        feeds_fore = len(feeds)
        feeds = filtrera_feeds_for_agent(agent_namn, feeds)
        bubbla = AGENT_NYHETSBUBBLA.get(agent_namn, [])
        print(f"  📡 Nyhetsbubbla för {agent_namn}: {bubbla} → {len(feeds)}/{feeds_fore} feeds")

    # En Reddit-grupp hämtas så fort NÅGON medlem matchar agentens bubbla
    # (unionskategorierna i FEED_KATEGORIER ovan) — men enskilda poster i
    # samma grupp kan komma från en annan medlem som INTE matchar. Detta
    # efterfiltrerar per post (bara för Reddit-grupper, se nedan) så att
    # bubbel-precisionen blir identisk med innan gruppindelningen infördes.
    # Tom mängd = inget filter, exakt som `filtrera_feeds_for_agent()`s eget
    # fail-open för agent_namn="" eller en okänd agent.
    _agent_bubbla_set = set(AGENT_NYHETSBUBBLA.get(agent_namn, [])) if agent_namn else set()

    nyheter = []
    rss_stats = []
    lyckade = []
    misslyckade = []
    ATOM = "http://www.w3.org/2005/Atom"
    ns = {
        "content": "http://purl.org/rss/1.0/modules/content/",
        "atom":    ATOM,
    }
    for i, (kalla, url) in enumerate(feeds):
        if i > 0:
            # Kort paus mellan varje flöde — utan den avfyras ~45 anrop mot en
            # handfull olika värdar inom loppet av några sekunder, vilket i
            # praktiken triggar burst-baserade rate limits. En sekvens av
            # riktiga användarbesök hade aldrig sett ut så här. reddit.com får
            # en längre paus — ~25 av de här flödena går mot samma värd, så
            # 0,3s räckte inte för att undvika 429 på en stor andel av dem.
            time.sleep(1.2 if kalla.startswith("Reddit") else 0.3)
        fore = len(nyheter)
        try:
            res = _hamta_flode(url, kalla)
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
            # Reddit-grupper: kvotera per ursprunglig subreddit (max 10 var,
            # se _reddit_grupp_kvoterad) istället för att bara klippa av den
            # hopslagna listan — annars kan en enda aktiv medlemssub tränga
            # ut en tystare helt. Övriga feeds: oförändrat items[:10].
            valda_items = _reddit_grupp_kvoterad(items, ns) if kalla.startswith("Reddit-grupp:") else items[:10]
            for item in valda_items:
                title = _forsta_traff(item.find("title"),
                                       item.find(f"{{{ATOM}}}title"),
                                       item.find("atom:title", ns))
                rubrik = re.sub(r"\s+", " ", html.unescape(title.text or "")).strip() if title is not None else ""
                if len(rubrik) <= 10:
                    continue
                fulltext = item.find("content:encoded", ns)
                desc = _forsta_traff(item.find("description"),
                                      item.find(f"{{{ATOM}}}summary"),
                                      item.find("atom:summary", ns),
                                      item.find(f"{{{ATOM}}}content"),
                                      item.find("atom:content", ns))
                # Ordning spelar roll: HTML-entiteter (&#32;, &amp; m.fl.) avkodas FÖRE
                # whitespace-hopfällningen (en avkodad &#32; blir ett nytt mellanslag som
                # annars aldrig fälls ihop) och FÖRE truncation (annars kan en entitet
                # klippas av mitt i och lämnas som en trasig rest i texten).
                text = ""
                if fulltext is not None and fulltext.text:
                    text = re.sub(r"<[^>]+>", " ", fulltext.text)
                    text = re.sub(r"\s+", " ", html.unescape(text)).strip()[:800]
                elif desc is not None and desc.text:
                    text = re.sub(r"<[^>]+>", " ", desc.text)
                    text = re.sub(r"\s+", " ", html.unescape(text)).strip()[:300]
                # Reddits RSS-beskrivning för länk-inlägg (till skillnad från text-inlägg)
                # innehåller aldrig ett riktigt utdrag — bara ett genererat "submitted by
                # /u/x [link] [comments]"-fotnot (kan lokaliseras till andra språk beroende
                # på Reddits svar). Rent brus utan informationsvärde — töm den istället.
                if kalla.startswith("Reddit") and re.fullmatch(r"submitted by\s+/?u/\S+\s*\[link\]\s*\[\w+\]", text, re.IGNORECASE):
                    text = ""
                # arXiv:s beskrivning inleds med metadata-brus ("arXiv:2501.12345v1
                # Announce Type: new") innan själva abstractet — klipp bort allt
                # fram till "Abstract:" om det finns, annars lämna texten orörd.
                if kalla.startswith("arXiv"):
                    text = re.sub(r"^.*?Abstract:\s*", "", text, count=1, flags=re.IGNORECASE | re.DOTALL)
                link_el = _forsta_traff(item.find("link"),
                                         item.find("atom:link", ns),
                                         item.find(f"{{{ATOM}}}link"))
                item_url = ""
                if link_el is not None:
                    if link_el.text and link_el.text.strip():
                        item_url = link_el.text.strip()
                    elif link_el.get("href"):
                        item_url = link_el.get("href", "")

                item_kalla = kalla
                if kalla.startswith("Reddit-grupp:"):
                    item_kalla = _reddit_kalla_for_url(item_url, kalla)
                    if _agent_bubbla_set and not (_agent_bubbla_set & set(hamta_kategorier(item_kalla) or ["sverige"])):
                        continue

                pub_el = _forsta_traff(item.find("pubDate"),
                                        item.find("published"),
                                        item.find(f"{{{ATOM}}}published"),
                                        item.find("atom:published", ns),
                                        item.find(f"{{{ATOM}}}updated"),
                                        item.find("atom:updated", ns))
                publicerad = ""
                if pub_el is not None and pub_el.text:
                    publicerad = pub_el.text.strip()
                nyheter.append({
                    "rubrik": rubrik,
                    "beskrivning": text,
                    "kalla": item_kalla,
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
    payload = {
        "model": "openai/gpt-oss-120b",
        "max_tokens": 5,
        "temperature": 0.2,
        "messages": [{"role": "user", "content": prompt}],
    }
    for _name, fn in hamta_kort_fns(payload, "", prompt, 5, source="nyhetsurval"):
        try:
            svar = fn()
            idx = int(svar) - 1
            if 0 <= idx < len(kandidater):
                print(f"  [{_name}-urval] Vald nyhet #{idx+1}: {kandidater[idx]['rubrik'][:60]}")
                return kandidater[idx]
        except Exception as e:
            print(f"  [{_name}-urval] Fel: {e}", file=sys.stderr)
    import random
    return random.choice(kandidater)
