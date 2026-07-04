---
date: 2026-07-04
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 712
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["sambanova", "mistral", "deepseek", "github_models", "cloudflare", "groq", "cerebras", "gemini"]
config_uppdaterad: "2026-07-04 06:07 UTC"
order_source: "provider_config"
providers_24h:
  sambanova:
    anrop: 30
    ok: 30
    rate_limits: 0
    errors: 0
    snitt_ms: 1161
  mistral:
    anrop: 653
    ok: 653
    rate_limits: 0
    errors: 0
    snitt_ms: 1106
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
    anrop: 24
    ok: 24
    rate_limits: 0
    errors: 0
    snitt_ms: 2371
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

# AI Provider Performance — 2026-07-04

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 712 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 24 anrop · 24 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `sambanova` | 30 | 30 (100%) | 0 (0%) | 0 | 1161 ms | 100% ok · 1120 ms |
| 🟢 `mistral` | 653 | 653 (100%) | 0 (0%) | 0 | 1106 ms | 100% ok · 1140 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2580 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2930 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3270 ms |
| 🟢 `groq` | 24 | 24 (100%) | 0 (0%) | 0 | 2371 ms | 100% ok · 800 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`sambanova → mistral → deepseek → github_models → cloudflare → groq → cerebras → gemini`

*(Benchmark senast körde: 2026-07-04 06:07 UTC)*

## 7-Dagars Trend

```
  🟢 sambanova        100% ok   (31 anrop, 0 rl, 0 err)
  🟢 mistral          100% ok   (918 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (42 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har alla AI‑leverantörer presterat utan avbrott (hälsopoäng 100 % både 24 h och 7 d). Mistral dominerade med 653 anrop och en genomsnittlig svarstid på 1 106 ms, medan Sambanova levererade 30 anrop på 1 161 ms – båda utan rate‑limits. Groq hanterade 24 anrop men med en högre latens på 2 371 ms, och de övriga leverantörerna har ännu inte använts. **Rekommendation:** prioritera Mistral för högvolym‑tjänster, håll Sambanova som sekundär backup och övervaka Groq‑latensen noggrant innan
