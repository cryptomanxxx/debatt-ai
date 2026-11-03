---
date: 2026-11-03
type: ai-performance
overall_health_24h: 99.7
overall_health_7d: 99.7
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "cloudflare", "groq", "deepseek", "gemini"]
config_uppdaterad: "2026-11-03 10:14 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 942
    ok: 942
    rate_limits: 0
    errors: 0
    snitt_ms: 3377
  cloudflare:
    anrop: 1
    ok: 0
    rate_limits: 0
    errors: 1
    snitt_ms: null
  groq:
    anrop: 34
    ok: 34
    rate_limits: 0
    errors: 0
    snitt_ms: 2408
  deepseek:
    anrop: 1
    ok: 0
    rate_limits: 0
    errors: 1
    snitt_ms: null
  gemini:
    anrop: 3
    ok: 2
    rate_limits: 1
    errors: 0
    snitt_ms: 6017
---

# AI Provider Performance — 2026-11-03

## Hälsostatus

🟢 **99.7%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **99.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 34 anrop · 34 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 942 | 942 (100%) | 0 (0%) | 0 | 3377 ms | 100% ok · 1460 ms |
| 🔴 `cloudflare` | 1 | 0 (0%) | 0 (0%) | 1 | – | 100% ok · 4260 ms |
| 🟢 `groq` | 34 | 34 (100%) | 0 (0%) | 0 | 2408 ms | 100% ok · 670 ms |
| 🔴 `deepseek` | 1 | 0 (0%) | 0 (0%) | 1 | – | 0% ok · 0 ms |
| 🟡 `gemini` | 3 | 2 (66.7%) | 1 (33.3%) | 0 | 6017 ms | 30% ok · 22640 ms |

## Nuvarande Fallback-ordning

`mistral → cloudflare → groq → deepseek → gemini`

*(Benchmark senast körde: 2026-11-03 10:14 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (942 anrop, 0 rl, 0 err)
  🔴 cloudflare       0% ok   (1 anrop, 0 rl, 1 err)
  🟢 groq             100% ok   (34 anrop, 0 rl, 0 err)
  🔴 deepseek         0% ok   (1 anrop, 0 rl, 1 err)
  🟡 gemini           66.7% ok   (3 anrop, 1 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 2/3 ok (66.7%), 1 rate-limits, 0 errors

## Analys

**AI-providerprestanda senaste 24h:**
Mistral dominerade med 942 anrop (100% ok, 3377 ms), medan Groq hanterade 34 anrop (100% ok, 2408 ms). Cloudflare och Deepseek misslyckades med 1 anrop vardera (0% ok), och Gemini hade 3 anrop (66.7% ok, 1 rate-limit, 6017 ms). **Prioriterad rekommendation:** Fokusera på Mistral och Groq för hög tillgänglighet, med Cloudflare och Deepseek som fallback.
