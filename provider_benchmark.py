"""
provider_benchmark.py — Testar alla AI-providers med PIS-liknande prompt.

Mäter per provider:
  - Latens (sekunder per anrop)
  - Succérate (lyckade / totala)
  - Vid vilket anropsnummer 429 triggas första gången
  - Parsningsbar JSON-output (kan den följa PIS-format?)

Konfiguration via miljövariabler:
  ANROP_PER_PROVIDER  — antal testanrop per provider (default 10)
  SLEEP_MELLAN        — sekunder mellan anrop (default 1)
  PROVIDERS           — kommaseparerad lista (default = alla tillgängliga)
                        ex: "groq,sambanova,cerebras"
"""
import os
import sys
import time
import json

import httpx

# ── Samma PIS-prompt som i produktionen ──────────────────────────────────────

SYSTEM = (
    "Du är en ekonomisk analysmodell. Svara ENDAST med exakt detta format, inga andra ord:\n"
    "BNP_EFFEKT_PCT: [tal]\n"
    "GINI_EFFEKT: [tal]\n"
    "INFLATION_DELTA: [tal]\n"
    "ARBETSLOSHET_DELTA: [tal]\n"
    "SOCIALT_KAPITAL: [positiv, negativ eller neutral]\n"
    "KOALITIONS_STABILITET: [positiv, negativ eller neutral]\n"
    "KONFIDENS: [låg, medel eller hög]\n"
    "ANALYS: [2 meningar på svenska]"
)

PROMPT = (
    "Analysera det ekonomiska och sociala utfallet av följande lagförslag:\n\n"
    "Titel: Sänkt bolagsskatt till 15%\n"
    "Beskrivning: Bolagsskatten sänks från 20,6% till 15% för att öka "
    "investeringar och konkurrenskraft."
)


def _parse(text: str) -> bool:
    """Returnerar True om svaret innehåller minst 5 av 7 förväntade fält."""
    fields = ["BNP_EFFEKT_PCT", "GINI_EFFEKT", "INFLATION_DELTA",
              "ARBETSLOSHET_DELTA", "SOCIALT_KAPITAL", "KOALITIONS_STABILITET", "KONFIDENS"]
    return sum(1 for f in fields if f in text) >= 5


# ── Provider-anrop ─────────────────────────────────────────────────────────────

def _groq(n: int) -> str:
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        raise Exception("GROQ_API_KEY saknas")
    r = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={"model": "llama-3.3-70b-versatile",
              "messages": [{"role": "system", "content": SYSTEM},
                           {"role": "user", "content": PROMPT}],
              "max_tokens": 200, "temperature": 0.35},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _sambanova(n: int) -> str:
    key = os.environ.get("SAMBANOVA_API_KEY")
    if not key:
        raise Exception("SAMBANOVA_API_KEY saknas")
    r = httpx.post(
        "https://api.sambanova.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={"model": "Meta-Llama-3.3-70B-Instruct",
              "messages": [{"role": "system", "content": SYSTEM},
                           {"role": "user", "content": PROMPT}],
              "max_tokens": 200, "temperature": 0.35},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _cerebras(n: int) -> str:
    key = os.environ.get("CEREBRAS_API_KEY")
    if not key:
        raise Exception("CEREBRAS_API_KEY saknas")
    r = httpx.post(
        "https://api.cerebras.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={"model": "llama-3.3-70b",
              "messages": [{"role": "system", "content": SYSTEM},
                           {"role": "user", "content": PROMPT}],
              "max_tokens": 200, "temperature": 0.35},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _github_models(n: int) -> str:
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise Exception("GITHUB_TOKEN saknas")
    r = httpx.post(
        "https://models.inference.ai.azure.com/chat/completions",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"model": "Llama-3.3-70B-Instruct",
              "messages": [{"role": "system", "content": SYSTEM},
                           {"role": "user", "content": PROMPT}],
              "max_tokens": 200, "temperature": 0.35},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _gemini(n: int) -> str:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise Exception("GEMINI_API_KEY saknas")
    r = httpx.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={key}",
        headers={"Content-Type": "application/json"},
        json={"contents": [{"role": "user", "parts": [{"text": PROMPT}]}],
              "systemInstruction": {"parts": [{"text": SYSTEM}]},
              "generationConfig": {"maxOutputTokens": 200, "temperature": 0.35}},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["candidates"][0]["content"]["parts"][0]["text"]


