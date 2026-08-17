---
date: 2026-08-17
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 540
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "sambanova", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-17 03:39 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 508
    ok: 508
    rate_limits: 0
    errors: 0
    snitt_ms: 997
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
    snitt_ms: 2447
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

# AI Provider Performance — 2026-08-17

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 540 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 21 anrop · 21 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 508 | 508 (100%) | 0 (0%) | 0 | 997 ms | 100% ok · 970 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2690 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3420 ms |
| 🟢 `groq` | 21 | 21 (100%) | 0 (0%) | 0 | 2447 ms | 100% ok · 670 ms |
| ⚪ `sambanova` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → sambanova → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-17 03:39 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (938 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (42 anrop, 0 rl, 0 err)
  ⚪ sambanova        ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har debatt‑ai.se haft 540 anrop med full systemhälsa (100 % både 24 h och 7 d). Mistral har stått för majoriteten av trafiken (508 anrop) och levererat 100 % framgång med en genomsnittlig svarstid på 997 ms utan några rate‑limits. Groq har hanterat 21 anrop, också med 100 % framgång
