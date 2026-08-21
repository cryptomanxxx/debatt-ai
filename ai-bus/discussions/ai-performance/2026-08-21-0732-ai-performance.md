---
date: 2026-08-21
type: ai-performance
overall_health_24h: 100
overall_health_7d: 99.9
total_calls_24h: 587
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "sambanova", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-21 03:41 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 555
    ok: 555
    rate_limits: 0
    errors: 0
    snitt_ms: 1544
  deepseek:
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 359
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 23
    ok: 23
    rate_limits: 0
    errors: 0
    snitt_ms: 2430
  sambanova:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  cerebras:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  github_models:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  gemini:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-08-21

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 587 anrop totalt
🟢 **99.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 23 anrop · 23 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 555 | 555 (100%) | 0 (0%) | 0 | 1544 ms | 100% ok · 1620 ms |
| 🟢 `deepseek` | 1 | 1 (100%) | 0 (0%) | 0 | 359 ms | 100% ok · 2740 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3620 ms |
| 🟢 `groq` | 23 | 23 (100%) | 0 (0%) | 0 | 2430 ms | 100% ok · 760 ms |
| ⚪ `sambanova` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → sambanova → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-21 03:41 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (940 anrop, 0 rl, 0 err)
  🟢 deepseek         100% ok   (2 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             97.7% ok   (44 anrop, 0 rl, 1 err)
  ⚪ sambanova        ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.
