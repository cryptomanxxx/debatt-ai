---
date: 2026-07-16
type: ai-performance
overall_health_24h: 100
overall_health_7d: 99.9
total_calls_24h: 521
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "github_models", "sambanova", "cloudflare", "groq", "cerebras", "gemini"]
config_uppdaterad: "2026-07-16 05:32 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 476
    ok: 476
    rate_limits: 0
    errors: 0
    snitt_ms: 1121
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
  sambanova:
    anrop: 7
    ok: 7
    rate_limits: 0
    errors: 0
    snitt_ms: 3253
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 26
    ok: 26
    rate_limits: 0
    errors: 0
    snitt_ms: 1901
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

# AI Provider Performance — 2026-07-16

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 521 anrop totalt
🟢 **99.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 26 anrop · 26 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 476 | 476 (100%) | 0 (0%) | 0 | 1121 ms | 100% ok · 1300 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2540 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2890 ms |
| 🟢 `sambanova` | 7 | 7 (100%) | 0 (0%) | 0 | 3253 ms | 100% ok · 1900 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 5720 ms |
| 🟢 `groq` | 26 | 26 (100%) | 0 (0%) | 0 | 1901 ms | 100% ok · 660 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → sambanova → cloudflare → groq → cerebras → gemini`

*(Benchmark senast körde: 2026-07-16 05:32 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (919 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  🟢 sambanova        92.9% ok   (14 anrop, 1 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (47 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har hela plattformen haft en hälsopoäng på 100 % (99,9 % på 7 dagar) och hanterat 521 anrop utan några rate‑limits eller fel. Mistral dominerade med 476 anrop och en genomsnittlig svarstid på 1 121 ms, medan Sambanova levererade 7 anrop med relativt hög latens (3 253 ms) och Groq 26 anrop på 1 901 ms – alla med 100 % framgång. Inga leverantörer har överskridit 30 % av den tillåtna belastningsgränsen eller fallit under 50 % OK‑nivå, så
