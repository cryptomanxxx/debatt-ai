---
date: 2026-09-04
type: ai-performance
overall_health_24h: 96.2
overall_health_7d: 96.2
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-09-04 07:29 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 878
    ok: 878
    rate_limits: 0
    errors: 0
    snitt_ms: 3498
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
    anrop: 38
    ok: 38
    rate_limits: 0
    errors: 0
    snitt_ms: 2240
  gemini:
    anrop: 66
    ok: 29
    rate_limits: 37
    errors: 0
    snitt_ms: 9922
---

# AI Provider Performance — 2026-09-04

## Hälsostatus

🟢 **96.2%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **96.2%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 38 anrop · 38 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 878 | 878 (100%) | 0 (0%) | 0 | 3498 ms | 100% ok · 1200 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2330 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3310 ms |
| 🟢 `groq` | 38 | 38 (100%) | 0 (0%) | 0 | 2240 ms | 100% ok · 660 ms |
| 🔴 `gemini` | 66 | 29 (43.9%) | 37 (56.1%) | 0 | 9922 ms | 100% ok · 6320 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-09-04 07:29 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (878 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (38 anrop, 0 rl, 0 err)
  🔴 gemini           43.9% ok   (66 anrop, 37 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 29/66 ok (43.9%), 37 rate-limits, 0 errors

## Analys

**Prestandaöversikt 24h (debatt-ai.se):**
Mistral och Groq levererade 100% felfria svar med låg latens (3498 ms och 2240 ms), medan Gemini drabbades av 37 rate-limits och 56.1% fel (43.9% ok). DeepSeek och Cloudflare användes ej. Groq hanterade 38 anrop, trots TPD-kvoten per konto (144k tokens). **Prioritera Mistral för stabilitet och Groq för låg latens**, undvik Gemini under hög belastning.
