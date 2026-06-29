---
date: 2026-06-29
type: ai-performance
overall_health_24h: 95.4
overall_health_7d: 96.5
total_calls_24h: 432
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["cerebras"]
ranked_order: ["mistral", "sambanova", "deepseek", "cloudflare", "github_models", "groq", "cerebras", "gemini"]
config_uppdaterad: "2026-06-29 07:20 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 332
    ok: 332
    rate_limits: 0
    errors: 0
    snitt_ms: 1221
  groq:
    anrop: 93
    ok: 77
    rate_limits: 16
    errors: 0
    snitt_ms: 1182
  cerebras:
    anrop: 5
    ok: 3
    rate_limits: 2
    errors: 0
    snitt_ms: 526
  gemini:
    anrop: 2
    ok: 0
    rate_limits: 2
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-06-29

## Hälsostatus

🟢 **95.4%** lyckade anrop senaste 24h · 432 anrop totalt
🟢 **96.5%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 93 anrop · 77 (82.8%) OK · 16 (17.2%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `mistral` | 332 | 332 (100%) | 0 (0%) | 0 | 1221 ms |
| 🟢 `groq` | 93 | 77 (82.8%) | 16 (17.2%) | 0 | 1182 ms |
| 🟡 `cerebras` | 5 | 3 (60%) | 2 (40%) | 0 | 526 ms |
| 🔴 `gemini` | 2 | 0 (0%) | 2 (100%) | 0 | – |

## Nuvarande Fallback-ordning

`mistral → sambanova → deepseek → cloudflare → github_models → groq → cerebras → gemini`

*(Benchmark senast körde: 2026-06-29 07:20 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (773 anrop, 0 rl, 0 err)
  🟢 groq             85.9% ok   (220 anrop, 31 rl, 0 err)
  🟡 cerebras         60% ok   (5 anrop, 2 rl, 0 err)
  🔴 gemini           0% ok   (2 anrop, 2 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`cerebras`**: 3/5 ok (60%), 2 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har vi hanterat 432 anrop med en hälsopoäng på 95,4 % (96,5 % över 7 dagar). Mistral levererade 332 anrop utan några rate‑limits och med 100 % lyckade svar (medel‑latens 1 221 ms), medan Groq låg på 93 anrop där 82,8 % gick igenom men 16 rate‑limits uppstod (latens 1 182 ms). Cerebras visade problem – bara 60 % av 5 anrop lyckades och 2 av dem drabbades av rate
