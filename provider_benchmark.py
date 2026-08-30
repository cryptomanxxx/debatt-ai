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
  SUPABASE_URL        — Supabase project URL
  SUPABASE_ANON_KEY   — Supabase anon key (för att spara resultat)
"""
import os
import sys
import time
import json
from datetime import datetime, timezone, timedelta

import httpx

SB_URL = os.environ.get("SUPABASE_URL", "https://fmwxftnistkoqazfwnuj.supabase.co")
SB_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
SB_HDR = {"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}", "Content-Type": "application/json"} if SB_KEY else {}


def _sb_get(path: str, params: str = "") -> list:
    if not SB_KEY:
        return []
    try:
        url = f"{SB_URL}/rest/v1/{path}{'?' + params if params else ''}"
        r = httpx.get(url, headers=SB_HDR, timeout=10)
        return r.json() if r.is_success else []
    except Exception:
        return []


def _sb_post(path: str, data: dict | list) -> bool:
    if not SB_KEY:
        return False
    try:
        r = httpx.post(f"{SB_URL}/rest/v1/{path}", headers=SB_HDR, json=data, timeout=10)
        return r.is_success
    except Exception:
        return False


def _sb_upsert(path: str, data: dict) -> bool:
    if not SB_KEY:
        return False
    try:
        hdrs = {**SB_HDR, "Prefer": "resolution=merge-duplicates"}
        r = httpx.post(f"{SB_URL}/rest/v1/{path}", headers=hdrs, json=data, timeout=10)
        return r.is_success
    except Exception:
        return False


_PROVIDER_ALIAS = {"codestral": "mistral", "github": "github_models"}


def hamta_passiva_429s() -> dict[str, int]:
    """Hämtar antal rate-limit-fel per provider senaste 24h från ai_log."""
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M:%SZ")
    rows = _sb_get("ai_log", f"ts=gte.{since}&status=in.(rate_limited,rate_limit,error_429)&select=provider")
    counts: dict[str, int] = {}
    for row in rows:
        p = _PROVIDER_ALIAS.get(row.get("provider", ""), row.get("provider", ""))
        counts[p] = counts.get(p, 0) + 1
    return counts


def hamta_produktion_ok_rate_7d() -> dict[str, float]:
    """Hämtar faktisk OK-rate per provider från ai_log de senaste 7 dagarna.

    Detta är den tyngsta rankingsignalen — speglar hur providers faktiskt presterar
    under produktionslast (12 agentkörningar/dag), inte bara i tomgångsbenchmarks.
    Providers med <10 anrop exkluderas (för lite data för att vara meningsfullt).
    """
    since = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
    rows = _sb_get("ai_log", f"ts=gte.{since}&select=provider,status&limit=50000")
    totals: dict[str, int] = {}
    oks: dict[str, int] = {}
    for row in rows:
        p = _PROVIDER_ALIAS.get(row.get("provider", ""), row.get("provider", ""))
        totals[p] = totals.get(p, 0) + 1
        if row.get("status") == "ok":
            oks[p] = oks.get(p, 0) + 1
    result = {p: oks.get(p, 0) / totals[p] for p in totals if totals[p] >= 10}
    return result


def spara_och_kalibrera(results: list[dict]) -> None:
    """Sparar benchmark-resultat till Supabase och uppdaterar fallback-ordningen."""
    if not SB_KEY:
        print("  SUPABASE_ANON_KEY saknas — hoppar över Supabase-sparning")
        return

    # Spara alla resultat till historik
    rows = [{
        "provider": r["provider"],
        "label": r["label"],
        "lyckade": r["lyckade"],
        "totalt": r["totalt"],
        "snitt_latens_s": r["snitt_latens_s"],
        "parsade": r["parsade"],
        "forsta_429_vid_anrop": r["forsta_429_vid_anrop"],
    } for r in results]
    ok = _sb_post("provider_benchmark_log", rows)
    print(f"  {'✓' if ok else '✗'} Historik sparad till provider_benchmark_log")

    # Hämta produktionsdata — 7d OK-rate är den tyngsta signalen
    prod_ok = hamta_produktion_ok_rate_7d()
    if prod_ok:
        print(f"  7-dagars produktions-OK-rate: { {p: f'{v*100:.1f}%' for p, v in prod_ok.items()} }")
    else:
        print("  Ingen 7-dagars produktionsdata tillgänglig — använder bara benchmarkdata")

    def score(r: dict) -> float:
        bench_ok = r["lyckade"] / r["totalt"] if r["totalt"] else 0
        # Produktions-OK-rate väger 70%, benchmarks 30% — latens som tiebreaker.
        # Faller tillbaka på bench_ok om providern saknar tillräcklig produktionshistorik.
        p_ok = prod_ok.get(r["provider"], bench_ok)
        return p_ok * 70 + bench_ok * 30 - r["snitt_latens_s"] * 2

    ranked = sorted(results, key=score, reverse=True)
    ranked_benchmarked = [r["provider"] for r in ranked]

    # Hämta befintlig ordning och lägg till providers som inte ingick i körningen
    existing_order = []
    try:
        res = _sb_get("provider_config?id=eq.current&select=ranked_order")
        if res:
            existing_order = res[0].get("ranked_order") or []
    except Exception:
        pass
    _DEFAULT = ["mistral", "sambanova", "deepseek", "groq", "cloudflare", "gemini", "cerebras"]
    fallback = existing_order or _DEFAULT
    # github_models stängde helt 30 jul 2026 — filtreras bort även om den
    # fortfarande ligger kvar i en tidigare sparad ranked_order i Supabase.
    ranked_order = ranked_benchmarked + [p for p in fallback if p not in ranked_benchmarked and p != "github_models"]

    ok2 = _sb_upsert("provider_config", {
        "id": "current",
        "ranked_order": ranked_order,
        "uppdaterad": datetime.now(timezone.utc).isoformat(),
    })
    print(f"  {'✓' if ok2 else '✗'} Fallback-ordning uppdaterad: {' → '.join(ranked_order)}")

    # Verifiering — läs tillbaka för att bekräfta att raden är läsbar via anon-nyckeln
    verify = _sb_get("provider_config", "id=eq.current&select=ranked_order")
    if verify and verify[0].get("ranked_order"):
        print(f"  ✓ Verifiering OK — provider_config läsbar: {verify[0]['ranked_order'][:3]}…")
    else:
        print(f"  ⚠ Verifiering MISSLYCKADES — provider_config returnerade: {verify!r}")

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
        json={"model": "openai/gpt-oss-120b",
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


def _gemini(n: int) -> str:
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise Exception("GEMINI_API_KEY saknas")
    r = httpx.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={key}",
        headers={"Content-Type": "application/json"},
        json={"contents": [{"role": "user", "parts": [{"text": PROMPT}]}],
              "systemInstruction": {"parts": [{"text": SYSTEM}]},
              "generationConfig": {"maxOutputTokens": 200, "temperature": 0.35}},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["candidates"][0]["content"]["parts"][0]["text"]


def _mistral(n: int) -> str:
    key = os.environ.get("MISTRAL_API_KEY")
    if not key:
        raise Exception("MISTRAL_API_KEY saknas")
    r = httpx.post(
        "https://api.mistral.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={"model": "codestral-latest",
              "messages": [{"role": "system", "content": SYSTEM},
                           {"role": "user", "content": PROMPT}],
              "max_tokens": 200, "temperature": 0.35},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _deepseek(n: int) -> str:
    key = os.environ.get("DEEPSEEK_API_KEY")
    if not key:
        raise Exception("DEEPSEEK_API_KEY saknas")
    r = httpx.post(
        "https://api.deepseek.com/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json={"model": "deepseek-chat",
              "messages": [{"role": "system", "content": SYSTEM},
                           {"role": "user", "content": PROMPT}],
              "max_tokens": 200, "temperature": 0.35},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _cloudflare(n: int) -> str:
    account_id = os.environ.get("CF_ACCOUNT_ID")
    api_token  = os.environ.get("CF_API_TOKEN")
    if not account_id or not api_token:
        raise Exception("CF_ACCOUNT_ID eller CF_API_TOKEN saknas")
    r = httpx.post(
        f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        headers={"Authorization": f"Bearer {api_token}", "Content-Type": "application/json"},
        json={"messages": [{"role": "system", "content": SYSTEM},
                            {"role": "user",   "content": PROMPT}],
              "max_tokens": 200},
        timeout=30,
    )
    r.raise_for_status()
    text = r.json().get("result", {}).get("response", "")
    if not text:
        raise Exception(f"Cloudflare: tomt svar — {r.text[:200]}")
    return text


PROVIDERS = {
    "groq":          ("Groq openai/gpt-oss-120b",     _groq),
    "sambanova":     ("Sambanova Meta-Llama-3.3-70B",      _sambanova),
    "cerebras":      ("Cerebras llama-3.3-70b",            _cerebras),
    "gemini":        ("Gemini 3.5 Flash-Lite",             _gemini),
    "mistral":       ("Mistral Codestral-latest",          _mistral),
    "deepseek":      ("DeepSeek V3 (deepseek-chat)",       _deepseek),
    "cloudflare":    ("Cloudflare Llama-3.3-70B",          _cloudflare),
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

# ── Spara till Supabase och kalibrera fallback-kedjan ──────────────────────────
print(f"\n  Sparar resultat och kalibrerar fallback-kedja...")
spara_och_kalibrera(results)
print(f"{'═'*60}")
