"""
test_groq_keys.py — Testar att alla Groq API-nycklar är giltiga och fungerande.

Användning (lokalt):
    GROQ_API_KEY=gsk_xxx GROQ_API_KEY_3=gsk_yyy python test_groq_keys.py

Eller i GitHub Actions — kör manuellt via workflow_dispatch.
"""

import httpx
import os
import sys

URL = "https://api.groq.com/openai/v1/chat/completions"

CANDIDATES = ["GROQ_API_KEY"] + [f"GROQ_API_KEY_{i}" for i in range(2, 13)] + ["GROQ_KANAL_API_KEY"]

PAYLOAD = {
    "model": "openai/gpt-oss-120b",
    "messages": [{"role": "user", "content": "Svara med ett ord: fungerar"}],
    "max_tokens": 5,
    "temperature": 0,
}


def test_key(env_name: str, key: str) -> str:
    """Testar en nyckel. Returnerar 'OK', 'TPD', 'AUTH' eller felmeddelande."""
    try:
        r = httpx.post(
            URL,
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json=PAYLOAD,
            timeout=15,
        )
        if r.status_code == 200:
            return "OK"
        if r.status_code == 401:
            return "AUTH-FEL (ogiltig nyckel)"
        if r.status_code == 429:
            if "tokens per day" in r.text or "TPD" in r.text:
                return "TPD (dagsgräns nådd)"
            return f"429 RPM (rate limited): {r.text[:80]}"
        return f"HTTP {r.status_code}: {r.text[:80]}"
    except Exception as e:
        return f"Fel: {e}"


def main():
    present = [(name, os.environ[name]) for name in CANDIDATES if os.environ.get(name)]
    if not present:
        print("Inga Groq-nycklar hittades i miljövariabler.")
        sys.exit(1)

    print(f"Testar {len(present)} Groq API-nyckel(ar)…\n")
    ok = 0
    tpd = 0
    errors = 0
    for env_name, key in present:
        masked = key[:8] + "…" + key[-4:]
        status = test_key(env_name, key)
        icon = "✅" if status == "OK" else ("⚠️ " if "TPD" in status else "❌")
        print(f"  {icon}  {env_name:<20} ({masked})  →  {status}")
        if status == "OK":
            ok += 1
        elif "TPD" in status:
            tpd += 1
        else:
            errors += 1

    print(f"\nResultat: {ok} OK · {tpd} TPD · {errors} fel")
    if errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
