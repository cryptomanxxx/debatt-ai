---
date: 2026-07-03
type: ai-performance
overall_health_24h: 99.7
overall_health_7d: 98.8
total_calls_24h: 686
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["mistral", "deepseek", "github_models", "cloudflare", "groq", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-07-03 06:21 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 654
    ok: 654
    rate_limits: 0
    errors: 0
    snitt_ms: 1210
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
    anrop: 22
    ok: 22
    rate_limits: 0
    errors: 0
    snitt_ms: 2514
  sambanova:
    anrop: 3
    ok: 1
    rate_limits: 2
    errors: 0
    snitt_ms: 3096
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

# AI Provider Performance — 2026-07-03

## Hälsostatus

🟢 **99.7%** lyckade anrop senaste 24h · 686 anrop totalt
🟢 **98.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 22 anrop · 22 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 654 | 654 (100%) | 0 (0%) | 0 | 1210 ms | 100% ok · 1260 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2910 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3150 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4440 ms |
| 🟢 `groq` | 22 | 22 (100%) | 0 (0%) | 0 | 2514 ms | 100% ok · 610 ms |
| 🔴 `sambanova` | 3 | 1 (33.3%) | 2 (66.7%) | 0 | 3096 ms | 100% ok · 910 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → cloudflare → groq → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-07-03 06:21 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (897 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (41 anrop, 0 rl, 0 err)
  🟡 sambanova        77.4% ok   (53 anrop, 12 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 1/3 ok (33.3%), 2 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har plattformen hanterat 686 anrop med en hälsopoäng på 99,7 % (98,8 % över 7 dagar). Mistral har levererat 654 anrop utan några rate‑limits och med en genomsnittlig svarstid på 1,21 s, medan Groq har klarat 22 anrop på 2,51 s utan problem. Sambanova är den enda leverantören som fallit under tröskeln – endast 33 % av de 3 anropen lyckades och två av dem drabbades av rate‑limits med en svarstid på 3,1 s. 

**Rekommendation (prioriterad):** minska beroendet av Sambanova omedelbart (t.ex. genom att minska dess andel i fallback‑kedjan) och förstärk Groq‑kapaciteten genom att lägga till fler nycklar, samtidigt som du fortsätter att prioritera Mistral som huvudleverantör.
