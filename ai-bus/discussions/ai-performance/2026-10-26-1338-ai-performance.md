---
date: 2026-10-26
type: ai-performance
overall_health_24h: 98.4
overall_health_7d: 98.5
total_calls_24h: 969
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["mistral"]
ranked_order: ["deepseek", "groq", "cloudflare", "gemini", "mistral"]
config_uppdaterad: "2026-10-26 08:11 UTC"
order_source: "provider_config"
providers_24h:
  deepseek:
    anrop: 860
    ok: 860
    rate_limits: 0
    errors: 0
    snitt_ms: 4056
  groq:
    anrop: 72
    ok: 72
    rate_limits: 0
    errors: 0
    snitt_ms: 1075
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  gemini:
    anrop: 14
    ok: 12
    rate_limits: 1
    errors: 1
    snitt_ms: 3793
  mistral:
    anrop: 13
    ok: 0
    rate_limits: 0
    errors: 13
    snitt_ms: null
---

# AI Provider Performance — 2026-10-26

## Hälsostatus

🟢 **98.4%** lyckade anrop senaste 24h · 969 anrop totalt
🟢 **98.5%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 72 anrop · 72 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `deepseek` | 860 | 860 (100%) | 0 (0%) | 0 | 4056 ms | 100% ok · 2220 ms |
| 🟢 `groq` | 72 | 72 (100%) | 0 (0%) | 0 | 1075 ms | 100% ok · 690 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4210 ms |
| 🟢 `gemini` | 14 | 12 (85.7%) | 1 (7.1%) | 1 | 3793 ms | 100% ok · 940 ms |
| 🔴 `mistral` | 13 | 0 (0%) | 0 (0%) | 13 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`deepseek → groq → cloudflare → gemini → mistral`

*(Benchmark senast körde: 2026-10-26 08:11 UTC)*

## 7-Dagars Trend

```
  🟢 deepseek         100% ok   (888 anrop, 0 rl, 0 err)
  🟢 groq             100% ok   (73 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 gemini           85.7% ok   (14 anrop, 1 rl, 1 err)
  🔴 mistral          0% ok   (13 anrop, 0 rl, 13 err)
```

## ⚠️ Problemleverantörer

- **`mistral`**: 0/13 ok (0%), 0 rate-limits, 13 errors

## Analys

Senaste 24h visar stabil drift med 98,4% hälsopoäng och 969 anrop, där deepseek dominerar trafiken (860 anrop, 100% ok, 4056 ms) medan groq levererar snabbast svar (72 anrop, 100% ok, 1075 ms). Gemini har försämrad kvalitet (14 anrop, 85,7% ok, 1 rate-limit) och mistral är den tydliga problemleverantören med 0% ok på 13 anrop. Cloudflare är fortsatt oanropad trots benchmark på 100% ok, vilket innebär outnyttjad kapacitet i fallback-kedjan. Notera även att Groqs 9 nycklar sannolikt delar TPD-kvot per konto (~144k), så kapaciteten skalar inte linjärt. **Prioriterad rekommendation: ta bort eller ersätt mistral i fallback-ordningen omedelbart och flytta upp cloudflare före gemini för att minska risken för felkedjor.**
