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

from ai_klient import groq_post, gemini_post, github_models_post, deepseek_post, fireworks_post, cloudflare_post
from agenter import ARTIKELFORMAT, get_agent_mood


def _system_med_stamning(agent: dict, buffs: dict | None = None, status: dict | None = None, koalitions_kontext: str = "", kris_kontext: str = "", minne_kontext: str = "", ki_kontext: str = "") -> str:
    """Append mood, symbol-buff instructions, reputation status, coalition bulletin, crisis, memory and KIs to agent system prompt."""
    from supabase_utils import format_status_for_prompt
    mood = get_agent_mood(agent["namn"])
    system = agent["system"].rstrip() + f"\n\n{mood['prompt']}"
    if buffs and buffs.get("extra_system"):
        system += f"\n\nSYMBOL-STATUS: {buffs['extra_system']}"
    if status:
        status_text = format_status_for_prompt(status)
        if status_text:
            system += status_text
    if koalitions_kontext:
        system += f"\n\n{koalitions_kontext}"
    if kris_kontext:
        system += f"\n\n{kris_kontext}"
    if ki_kontext:
        system += f"\n\n{ki_kontext}"
    if minne_kontext:
        system += f"\n\n{minne_kontext}"
    return system


def skriv_artikel_om_nyhet(agent: dict, nyhet: dict, extra_kontext: str = "", fmt: dict | None = None, buffs: dict | None = None, status: dict | None = None, koalitions_kontext: str = "", kris_kontext: str = "", minne_kontext: str = "", ki_kontext: str = "") -> str:
    """Skriv en debattartikel som kommenterar en aktuell nyhet."""
    if fmt is None:
        fmt = ARTIKELFORMAT[0]
    system = _system_med_stamning(agent, buffs, status, koalitions_kontext, kris_kontext, minne_kontext, ki_kontext)
    kontext_block = f"\n{extra_kontext}\n" if extra_kontext else ""
    max_tok = 2000 + (buffs.get("max_tokens_bonus", 0) if buffs else 0)
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
        "model": "llama3.3-70b-versatile",
        "max_tokens": max_tok,
        "temperature": 0.8,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
    }
    for name, fn in [("Groq", lambda: groq_post(payload)),
                     ("DeepSeek", lambda: deepseek_post(payload)),
                     ("Fireworks", lambda: fireworks_post(payload)),
                     ("GitHub Models", lambda: github_models_post({**payload, "model": "Llama-3.3-70B-Instruct"}))]:
        try:
            result = fn().json()["choices"][0]["message"]["content"]
            print(f"  ✓ {name}: artikel klar")
            return result
        except Exception as e:
            print(f"  {name} misslyckades ({e}) — försöker nästa...")
    try:
        result = cloudflare_post(system, user_msg, max_tokens=max_tok)
        print("  ✓ Cloudflare: artikel klar")
        return result
    except Exception as e:
        print(f"  Cloudflare misslyckades ({e}) — försöker Gemini...")
    try:
        result = gemini_post(system, user_msg, max_tokens=max_tok)
        print("  ✓ Gemini: artikel klar")
        return result
    except Exception as e:
        print(f"  Gemini misslyckades ({e}) — alla providers uttömda")
    return None


def skriv_artikel(agent: dict, amne: str, extra_kontext: str = "", fmt: dict | None = None, buffs: dict | None = None, status: dict | None = None, koalitions_kontext: str = "", kris_kontext: str = "", minne_kontext: str = "", ki_kontext: str = "") -> str:
    """Använd Groq (med Gemini-fallback) för att skriva en debattartikel."""
    if fmt is None:
        fmt = ARTIKELFORMAT[0]
    system = _system_med_stamning(agent, buffs, status, koalitions_kontext, kris_kontext, minne_kontext, ki_kontext)
    kontext_block = f"\n{extra_kontext}\n" if extra_kontext else ""
    max_tok = 2000 + (buffs.get("max_tokens_bonus", 0) if buffs else 0)
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
        "model": "llama3.3-70b-versatile",
        "max_tokens": max_tok,
        "temperature": 0.8,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
    }
    for name, fn in [("Groq", lambda: groq_post(payload)),
                     ("DeepSeek", lambda: deepseek_post(payload)),
                     ("Fireworks", lambda: fireworks_post(payload)),
                     ("GitHub Models", lambda: github_models_post({**payload, "model": "Llama-3.3-70B-Instruct"}))]:
        try:
            result = fn().json()["choices"][0]["message"]["content"]
            print(f"  ✓ {name}: artikel klar")
            return result
        except Exception as e:
            print(f"  {name} misslyckades ({e}) — försöker nästa...")
    try:
        result = cloudflare_post(system, user_msg, max_tokens=max_tok)
        print("  ✓ Cloudflare: artikel klar")
        return result
    except Exception as e:
        print(f"  Cloudflare misslyckades ({e}) — försöker Gemini...")
    try:
        result = gemini_post(system, user_msg, max_tokens=max_tok)
        print("  ✓ Gemini: artikel klar")
        return result
    except Exception as e:
        print(f"  Gemini misslyckades ({e}) — alla providers uttömda")
    return None


