---
date: 2026-09-15
type: ai-performance
overall_health_24h: 96.6
overall_health_7d: 96.6
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-09-15 08:05 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 892
    ok: 892
    rate_limits: 0
    errors: 0
    snitt_ms: 3783
  deepseek:
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 375
  cloudflare:
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
    snitt_ms: 2324
  gemini:
    anrop: 69
    ok: 35
    rate_limits: 34
    errors: 0
    snitt_ms: 10183
---

# AI Provider Performance — 2026-09-15

## Hälsostatus

🟢 **96.6%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **96.6%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 27 anrop · 27 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 892 | 892 (100%) | 0 (0%) | 0 | 3783 ms | 100% ok · 1390 ms |
| 🟢 `deepseek` | 1 | 1 (100%) | 0 (0%) | 0 | 375 ms | 100% ok · 2180 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 5600 ms |
| 🟢 `groq` | 27 | 27 (100%) | 0 (0%) | 0 | 2324 ms | 100% ok · 830 ms |
| 🟡 `gemini` | 69 | 35 (50.7%) | 34 (49.3%) | 0 | 10183 ms | 100% ok · 960 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-09-15 08:05 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (892 anrop, 0 rl, 0 err)
  🟢 deepseek         100% ok   (1 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (27 anrop, 0 rl, 0 err)
  🟡 gemini           50.7% ok   (69 anrop, 34 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 35/69 ok (50.7%), 34 rate-limits, 0 errors

## Analys

**Senaste 24h:** Mistral och Groq dominerade med 892 respektive 27 anrop, båda med 100% lyckade svar och låg latens. Deepseek och Cloudflare hade låg trafik, medan Gemini drabbades av 34 rate-limits och 50,7% misslyckade svar. Groq-nycklarna har hög kapacitet, men TPD-kvoten är kontospecifik. **Prioritera Mistral för stabilitet och Groq för hastighet, undvik Gemini vid hög belastning.**
