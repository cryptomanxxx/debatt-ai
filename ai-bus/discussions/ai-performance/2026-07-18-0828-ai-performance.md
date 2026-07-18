---
date: 2026-07-18
type: ai-performance
overall_health_24h: 96
overall_health_7d: 97.4
total_calls_24h: 588
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["mistral", "deepseek", "github_models", "cloudflare", "groq", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-07-18 05:16 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 515
    ok: 515
    rate_limits: 0
    errors: 0
    snitt_ms: 1281
  deepseek:
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
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 33
    ok: 33
    rate_limits: 0
    errors: 0
    snitt_ms: 2423
  sambanova:
    anrop: 34
    ok: 11
    rate_limits: 21
    errors: 2
    snitt_ms: 14831
  cerebras:
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

# AI Provider Performance — 2026-07-18

## Hälsostatus

🟢 **96%** lyckade anrop senaste 24h · 588 anrop totalt
🟢 **97.4%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 33 anrop · 33 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 515 | 515 (100%) | 0 (0%) | 0 | 1281 ms | 100% ok · 1050 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2610 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3090 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4780 ms |
| 🟢 `groq` | 33 | 33 (100%) | 0 (0%) | 0 | 2423 ms | 100% ok · 670 ms |
| 🔴 `sambanova` | 34 | 11 (32.4%) | 21 (61.8%) | 2 | 14831 ms | 0% ok · 0 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → cloudflare → groq → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-07-18 05:16 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (890 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (53 anrop, 0 rl, 0 err)
  🔴 sambanova        45.8% ok   (48 anrop, 24 rl, 2 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 11/34 ok (32.4%), 21 rate-limits, 2 errors

## Analys

Under de senaste 24 timmarna har plattformen haft en hälsopoäng på 96 % och totalt 588 anrop. Mistral har presterat bäst med 515 anrop, 100 % framgång och en medel‑latency på 1 281 ms, medan Groq följde med 33 anrop, också 100 % ok men med längre svarstid (2 423 ms). Sambanova har däremot varit problematisk: endast 32,4 % av 34 anrop lyckades och den drabbades av 21 rate‑limits samt en genomsnittlig latency på 14,8 s. **Rekommendation:** prioritera Mistral som huvudleverantör, förstärk Groq‑kapaciteten med fler nycklar och undvik Sambanova tills dess stabilitet förbättras.