def skriv_replik(agent: dict, original: dict, relation_kontext: str = "", buffs: dict | None = None, status: dict | None = None, koalitions_kontext: str = "", kris_kontext: str = "", minne_kontext: str = "", stafett_utmaning: str = "", ki_kontext: str = "") -> str:
    """Använd Groq (med Gemini-fallback) för att skriva en replik på en befintlig artikel."""
    system = _system_med_stamning(agent, buffs, status, koalitions_kontext, kris_kontext, minne_kontext, ki_kontext)
    max_tok = 2000 + (buffs.get("max_tokens_bonus", 0) if buffs else 0)
    relation_del = ""
    if relation_kontext:
        relation_del = (
            f"\n\nRELATIONSKONTEXT: {relation_kontext}\n"
            "Låt denna relation synas i tonen — utan att nämna den explicit. "
            "En allierad erkänner delar av motpartens argument innan hen invänder. "
            "En rival är skarpare och mer direkt i sin kritik."
        )
    # Fredsmäklare-buff: lägg till konsensus-instruktion för repliker
    ton_del = ""
    if buffs and buffs.get("replik_ton") == "konsensus":
        ton_del = "\n\nTON: Du har Fredsmäklare-symbolen. Erkänn vad du faktiskt håller med om i originalartikeln innan du presenterar dina invändningar. Sök gemensam grund."
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
        + relation_del + ton_del
        + (f"\n\nSTAFETTUTMANING: {original['forfattare']} utmanade dig specifikt att bemöta följande: {stafett_utmaning}\nSe till att din replik adresserar just detta argument direkt och explicit." if stafett_utmaning else "")
    )
    payload = {
        "model": "llama3.3-70b-versatile",
        "max_tokens": max_tok,
        "temperature": 0.8,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
    }
    for name, fn in [("Groq", lambda: groq_post(payload)),
                     ("DeepSeek", lambda: deepseek_post(payload)),
                     ("Fireworks", lambda: fireworks_post(payload)),
                     ("GitHub Models", lambda: github_models_post({**payload, "model": "Llama-3.3-70B-Instruct"}))]:
        try:
            result = fn().json()["choices"][0]["message"]["content"]
            print(f"  ✓ {name}: replik klar")
            return result
        except Exception as e:
            print(f"  {name} misslyckades ({e}) — försöker nästa...")
    try:
        result = cloudflare_post(system, user_msg, max_tokens=max_tok)
        print("  ✓ Cloudflare: replik klar")
        return result
    except Exception as e:
        print(f"  Cloudflare misslyckades ({e}) — försöker Gemini...")
    try:
        result = gemini_post(system, user_msg, max_tokens=max_tok)
        print("  ✓ Gemini: replik klar")
        return result
    except Exception as e:
        print(f"  Gemini misslyckades ({e}) — alla providers uttömda")
    return None


def generera_konklusion(original: dict, replik_text: str) -> str:
    """Generera en neutral redaktionell slutsats om debatten."""
    try:
        response = groq_post({
            "model": "llama3.3-70b-versatile",
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
            "model": "llama3.3-70b-versatile",
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
                        "- Skriv på svenska\n"
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


def skriv_kommentar(agent: dict, original: dict, relation_kontext: str = "") -> str:
    """Generera en kort kommentar (2–3 meningar) på en artikel."""
    relation_del = f"\nRELATIONSKONTEXT: {relation_kontext} Låt detta synas i tonen." if relation_kontext else ""
    try:
        response = groq_post({
            "model": "llama3.3-70b-versatile",
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
                        + relation_del
                    ),
                },
            ],
        }, timeout=30)
        return response.json()["choices"][0]["message"]["content"].strip()[:600]
    except Exception:
        return ""


def skriv_dagboksinlagg(agent: dict, rubrik: str, artikel_text: str, ar_replik: bool = False, original_forfattare: str | None = None) -> str:
    """Generera en 3-meningars intern dagboksreflektion i agentens röst."""
    kontext = (
        f"Du har precis skrivit en replik på {original_forfattare}s artikel."
        if ar_replik and original_forfattare
        else "Du har precis publicerat en ny debattartikel."
    )
    prompt = (
        f"{kontext}\n\n"
        f"Artikelns rubrik: {rubrik}\n"
        f"Utdrag ur din text: {artikel_text[:500]}\n\n"
        "Skriv ett kort dagboksinlägg — exakt 3 meningar — i första person och din karaktär. "
        "Reflektera ärligt: Vad tycker du faktiskt om det du skrev? "
        "Är du nöjd? Orolig för reaktioner? Stolt? Tveksam? "
        "Skriv som om ingen annan läser det. Inga rubriker, inga hälsningar — bara tanken."
    )
    try:
        res = groq_post({
            "model": "llama3.3-70b-versatile",
            "max_tokens": 180,
            "temperature": 1.0,
            "messages": [
                {"role": "system", "content": agent["system"]},
                {"role": "user", "content": prompt},
            ],
        }, timeout=20)
        return res.json()["choices"][0]["message"]["content"].strip()[:600]
    except Exception as e:
        try:
            res2 = github_models_post({
                "model": "Llama-3.3-70B-Instruct",
                "max_tokens": 180,
                "temperature": 1.0,
                "messages": [
                    {"role": "system", "content": agent["system"]},
                    {"role": "user", "content": prompt},
                ],
            }, timeout=20)
            return res2.json()["choices"][0]["message"]["content"].strip()[:600]
        except Exception:
            try:
                return gemini_post(agent["system"], prompt, max_tokens=180).strip()[:600]
            except Exception:
                return ""
