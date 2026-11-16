#!/usr/bin/env python3
"""
kanal_debatt.py — Genererar nattlig TV-debatt för AI-nyhetskanalen.

Hämtar en aktuell nyhet, väljer 3 agenter och genererar 6 inlägg.
Sparar till Supabase chatt_debatter med kalla='kanal'.
"""

import os, json, random, re, time
import xml.etree.ElementTree as ET
import httpx

import ai_klient
from ai_klient import hamta_kort_fns_med_trunkering

SB_URL = "https://fmwxftnistkoqazfwnuj.supabase.co"
SB_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
GROQ_MODEL = "openai/gpt-oss-120b"

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


MODELL_PER_PROVIDER = {
    "groq": GROQ_MODEL, "mistral": "codestral-latest", "deepseek": "deepseek-chat",
    "cloudflare": "llama-3.3-70b", "gemini": "gemini-3.5-flash",
}


def _ser_avklippt_ut(text: str) -> bool:
    return not re.search(r"[.!?…][”\"')\]]*\s*$", text.strip())


def llm_med_info(system_prompt: str, user_message: str, max_tokens: int = 400,
                 kraver_hel_mening: bool = True) -> dict:
    """Provar providers i rankad ordning. Ett svar som providern rapporterar som
    avklippt (finish_reason == "length") eller som slutar mitt i en mening hoppas
    över till nästa provider. Hittas inget helt svar används det bästa som fanns.
    Returnerar {text, provider, modell, forsok, avhugget}."""
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_message},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.85,
        # gpt-oss lägger annars en del av max_tokens på dolt resonemang (✅157)
        "reasoning_effort": "low",
    }
    reserv = None
    forsok = 0
    for namn, fn in hamta_kort_fns_med_trunkering(payload, system_prompt, user_message, max_tokens, source="kanal_debatt"):
        forsok += 1
        try:
            text, trunkerad = fn()
        except Exception as e:
            print(f"  {namn} fel: {e}")
            continue
        if not text:
            continue
        provider = namn.lower()
        modell = MODELL_PER_PROVIDER.get(provider, provider)
        if provider == "gemini":
            modell = ai_klient.senaste_gemini_modell or modell
        info = {"text": text, "provider": provider, "modell": modell, "forsok": forsok}
        if trunkerad or (kraver_hel_mening and _ser_avklippt_ut(text)):
            print(f"  {namn}: svaret ser avklippt ut — provar nästa")
            if reserv is None:
                reserv = {**info, "avhugget": True}
            continue
        return info
    return reserv or {"text": "", "provider": None, "modell": None, "forsok": forsok}


def llm(system_prompt: str, user_message: str, max_tokens: int = 400) -> str:
    return llm_med_info(system_prompt, user_message, max_tokens, kraver_hel_mening=False)["text"]


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


def generera_inlagg(agent: str, amne: str, historik: list[dict]) -> dict:
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
    return llm_med_info(system, user, max_tokens=900)


def generera_summering(amne: str, inlagg: list[dict]) -> dict:
    historia = "\n".join(f"{i['agent']}: {i['text']}" for i in inlagg)
    return llm_med_info(
        "Du sammanfattar TV-debatter neutralt.",
        f"Sammanfatta debatten om '{amne}' i 1–2 meningar.\n\n{historia}",
        max_tokens=600,
    )


def spara_debatt(amne: str, agenter: list[str], inlagg: list[dict], summering: str,
                 summering_modell: str | None = None) -> str | None:
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
    if summering_modell:
        data["summering_modell"] = summering_modell
    r = httpx.post(f"{SB_URL}/rest/v1/chatt_debatter", json=data, headers=headers, timeout=15)
    if r.status_code in (200, 201):
        saved = r.json()
        return saved[0]["id"] if saved else None
    print(f"  Supabase-fel: {r.status_code} {r.text[:200]}")
    return None


def main():
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
            info = generera_inlagg(agent, amne, inlagg)
            post = {"agent": agent, "text": info["text"]}
            for falt in ("provider", "modell", "forsok", "avhugget"):
                if info.get(falt):
                    post[falt] = info[falt]
            inlagg.append(post)
            time.sleep(0.4)

    print("Genererar summering…")
    sum_info = generera_summering(amne, inlagg)
    summering = sum_info["text"]
    summering_modell = (f"{sum_info['provider']} · {sum_info['modell']}"
                        if sum_info.get("provider") else None)

    print("Sparar till Supabase…")
    debatt_id = spara_debatt(amne, agenter, inlagg, summering, summering_modell)

    if debatt_id:
        print(f"\n✓ Debatt sparad: '{amne}' (id: {debatt_id})")
    else:
        print("\n✗ Debatt kunde inte sparas")
        exit(1)


if __name__ == "__main__":
    main()
