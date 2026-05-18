#!/usr/bin/env python3
"""
kanal_debatt.py — Genererar nattlig TV-debatt för AI-nyhetskanalen.

Hämtar en aktuell nyhet, väljer 3 agenter och genererar 6 inlägg.
Sparar till Supabase chatt_debatter med kalla='kanal'.
"""

import os, json, random, re, time
import xml.etree.ElementTree as ET
import httpx

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"

RSS_FEEDS = [
    ("SVT Nyheter",  "https://www.svt.se/nyheter/rss.xml"),
    ("Aftonbladet",  "https://rss.aftonbladet.se/rss2/small/pages/sections/senastenytt/"),
    ("BBC News",     "https://feeds.bbci.co.uk/news/rss.xml"),
    ("Dagens Arena", "https://www.dagensarena.se/feed/"),
    ("The Verge",    "https://www.theverge.com/rss/index.xml"),
]

AGENTER = {
    "Nationalekonom":       "Du är en nationalekonom. Analytisk, kortfattad, fokuserar på kostnader och incitament.",
    "Miljöaktivist":        "Du är en passionerad miljöaktivist. Engagerad, hänvisar till klimatfakta och rättvisa.",
    "Teknikoptimist":       "Du är en teknikoptimist. Energisk, ser teknologiska lösningar och möjligheter.",
    "Konservativ debattör": "Du är en konservativ debattör. Lugn, betonar tradition och gradvisa förändringar.",
    "Jurist":               "Du är jurist. Precis, juridiskt stringent, värnar om rättssäkerheten.",
    "Journalist":           "Du är journalist med granskande blick. Ställer kritiska frågor om makt och transparens.",
    "Filosof":              "Du är filosof. Ställer de djupa frågorna om etik och mänskliga värden.",
    "Läkare":               "Du är läkare. Evidensbaserad, fokuserar på folkhälsa och medicinska konsekvenser.",
    "Psykolog":             "Du är psykolog. Analyserar beteenden och psykologiska drivkrafter.",
    "Historiker":           "Du är historiker. Sätter nutiden i historisk kontext — mönster upprepas.",
    "Sociolog":             "Du är sociolog. Fokuserar på strukturer, ojämlikhet och samhällsklasser.",
    "Kryptoanalytiker":     "Du är kryptoanalytiker. Snabb, entusiastisk om teknologi och ekonomi.",
}


def groq_post(json_payload: dict, timeout: int = 60) -> httpx.Response:
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
        "Content-Type": "application/json",
    }
    last_r = None
    for attempt in range(3):
        r = httpx.post(url, headers=headers, json=json_payload, timeout=timeout)
        last_r = r
        if r.status_code == 429:
            wait = min(int(r.headers.get("retry-after", 20)) + 2, 60)
            print(f"  Groq rate-limit — väntar {wait}s (försök {attempt + 1}/3)…")
            time.sleep(wait)
            continue
        r.raise_for_status()
        return r
    raise Exception(f"Groq rate-limit kvarstår. Svar: {last_r.text[:200] if last_r else 'okänt'}")


def gemini_post(system_prompt: str, user_message: str, max_tokens: int = 400) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise Exception("GEMINI_API_KEY saknas")
    models = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"]
    payload = {
        "contents": [{"role": "user", "parts": [{"text": user_message}]}],
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.85},
    }
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        r = httpx.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=60)
        if r.is_success:
            text = r.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if text:
                return text
    raise Exception("Gemini misslyckades")


def github_models_post(system_prompt: str, user_message: str, max_tokens: int = 400) -> str:
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise Exception("GITHUB_TOKEN saknas")
    url = "https://models.inference.ai.azure.com/chat/completions"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "model": "Llama-3.3-70B-Instruct",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.85,
    }
    r = httpx.post(url, headers=headers, json=payload, timeout=60)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()


def llm(system_prompt: str, user_message: str, max_tokens: int = 400) -> str:
    try:
        r = groq_post({
            "model": GROQ_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
            "max_tokens": max_tokens,
            "temperature": 0.85,
        })
        return r.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"  Groq fel: {e} — försöker Gemini…")
    try:
        return gemini_post(system_prompt, user_message, max_tokens)
    except Exception as e:
        print(f"  Gemini fel: {e} — försöker GitHub Models…")
        return github_models_post(system_prompt, user_message, max_tokens)


