---
date: 2026-11-06
type: ai-performance
overall_health_24h: 98.1
overall_health_7d: 98.1
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["gemini", "mistral", "cloudflare", "groq", "deepseek"]
config_uppdaterad: "2026-11-06 10:00 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 41
    ok: 22
    rate_limits: 13
    errors: 6
    snitt_ms: 2660
  mistral:
    anrop: 920
    ok: 920
    rate_limits: 0
    errors: 0
    snitt_ms: 2899
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 30
    ok: 30
    rate_limits: 0
    errors: 0
    snitt_ms: 2128
  deepseek:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-11-06

## Hälsostatus

🟢 **98.1%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **98.1%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 30 anrop · 30 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `gemini` | 41 | 22 (53.7%) | 13 (31.7%) | 6 | 2660 ms | 100% ok · 1000 ms |
| 🟢 `mistral` | 920 | 920 (100%) | 0 (0%) | 0 | 2899 ms | 100% ok · 1220 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 6630 ms |
| 🟢 `groq` | 30 | 30 (100%) | 0 (0%) | 0 | 2128 ms | 100% ok · 670 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`gemini → mistral → cloudflare → groq → deepseek`

*(Benchmark senast körde: 2026-11-06 10:00 UTC)*

## 7-Dagars Trend

```
  🟡 gemini           53.7% ok   (41 anrop, 13 rl, 6 err)
  🟢 mistral          100% ok   (920 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (30 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`gemini`**: 22/41 ok (53.7%), 13 rate-limits, 6 errors

## Analys

Systemet uppvisar en stabil övergripande hälsopoäng på 98,1 % under det senaste dygnet, där Mistral har dragit det tyngsta lass med 920 anrop och 100 % tillgänglighet. Däremot presterar primärleverantören Gemini kritiskt dåligt med enbart 53,7 % godkända anrop och 13 rate-limits, vilket tvingat systemet till täta fallbacks. Groq
