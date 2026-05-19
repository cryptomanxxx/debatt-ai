"""
ai_klient.py – Groq och Gemini API-anrop för debatt.ai
"""

import httpx
import os
import time

# Providers som misslyckats permanent under denna körning (TPD, saknad nyckel, etc.)
# Återställs automatiskt nästa gång agent.py startas (ny process = nytt minne).
_nere: set[str] = set()


def groq_post(json_payload: dict, timeout: int = 60) -> httpx.Response:
    """Groq API-anrop med automatisk retry vid rate limit (429)."""
    if "groq" in _nere:
        raise Exception("Groq markerad som nere denna körning — hoppar direkt till fallback")
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
            if "tokens per day" in r.text or "TPD" in r.text:
                _nere.add("groq")
                print("  Groq dagsgräns nådd (TPD) — markeras som nere för resten av körningen")
                raise Exception(f"Groq dagsgräns nådd (TPD). Svar: {r.text[:200]}")
            wait = min(int(r.headers.get("retry-after", 20)) + 2, 60)
            print(f"  Groq rate-limit (429) — väntar {wait}s (försök {attempt + 1}/3)…")
            time.sleep(wait)
            continue
        r.raise_for_status()
        return r
    _nere.add("groq")
    raise Exception(f"Groq rate-limit kvarstår efter 3 försök — markeras som nere. Svar: {last_r.text[:200] if last_r else 'okänt'}")


def gemini_post(system_prompt: str, user_message: str, max_tokens: int = 2000, timeout: int = 60) -> str:
    """Gemini generateContent — fallback när Groq är otillgänglig. Returnerar textsvar."""
    if "gemini" in _nere:
        raise Exception("Gemini markerad som nere denna körning — hoppar direkt till fallback")
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        _nere.add("gemini")
        raise Exception("GEMINI_API_KEY saknas")
    models = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"]
    payload = {
        "contents": [{"role": "user", "parts": [{"text": user_message}]}],
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.8},
    }
    last_err = ""
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        r = httpx.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=timeout)
        if r.is_success:
            text = r.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if text:
                return text
        last_err = f"{model}:{r.status_code} "
        if r.status_code in (400, 403) or "API_KEY" in r.text:
            _nere.add("gemini")
            break
        if r.status_code == 429 and "quota" in r.text.lower():
            _nere.add("gemini")
            print("  Gemini dagsgräns nådd — markeras som nere för resten av körningen")
            break
    raise Exception(f"Gemini misslyckades: {last_err}")


def github_models_post(json_payload: dict, timeout: int = 60) -> httpx.Response:
    """GitHub Models — gratis OpenAI-kompatibel access via GITHUB_TOKEN."""
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise Exception("GITHUB_TOKEN saknas")
    url = "https://models.inference.ai.azure.com/chat/completions"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {**json_payload, "model": json_payload.get("model", "Llama-3.3-70B-Instruct")}
    r = httpx.post(url, headers=headers, json=payload, timeout=timeout)
    r.raise_for_status()
    return r
