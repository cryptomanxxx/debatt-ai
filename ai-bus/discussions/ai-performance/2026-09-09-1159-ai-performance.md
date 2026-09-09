---
date: 2026-09-09
type: ai-performance
overall_health_24h: 99.4
overall_health_7d: 99.5
total_calls_24h: 909
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["gemini", "mistral", "deepseek", "cloudflare", "groq"]
config_uppdaterad: "2026-09-09 07:37 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 31
    ok: 26
    rate_limits: 5
    errors: 0
    snitt_ms: 13849
  mistral:
    anrop: 818
    ok: 818
    rate_limits: 0
    errors: 0
    snitt_ms: 5056
  deepseek:
    anrop: 7
    ok: 7
    rate_limits: 0
    errors: 0
    snitt_ms: 24275
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 34
    ok: 34
    rate_limits: 0
    errors: 0
    snitt_ms: 2304
---

# AI Provider Performance — 2026-09-09

## Hälsostatus

🟢 **99.4%** lyckade anrop senaste 24h · 909 anrop totalt
🟢 **99.5%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 34 anrop · 34 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `gemini` | 31 | 26 (83.9%) | 5 (16.1%) | 0 | 13849 ms | 100% ok · 890 ms |
| 🟢 `mistral` | 818 | 818 (100%) | 0 (0%) | 0 | 5056 ms | 100% ok · 1540 ms |
| 🟢 `deepseek` | 7 | 7 (100%) | 0 (0%) | 0 | 24275 ms | 100% ok · 2290 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3290 ms |
| 🟢 `groq` | 34 | 34 (100%) | 0 (0%) | 0 | 2304 ms | 100% ok · 690 ms |

## Nuvarande Fallback-ordning

`gemini → mistral → deepseek → cloudflare → groq`

*(Benchmark senast körde: 2026-09-09 07:37 UTC)*

## 7-Dagars Trend

```
  🟢 gemini           83.9% ok   (31 anrop, 5 rl, 0 err)
  🟢 mistral          100% ok   (896 anrop, 0 rl, 0 err)
  🟢 deepseek         100% ok   (7 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (41 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under det senaste dygnet har plattformen uppvis
