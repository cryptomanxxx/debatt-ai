---
date: 2026-08-31
type: ai-performance
overall_health_24h: 99.6
overall_health_7d: 99.8
total_calls_24h: 463
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["gemini", "mistral", "deepseek", "cloudflare", "groq"]
config_uppdaterad: "2026-08-31 08:57 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 24
    ok: 22
    rate_limits: 2
    errors: 0
    snitt_ms: 7509
  mistral:
    anrop: 414
    ok: 414
    rate_limits: 0
    errors: 0
    snitt_ms: 1056
  deepseek:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 21
    ok: 21
    rate_limits: 0
    errors: 0
    snitt_ms: 2343
---

# AI Provider Performance — 2026-08-31

## Hälsostatus

🟢 **99.6%** lyckade anrop senaste 24h · 463 anrop totalt
🟢 **99.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 21 anrop · 21 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `gemini` | 24 | 22 (91.7%) | 2 (8.3%) | 0 | 7509 ms | 100% ok · 920 ms |
| 🟢 `mistral` | 414 | 414 (100%) | 0 (0%) | 0 | 1056 ms | 100% ok · 1150 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2380 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3950 ms |
| 🟢 `groq` | 21 | 21 (100%) | 0 (0%) | 0 | 2343 ms | 100% ok · 660 ms |

## Nuvarande Fallback-ordning

`gemini → mistral → deepseek → cloudflare → groq`

*(Benchmark senast körde: 2026-08-31 08:57 UTC)*

## 7-Dagars Trend

```
  🟢 gemini           91.7% ok   (24 anrop, 2 rl, 0 err)
  🟢 mistral          100% ok   (895 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (45 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under det senaste dygnet har plattformen upp
