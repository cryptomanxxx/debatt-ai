---
date: 2026-07-13
type: ai-performance
overall_health_24h: 100
overall_health_7d: 98.9
total_calls_24h: 699
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "sambanova", "github_models", "cerebras", "gemini"]
config_uppdaterad: "2026-07-13 05:58 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 674
    ok: 674
    rate_limits: 0
    errors: 0
    snitt_ms: 1123
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
    anrop: 19
    ok: 19
    rate_limits: 0
    errors: 0
    snitt_ms: 2312
  sambanova:
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 3264
  github_models:
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

# AI Provider Performance — 2026-07-13

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 699 anrop totalt
🟢 **98.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 19 anrop · 19 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 674 | 674 (100%) | 0 (0%) | 0 | 1123 ms | 100% ok · 1180 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2430 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4500 ms |
| 🟢 `groq` | 19 | 19 (100%) | 0 (0%) | 0 | 2312 ms | 100% ok · 590 ms |
| 🟢 `sambanova` | 1 | 1 (100%) | 0 (0%) | 0 | 3264 ms | 100% ok · 1080 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 40% ok · 4190 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → sambanova → github_models → cerebras → gemini`

*(Benchmark senast körde: 2026-07-13 05:58 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (932 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (43 anrop, 0 rl, 0 err)
  🔴 sambanova        21.4% ok   (14 anrop, 11 rl, 0 err)
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 40% ok
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har debatt‑ai.se haft en hälsopoäng på 100 % (7‑dagsgenomsnitt 98,9 %) och totalt 699 anrop. Mistral dominerade med 674 anrop och levererade 100 % framgång med en genomsnittlig svarstid på 1 123 ms, medan Groq hanterade 19 anrop (100 % ok, 2 312 ms) och Sambanova ett anrop (100 % ok, 3 264 ms). Inga leverantörer nådde kritiska trösklar (>30 % rate‑limit eller <50 % ok), och de övriga (DeepSeek, Cloudflare, Github‑models, Cerebras