PROVIDERS = {
    "groq":          ("Groq llama-3.3-70b-versatile",     _groq),
    "sambanova":     ("Sambanova Meta-Llama-3.3-70B",      _sambanova),
    "cerebras":      ("Cerebras llama-3.3-70b",            _cerebras),
    "github_models": ("GitHub Models Llama-3.3-70B",       _github_models),
    "gemini":        ("Gemini 2.0 Flash-Lite",             _gemini),
}


# ── Testloop ───────────────────────────────────────────────────────────────────

def benchmark(name: str, label: str, fn, n_calls: int, sleep: float):
    print(f"\n{'─'*60}")
    print(f"  {label}")
    print(f"  {n_calls} anrop, {sleep}s mellanrum")
    print(f"{'─'*60}")

    latenser = []
    ok = 0
    rate_limit_vid = None
    parsade = 0

    for i in range(1, n_calls + 1):
        t0 = time.time()
        try:
            text = fn(i)
            lat = time.time() - t0
            latenser.append(lat)
            ok += 1
            parsed = _parse(text)
            if parsed:
                parsade += 1
            print(f"  [{i:2d}/{n_calls}] ✓ {lat:.1f}s {'(parsad)' if parsed else '(ej parsad)'}")
        except httpx.HTTPStatusError as e:
            lat = time.time() - t0
            if e.response.status_code == 429:
                if rate_limit_vid is None:
                    rate_limit_vid = i
                print(f"  [{i:2d}/{n_calls}] ✗ 429 RATE LIMIT — {lat:.1f}s")
            else:
                print(f"  [{i:2d}/{n_calls}] ✗ HTTP {e.response.status_code} — {lat:.1f}s")
        except Exception as e:
            lat = time.time() - t0
            print(f"  [{i:2d}/{n_calls}] ✗ FEL: {str(e)[:80]} — {lat:.1f}s")

        if i < n_calls:
            time.sleep(sleep)

    avg_lat = sum(latenser) / len(latenser) if latenser else 0
    print(f"\n  Resultat: {ok}/{n_calls} lyckade | snitt {avg_lat:.1f}s | "
          f"{parsade}/{ok} parsade | "
          f"429 vid anrop #{rate_limit_vid if rate_limit_vid else '–'}")

    return {
        "provider": name,
        "label": label,
        "lyckade": ok,
        "totalt": n_calls,
        "snitt_latens_s": round(avg_lat, 2),
        "parsade": parsade,
        "forsta_429_vid_anrop": rate_limit_vid,
    }


# ── Main ───────────────────────────────────────────────────────────────────────

N_CALLS = int(os.environ.get("ANROP_PER_PROVIDER", "10"))
SLEEP   = float(os.environ.get("SLEEP_MELLAN", "1"))
selected_raw = os.environ.get("PROVIDERS", "")
selected = [p.strip() for p in selected_raw.split(",") if p.strip()] if selected_raw else list(PROVIDERS.keys())

print(f"\n{'═'*60}")
print(f"  Provider Benchmark — PIS-liknande prompt")
print(f"  {N_CALLS} anrop/provider, {SLEEP}s mellanrum")
print(f"  Providers: {', '.join(selected)}")
print(f"{'═'*60}")

results = []
for key in selected:
    if key not in PROVIDERS:
        print(f"\nOkänd provider: {key} — hoppar över")
        continue
    label, fn = PROVIDERS[key]
    result = benchmark(key, label, fn, N_CALLS, SLEEP)
    results.append(result)

# ── Sammanfattning ─────────────────────────────────────────────────────────────
print(f"\n\n{'═'*60}")
print("  SAMMANFATTNING")
print(f"{'═'*60}")
print(f"  {'Provider':<35} {'OK':>4} {'Latens':>8} {'Parsad':>7} {'429 vid':>8}")
print(f"  {'─'*35} {'─'*4} {'─'*8} {'─'*7} {'─'*8}")
for r in sorted(results, key=lambda x: (-x["lyckade"], x["snitt_latens_s"])):
    rl = f"#{r['forsta_429_vid_anrop']}" if r["forsta_429_vid_anrop"] else "–"
    print(f"  {r['label']:<35} {r['lyckade']:>2}/{r['totalt']:<2} {r['snitt_latens_s']:>7.1f}s "
          f"{r['parsade']:>4}/{r['lyckade'] or 1:<2} {rl:>8}")

print(f"\n  Rekommenderad fallback-kedja (bäst → sämst):")
ranked = sorted(results, key=lambda x: (-x["lyckade"], x["snitt_latens_s"]))
for i, r in enumerate(ranked, 1):
    print(f"  {i}. {r['label']} — {r['lyckade']}/{r['totalt']} lyckade, {r['snitt_latens_s']}s snitt")
print(f"\n{'═'*60}")