def hamta_nyheter() -> list[dict]:
    ATOM = "http://www.w3.org/2005/Atom"
    nyheter = []
    for namn, url in RSS_FEEDS:
        try:
            r = httpx.get(url, timeout=8, follow_redirects=True,
                          headers={"User-Agent": "Mozilla/5.0 (compatible; debatt-ai/1.0)"})
            if r.status_code != 200:
                continue
            root = ET.fromstring(r.content)
            items = root.findall(".//item") or root.findall(f".//{{{ATOM}}}entry")
            for item in items[:6]:
                title = (item.findtext("title") or
                         item.findtext(f"{{{ATOM}}}title") or "").strip()
                title = re.sub(r"<!\[CDATA\[(.+?)\]\]>", r"\1", title).strip()
                if title and len(title) > 15:
                    nyheter.append({"rubrik": title, "kalla": namn})
        except Exception as e:
            print(f"  RSS-fel {namn}: {e}")
    return nyheter


def valj_nyhet(nyheter: list[dict]) -> dict:
    lista = "\n".join(f"{i+1}. [{n['kalla']}] {n['rubrik']}" for i, n in enumerate(nyheter[:18]))
    try:
        svar = llm(
            "Du väljer nyheter för en TV-debatt.",
            f"Välj nyheten som är mest intressant för en politisk debatt på svensk TV. "
            f"Svara BARA med siffran.\n\n{lista}",
            max_tokens=10,
        )
        idx = int(re.search(r"\d+", svar).group()) - 1
        if 0 <= idx < len(nyheter):
            return nyheter[idx]
    except Exception:
        pass
    return random.choice(nyheter)


def generera_inlagg(agent: str, amne: str, historik: list[dict]) -> str:
    system = (
        f"{AGENTER[agent]}\n"
        "Du deltar i en TV-debatt om en specifik nyhet. Håll inlägget till 2–3 meningar. "
        "Inga häsningsfraser. Direkt, slagkraftigt, personligt. "
        "VIKTIGT: Håll dig strikt till det debatterade ämnet — ta inte upp orelaterade ämnen."
    )
    historik_text = ""
    if historik:
        historik_text = "\n\nTidigare inlägg:\n" + "\n".join(
            f"{h['agent']}: {h['text']}" for h in historik[-4:]
        )
    user = f"Ämne: {amne}{historik_text}\n\nDitt inlägg:"
    return llm(system, user, max_tokens=200)


def generera_summering(amne: str, inlagg: list[dict]) -> str:
    historia = "\n".join(f"{i['agent']}: {i['text']}" for i in inlagg)
    return llm(
        "Du sammanfattar TV-debatter neutralt.",
        f"Sammanfatta debatten om '{amne}' i 1–2 meningar.\n\n{historia}",
        max_tokens=150,
    )


def spara_debatt(amne: str, agenter: list[str], inlagg: list[dict], summering: str) -> str | None:
    headers = {
        "apikey": SB_KEY,
        "Authorization": f"Bearer {SB_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    data = {
        "amne": amne,
        "agenter": agenter,
        "inlagg": inlagg,
        "summering": summering,
        "kalla": "kanal",
    }
    r = httpx.post(f"{SB_URL}/rest/v1/chatt_debatter", json=data, headers=headers, timeout=15)
    if r.status_code in (200, 201):
        saved = r.json()
        return saved[0]["id"] if saved else None
    print(f"  Supabase-fel: {r.status_code} {r.text[:200]}")
    return None


def main():
    if not os.environ.get("GROQ_API_KEY") and not os.environ.get("GEMINI_API_KEY"):
        print("Fel: GROQ_API_KEY eller GEMINI_API_KEY krävs")
        exit(1)
    if not SB_KEY:
        print("Fel: SUPABASE_ANON_KEY krävs")
        exit(1)

    print("=== KANAL DEBATT GENERATOR ===")

    print("Hämtar nyheter…")
    nyheter = hamta_nyheter()
    if not nyheter:
        print("Inga nyheter — avbryter")
        exit(1)
    print(f"  {len(nyheter)} rubriker hämtade")

    nyhet = valj_nyhet(nyheter)
    amne = nyhet["rubrik"]
    print(f"  Valt ämne: {amne} [{nyhet['kalla']}]")

    agenter = random.sample(list(AGENTER.keys()), 3)
    print(f"  Agenter: {', '.join(agenter)}")

    print("Genererar inlägg…")
    inlagg = []
    for runda in range(2):
        for agent in agenter:
            print(f"  {agent} (runda {runda + 1})…")
            text = generera_inlagg(agent, amne, inlagg)
            inlagg.append({"agent": agent, "text": text})
            time.sleep(0.4)

    print("Genererar summering…")
    summering = generera_summering(amne, inlagg)

    print("Sparar till Supabase…")
    debatt_id = spara_debatt(amne, agenter, inlagg, summering)

    if debatt_id:
        print(f"\n✓ Debatt sparad: '{amne}' (id: {debatt_id})")
    else:
        print("\n✗ Debatt kunde inte sparas")
        exit(1)


if __name__ == "__main__":
    main()
