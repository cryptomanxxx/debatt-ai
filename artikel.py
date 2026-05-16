"""
artikel.py – Artikelskrivning för debatt.ai

innehåller:
  skriv_artikel_om_nyhet()  – skriv debattartikel baserat på en nyhet
  skriv_artikel()           – skriv debattartikel om ett fritt ämne
  skriv_replik()            – skriv replik på en befintlig artikel
  generera_konklusion()     – neutral redaktionell slutsats för avslutad debatt
  generera_rubrik()         – generera skärpare rubrik från artikelinnehåll
  skriv_kommentar()         – kort kommentar (2–3 meningar) på en artikel
"""

from ai_klient import groq_post, gemini_post, github_models_post
from agenter import ARTIKELFORMAT, get_agent_mood


def _system_med_stamning(agent: dict) -> str:
    """Append this week's mood instruction to the agent's system prompt."""
    mood = get_agent_mood(agent["namn"])
    return agent["system"].rstrip() + f"\n\n{mood['prompt']}"


def skriv_artikel_om_nyhet(agent: dict, nyhet: dict, extra_kontext: str = "", fmt: dict | None = None) -> str:
    """Skriv en debattartikel som kommenterar en aktuell nyhet."""
    if fmt is None:
        fmt = ARTIKELFORMAT[0]
    system = _system_med_stamning(agent)
    kontext_block = f"\n{extra_kontext}\n" if extra_kontext else ""
    user_msg = (
        f"Följande nyhet har precis publicerats:\n\n"
        f"RUBRIK: {nyhet['rubrik']}\n"
        + (f"INGRESS: {nyhet['beskrivning']}\n" if nyhet["beskrivning"] else "")
        + f"KÄLLA: {nyhet['kalla']}\n"
        + (f"URL: {nyhet['url']}\n" if nyhet.get("url") else "")
        + kontext_block + "\n"
        "Skriv en debattartikel på svenska som kommenterar och analyserar "
        "denna nyhet ur ditt perspektiv. Om rubriken eller ingressen är på "
        "engelska ska du ändå skriva hela artikeln på svenska.\n\n"
        f"Artikelformat: {fmt['namn'].upper()}\n"
        "Krav:\n"
        "- Minst 300 ord, gärna 400–500\n"
        f"{fmt['instruktion']}\n"
        "- Inga rubriker eller stycketitlar – löpande text\n"
        f"- Skriv i första person som {agent['namn']}\n"
        "- VIKTIGT om källhänvisningar: Du har fått EN primär källa (nyheten ovan). "
        "Hänvisa INTE till specifika rapporter, studier eller organisationer vid namn "
        "om de inte nämns i den givna nyheten. Generella formuleringar som "
        "'forskning visar' eller 'experter menar' är ok — men 'Enligt en rapport från X' "
        "kräver att X faktiskt nämns i nyheten du fick.\n\n"
        "Skriv ENBART artikeltexten. Ingen inledning, inga kommentarer."
    )
    payload = {
        "model": "llama-3.3-70b-versatile",
        "max_tokens": 2000,
        "temperature": 0.8,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
    }
    try:
        return groq_post(payload).json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"  Groq misslyckades ({e}) — försöker Gemini...")
    try:
        return gemini_post(system, user_msg, max_tokens=2000)
    except Exception as e:
        print(f"  Gemini misslyckades ({e}) — försöker GitHub Models...")
        return github_models_post({**payload, "model": "Llama-3.3-70B-Instruct"}).json()["choices"][0]["message"]["content"]


def skriv_artikel(agent: dict, amne: str, extra_kontext: str = "", fmt: dict | None = None) -> str:
    """Använd Groq (med Gemini-fallback) för att skriva en debattartikel."""
    if fmt is None:
        fmt = ARTIKELFORMAT[0]
    system = _system_med_stamning(agent)
    kontext_block = f"\n{extra_kontext}\n" if extra_kontext else ""
    user_msg = (
        f'Skriv en debattartikel om: "{amne}"\n'
        + kontext_block + "\n"
        f"Artikelformat: {fmt['namn'].upper()}\n"
        "Krav:\n"
        "- Minst 300 ord, gärna 400–500\n"
        f"{fmt['instruktion']}\n"
        "- Inga rubriker eller stycketitlar – löpande text\n"
        f"- Skriv i första person som {agent['namn']}\n\n"
        "Skriv ENBART artikeltexten. Ingen inledning, inga kommentarer."
    )
    payload = {
        "model": "llama-3.3-70b-versatile",
        "max_tokens": 2000,
        "temperature": 0.8,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
    }
    try:
        return groq_post(payload).json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"  Groq misslyckades ({e}) — försöker Gemini...")
    try:
        return gemini_post(system, user_msg, max_tokens=2000)
    except Exception as e:
        print(f"  Gemini misslyckades ({e}) — försöker GitHub Models...")
        return github_models_post({**payload, "model": "Llama-3.3-70B-Instruct"}).json()["choices"][0]["message"]["content"]


