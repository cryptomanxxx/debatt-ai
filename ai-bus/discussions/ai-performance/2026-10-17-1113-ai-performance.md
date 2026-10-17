---
date: 2026-10-17
type: ai-performance
overall_health_24h: 98.4
overall_health_7d: 98.4
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["gemini", "mistral", "deepseek", "cloudflare", "groq"]
config_uppdaterad: "2026-10-17 07:15 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 28
    ok: 12
    rate_limits: 3
    errors: 13
    snitt_ms: 7705
  mistral:
    anrop: 950
    ok: 950
    rate_limits: 0
    errors: 0
    snitt_ms: 3185
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
    anrop: 18
    ok: 18
    rate_limits: 0
    errors: 0
    snitt_ms: 1658
---

# AI Provider Performance — 2026-10-17

## Hälsostatus

🟢 **98.4%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **98.4%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 18 anrop · 18 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🔴 `gemini` | 28 | 12 (42.9%) | 3 (10.7%) | 13 | 7705 ms | 100% ok · 950 ms |
| 🟢 `mistral` | 950 | 950 (100%) | 0 (0%) | 0 | 3185 ms | 100% ok · 1110 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 1950 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3180 ms |
| 🟢 `groq` | 18 | 18 (100%) | 0 (0%) | 0 | 1658 ms | 100% ok · 670 ms |

## Nuvarande Fallback-ordning

`gemini → mistral → deepseek → cloudflare → groq`

*(Benchmark senast körde: 2026-10-17 07:15 UTC)*

## 7-Dagars Trend

```
  🔴 gemini           42.9% ok   (28 anrop, 3 rl, 13 err)
  🟢 mistral          100% ok   (950 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (18 anrop, 0 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 12/28 ok (42.9%), 3 rate-limits, 13 errors

## Analys

**AI-providerprestanda senaste 24h:**
Gemini har låg tillgänglighet (42,9% OK) och upplevt tre rate-limits, medan Mistral och Groq visar 100% tillgänglighet utan begränsningar. Deepseek och Cloudflare har inte använts. Groq har hög kapacitet (144k TPD-kvot per konto), men kvoten är kontospecifik, inte nyckelspecifik.

**Prioriterad rekommendation:**
Prioritera Mistral och Groq för stabilitet och Groq för hög kapacitet. Undvik Gemini under nuvarande belastning.
