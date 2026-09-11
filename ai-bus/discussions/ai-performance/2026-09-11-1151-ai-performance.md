---
date: 2026-09-11
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-09-11 07:32 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 967
    ok: 967
    rate_limits: 0
    errors: 0
    snitt_ms: 3996
  deepseek:
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 366
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 28
    ok: 28
    rate_limits: 0
    errors: 0
    snitt_ms: 2372
  gemini:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-09-11

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 28 anrop · 28 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 967 | 967 (100%) | 0 (0%) | 0 | 3996 ms | 100% ok · 1330 ms |
| 🟢 `deepseek` | 1 | 1 (100%) | 0 (0%) | 0 | 366 ms | 100% ok · 2060 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3500 ms |
| 🟢 `groq` | 28 | 28 (100%) | 0 (0%) | 0 | 2372 ms | 100% ok · 660 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 90% ok · 3650 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-09-11 07:32 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (967 anrop, 0 rl, 0 err)
  🟢 deepseek         100% ok   (1 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (28 anrop, 0 rl, 0 err)
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 90% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**Senaste 24h:** Mistral dominerade med 967 anrop (100% ok, 3996 ms), Groq hanterade 28 anrop (100% ok, 2372 ms), medan Deepseek och Cloudflare var sparsamt använda. Ingen provider upplevde rate-limits eller betydande fel. Groq-kvoten är en potentiell begränsning, men ingen provider har ännu nått kritisk kapacitet.

**Prioriterad rekommendation:** Fortsätt priorisera Mistral för prestanda och Groq för låg-latens scenarier, men övervaka Groq-kvoten närmare.