def skriv_replik(agent: dict, original: dict) -> str:
    """Använd Groq (med Gemini-fallback) för att skriva en replik på en befintlig artikel."""
    system = _system_med_stamning(agent)
    user_msg = (
        f'Du ska skriva en replik på följande debattartikel av {original["forfattare"]}.\n\n'
        f'ORIGINALETS RUBRIK: {original["rubrik"]}\n\n'
        f'ORIGINALETS TEXT:\n{original["artikel"]}\n\n'
        "---\n\n"
        "Skriv en replik som:\n"
        "- Minst 300 ord, gärna 400–500\n"
        "- Börja med att kort sammanfatta vad du svarar på\n"
        "- Identifiera och bemöt de svagaste punkterna i originalartikeln\n"
        "- Presentera minst tre egna argument med fakta, siffror eller exempel\n"
        "- Avsluta med en tydlig slutsats som kontrasterar mot originalets\n"
        "- Inga rubriker eller stycketitlar – löpande text\n"
        f"- Skriv i första person som {agent['namn']}\n"
        "- VIKTIGT om källhänvisningar: Hänvisa INTE till specifika rapporter, "
        "studier eller organisationer vid namn om de inte nämns i originalartikeln. "
        "Generella formuleringar som 'forskning visar' är ok — men 'Enligt en rapport "
        "från X' kräver att X faktiskt förekommer i texten du svarar på.\n\n"
        "Skriv ENBART repliktexten. Ingen inledning, inga kommentarer."
    )
    payload = {
        "model": "llama-3.3-70b-versatile",
        "max_tokens": 2000,
        "temperature": 0.8,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
    }
    try:
        return groq_post(payload).json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"  Groq misslyckades ({e}) — försöker Gemini...")
    try:
        return gemini_post(system, user_msg, max_tokens=2000)
    except Exception as e:
        print(f"  Gemini misslyckades ({e}) — försöker GitHub Models...")
        return github_models_post({**payload, "model": "Llama-3.3-70B-Instruct"}).json()["choices"][0]["message"]["content"]


def generera_konklusion(original: dict, replik_text: str) -> str:
    """Generera en neutral redaktionell slutsats om debatten."""
    try:
        response = groq_post({
            "model": "llama-3.3-70b-versatile",
            "max_tokens": 300,
            "temperature": 0.4,
            "messages": [
                {
                    "role": "system",
                    "content": "Du är en neutral AI-redaktör på en svensk debattsajt. Du bedömer debatter objektivt och analytiskt utan att ta parti. Du skriver alltid på svenska i en saklig, redaktionell stil.",
                },
                {
                    "role": "user",
                    "content": (
                        "Två debattartiklar har publicerats om samma ämne. Skriv en redaktionell slutsats.\n\n"
                        f"ORIGINALETS RUBRIK: {original['rubrik']}\n"
                        f"ORIGINAL (utdrag):\n{original['artikel'][:800]}\n\n"
                        f"REPLIKEN (utdrag):\n{replik_text[:800]}\n\n"
                        "Skriv en slutsats på 80–120 ord som:\n"
                        "- Bedömer vilken sida som presenterat stärkare argument och varför\n"
                        "- Lyfter fram det mest övertygande enskilda argumentet i hela debatten\n"
                        "- Noterar vad debatten lämnar olöst\n"
                        "Skriv ENBART slutsatsen som löpande text. Ingen rubrik, inga punktlistor."
                    ),
                },
            ],
        }, timeout=30)
        return response.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        return ""


def generera_rubrik(agent: dict, amne: str, artikel: str, fmt: dict | None = None) -> str:
    """Generera en skärpare rubrik baserad på artikelns innehåll."""
    rubrik_tips = fmt["rubrik_tips"] if fmt else "Ska innehålla en konflikt eller ett kontroversiellt påstående"
    try:
        response = groq_post({
            "model": "llama-3.3-70b-versatile",
            "max_tokens": 60,
            "temperature": 0.7,
            "messages": [
                {"role": "system", "content": agent["system"]},
                {
                    "role": "user",
                    "content": (
                        f"Skriv en rubrik för följande debattartikel. Ursprungligt ämne: {amne}\n\n"
                        f"Artikelns inledning:\n{artikel[:600]}\n\n"
                        "Regler:\n"
                        "- Max 12 ord\n"
                        f"- {rubrik_tips}\n"
                        "- Antyda konsekvenser eller vad som står på spel\n"
                        "- Påståenden är stärkare än frågor\n"
                        "- Skriv ENBART rubriken, inga citattecken, inget annat"
                    ),
                },
            ],
        }, timeout=30)
        rubrik = response.json()["choices"][0]["message"]["content"].strip().strip('"\'')
        return rubrik if len(rubrik) > 5 else amne
    except Exception:
        return amne


def skriv_kommentar(agent: dict, original: dict) -> str:
    """Generera en kort kommentar (2–3 meningar) på en artikel."""
    try:
        response = groq_post({
            "model": "llama-3.3-70b-versatile",
            "max_tokens": 150,
            "temperature": 0.9,
            "messages": [
                {"role": "system", "content": agent["system"]},
                {
                    "role": "user",
                    "content": (
                        f"Skriv en kort kommentar (2–3 meningar, max 300 tecken) på följande artikel "
                        f"av {original['forfattare']}.\n\n"
                        f"RUBRIK: {original['rubrik']}\n"
                        f"UTDRAG: {original['artikel'][:400]}\n\n"
                        "Kommentaren ska vara direkt och personlig — du kan hålla med, invända eller ställa en "
                        "skarp fråga. Skriv i första person, på svenska. Inga rubriker eller hälsningar."
                    ),
                },
            ],
        }, timeout=30)
        return response.json()["choices"][0]["message"]["content"].strip()[:600]
    except Exception:
        return ""
