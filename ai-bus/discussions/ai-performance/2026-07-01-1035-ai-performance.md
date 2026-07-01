---
date: 2026-07-01
type: ai-performance
overall_health_24h: 99.7
overall_health_7d: 99.8
total_calls_24h: 667
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["sambanova", "mistral", "groq", "deepseek", "github_models", "cloudflare", "cerebras", "gemini"]
config_uppdaterad: "2026-07-01 07:02 UTC"
order_source: "provider_config"
providers_24h:
  sambanova:
    anrop: 21
    ok: 19
    rate_limits: 2
    errors: 0
    snitt_ms: 2250
  mistral:
    anrop: 607
    ok: 607
    rate_limits: 0
    errors: 0
    snitt_ms: 1300
  groq:
    anrop: 36
    ok: 36
    rate_limits: 0
    errors: 0
    snitt_ms: 2358
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

# AI Provider Performance — 2026-07-01

## Hälsostatus

🟢 **99.7%** lyckade anrop senaste 24h · 667 anrop totalt
🟢 **99.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 36 anrop · 36 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `sambanova` | 21 | 19 (90.5%) | 2 (9.5%) | 0 | 2250 ms | 100% ok · 1270 ms |
| 🟢 `mistral` | 607 | 607 (100%) | 0 (0%) | 0 | 1300 ms | 100% ok · 1790 ms |
| 🟢 `groq` | 36 | 36 (100%) | 0 (0%) | 0 | 2358 ms | 100% ok · 590 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2950 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2980 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3460 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`sambanova → mistral → groq → deepseek → github_models → cloudflare → cerebras → gemini`

*(Benchmark senast körde: 2026-07-01 07:02 UTC)*

## 7-Dagars Trend

```
  🟢 sambanova        90.5% ok   (21 anrop, 2 rl, 0 err)
  🟢 mistral          100% ok   (918 anrop, 0 rl, 0 err)
  🟢 groq             100% ok   (58 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen hanterat 667 anrop med en hälsopoäng på 99,7 %. Mistral dominerade med 607 anrop, 100 % framgång och den kortaste svarstiden (≈1 300 ms). Sambanova levererade 21 anrop men hade en lägre framgångsgrad (90,5 %) och två rate‑limits, samt en svarstid på cirka 2 250 ms. Groq presterade också felfritt (36 anrop, 100 % ok) men med högre latency (≈2 360 ms). **Rekommendation:** prioritera Mistral som huvudleverantör, håll ett öga på Sambanova‑rate‑limits och överväg att distribuera fler Groq‑nycklar om du behöver lägre latency för framtida belastning.
