---
date: 2026-07-20
type: ai-performance
overall_health_24h: 99.6
overall_health_7d: 99.6
total_calls_24h: 569
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "github_models", "groq", "sambanova", "cloudflare", "cerebras", "gemini"]
config_uppdaterad: "2026-07-20 06:00 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 528
    ok: 528
    rate_limits: 0
    errors: 0
    snitt_ms: 1035
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
  groq:
    anrop: 27
    ok: 27
    rate_limits: 0
    errors: 0
    snitt_ms: 2373
  sambanova:
    anrop: 7
    ok: 5
    rate_limits: 2
    errors: 0
    snitt_ms: 3285
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

# AI Provider Performance — 2026-07-20

## Hälsostatus

🟢 **99.6%** lyckade anrop senaste 24h · 569 anrop totalt
🟢 **99.6%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 27 anrop · 27 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 528 | 528 (100%) | 0 (0%) | 0 | 1035 ms | 100% ok · 1270 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2300 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3380 ms |
| 🟢 `groq` | 27 | 27 (100%) | 0 (0%) | 0 | 2373 ms | 100% ok · 590 ms |
| 🟡 `sambanova` | 7 | 5 (71.4%) | 2 (28.6%) | 0 | 3285 ms | 100% ok · 900 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 80% ok · 4140 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → groq → sambanova → cloudflare → cerebras → gemini`

*(Benchmark senast körde: 2026-07-20 06:00 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (917 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (53 anrop, 0 rl, 0 err)
  🟡 sambanova        71.4% ok   (14 anrop, 4 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 80% ok
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen hanterat 569 anrop med en hälsopoäng på 99,6 % både för 24 h och 7 dagars intervall. Mistral dominerade med 528 anrop och 100 % lyckade svar (genomsnittlig svarstid 1 035 ms), medan Groq levererade 27 anrop utan rate‑limits men med en längre svarstid på 2 373 ms. Sambanova visar den enda betydande problembilden: endast 71,4 % av 7 anropen lyckades och två av dem drabbades av rate‑limits (genomsnittlig svarstid 3 285 ms). **Rekommendation:** prioritera Mistral som primär leverantör, håll Groq som sekundär backup och avvakta med Sambanova tills deras rate‑limit‑ och framgångsfrekvens förbättras.
