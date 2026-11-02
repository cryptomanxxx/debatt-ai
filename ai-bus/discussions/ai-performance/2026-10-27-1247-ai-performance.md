---
date: 2026-10-27
type: ai-performance
overall_health_24h: 97
overall_health_7d: 97
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["mistral"]
ranked_order: ["gemini", "deepseek", "cloudflare", "groq", "mistral"]
config_uppdaterad: "2026-10-27 08:26 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 26
    ok: 14
    rate_limits: 3
    errors: 9
    snitt_ms: 19600
  deepseek:
    anrop: 856
    ok: 856
    rate_limits: 0
    errors: 0
    snitt_ms: 4002
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 79
    ok: 79
    rate_limits: 0
    errors: 0
    snitt_ms: 1681
  mistral:
    anrop: 17
    ok: 0
    rate_limits: 0
    errors: 17
    snitt_ms: null
---

# AI Provider Performance — 2026-10-27

## Hälsostatus

🟢 **97%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **97%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 79 anrop · 79 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `gemini` | 26 | 14 (53.8%) | 3 (11.5%) | 9 | 19600 ms | 100% ok · 940 ms |
| 🟢 `deepseek` | 856 | 856 (100%) | 0 (0%) | 0 | 4002 ms | 100% ok · 2300 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3590 ms |
| 🟢 `groq` | 79 | 79 (100%) | 0 (0%) | 0 | 1681 ms | 100% ok · 720 ms |
| 🔴 `mistral` | 17 | 0 (0%) | 0 (0%) | 17 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`gemini → deepseek → cloudflare → groq → mistral`

*(Benchmark senast körde: 2026-10-27 08:26 UTC)*

## 7-Dagars Trend

```
  🟡 gemini           53.8% ok   (26 anrop, 3 rl, 9 err)
  🟢 deepseek         100% ok   (856 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (79 anrop, 0 rl, 0 err)
  🔴 mistral          0% ok   (17 anrop, 0 rl, 17 err)
```

## ⚠️ Problemleverantörer

- **`mistral`**: 0/17 ok (0%), 0 rate-limits, 17 errors

## Analys

Under de senaste 24 timmarna har systemet upprätthållit en stabil hälsopoäng på 97 % över 1 000 anrop, där DeepSeek drog det tyngsta lassset med 856 anrop och 100 % tillgänglighet till en snabb responstid på 4002 ms. Groq levererade bäst prestanda (1681 ms responstid, 100 % ok), medan primära valet Gemini uppvisade höga responstider (19 600 ms) och enbart 53,8 % lyckade anrop. Mistral felade helt (0 % ok på 17 anrop) och Cloudflare aktiverades aldrig via fallback-kedjan. 

**Prioriterad rekommendation:** Justera fallback-ordningen till `groq → deepseek → gemini → cloudflare` samt felsök Mistral-integrationen och utred Geminis höga latens.
