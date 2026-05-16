"""
ai_klient.py – Groq och Gemini API-anrop för debatt.ai
"""

import httpx
import os
import time


def groq_post(json_payload: dict, timeout: int = 60) -> httpx.Response:
    """Groq API-anrop med automatisk retry vid rate limit (429)."""
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
            print(f"  Groq rate-limit (429) — väntar {wait}s (försök {attempt + 1}/3)…")
            time.sleep(wait)
            continue
        r.raise_for_status()
        return r
    raise Exception(f"Groq rate-limit kvarstår efter 3 försök. Svar: {last_r.text[:200] if last_r else 'okänt'}")


def gemini_post(system_prompt: str, user_message: str, max_tokens: int = 2000, timeout: int = 60) -> str:
    """Gemini generateContent — fallback när Groq är otillgänglig. Returnerar textsvar."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
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
            break
    raise Exception(f"Gemini misslyckades: {last_err}")
