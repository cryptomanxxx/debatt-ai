---
date: 2026-09-03
type: ai-performance
overall_health_24h: 99.4
overall_health_7d: 99.5
total_calls_24h: 899
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["gemini", "mistral", "deepseek", "cloudflare", "groq"]
config_uppdaterad: "2026-09-03 07:26 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 31
    ok: 26
    rate_limits: 5
    errors: 0
    snitt_ms: 9070
  mistral:
    anrop: 796
    ok: 796
    rate_limits: 0
    errors: 0
    snitt_ms: 2912
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
    anrop: 46
    ok: 46
    rate_limits: 0
    errors: 0
    snitt_ms: 2299
---

# AI Provider Performance — 2026-09-03

## Hälsostatus

🟢 **99.4%** lyckade anrop senaste 24h · 899 anrop totalt
🟢 **99.5%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 46 anrop · 46 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `gemini` | 31 | 26 (83.9%) | 5 (16.1%) | 0 | 9070 ms | 100% ok · 1090 ms |
| 🟢 `mistral` | 796 | 796 (100%) | 0 (0%) | 0 | 2912 ms | 100% ok · 1400 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2390 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4610 ms |
| 🟢 `groq` | 46 | 46 (100%) | 0 (0%) | 0 | 2299 ms | 100% ok · 700 ms |

## Nuvarande Fallback-ordning

`gemini → mistral → deepseek → cloudflare → groq`

*(Benchmark senast körde: 2026-09-03 07:26 UTC)*

## 7-Dagars Trend

```
  🟢 gemini           83.9% ok   (31 anrop, 5 rl, 0 err)
  🟢 mistral          100% ok   (891 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (52 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**AI-providerprestanda senaste 24h:**
Gemini presterade bra med 83,9% lyckade anrop, men upplevde 5 rate-limits. Mistral var stabil med 100% lyckade anrop och låg latens. Groq hade 100% lyckade anrop men färre anrop än förväntat (46 st). Deepseek och Cloudflare användes ej. Groq-kvoten är sannolikt kontospecifik, inte nyckelspecifik.

**Prioriterad rekommendation:** Fokusera på Mistral och Groq för hög tillgänglighet, medan Gemini kräver kvotövervakning.
