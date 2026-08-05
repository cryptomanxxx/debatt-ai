---
date: 2026-08-05
type: ai-performance
overall_health_24h: 96.9
overall_health_7d: 97.6
total_calls_24h: 685
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "sambanova", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-05 05:36 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 629
    ok: 629
    rate_limits: 0
    errors: 0
    snitt_ms: 1096
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
    anrop: 29
    ok: 29
    rate_limits: 0
    errors: 0
    snitt_ms: 1999
  sambanova:
    anrop: 21
    ok: 0
    rate_limits: 21
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

# AI Provider Performance — 2026-08-05

## Hälsostatus

🟢 **96.9%** lyckade anrop senaste 24h · 685 anrop totalt
🟢 **97.6%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 29 anrop · 29 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 629 | 629 (100%) | 0 (0%) | 0 | 1096 ms | 100% ok · 1160 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2800 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3560 ms |
| 🟢 `groq` | 29 | 29 (100%) | 0 (0%) | 0 | 1999 ms | 100% ok · 730 ms |
| 🔴 `sambanova` | 21 | 0 (0%) | 21 (100%) | 0 | – | 0% ok · 0 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → sambanova → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-05 05:36 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (909 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (48 anrop, 0 rl, 0 err)
  🔴 sambanova        29.4% ok   (34 anrop, 24 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 0/21 ok (0%), 21 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har plattformen hanterat 685 anrop med en hälsopoäng på 96,9 % (7‑dagsgenomsnitt 97,6 %). Mistral dominerade med 629 anrop, 100 % framgång och en svarstid på ca 1,1 s, medan Groq levererade 29 anrop utan fel men med en högre latens på ca 2 s. Sambanova misslyckades helt (21 % rate‑limits) och bör därför ses som kritisk. **Rekommendation:** prioritera Mistral som primär leverantör, behåll Groq som sekundär fallback och inaktivera Sambanova tills dess begränsningsproblem är lösta.
