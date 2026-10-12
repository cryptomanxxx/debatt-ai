---
date: 2026-10-12
type: ai-performance
overall_health_24h: 95.8
overall_health_7d: 95.9
total_calls_24h: 957
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-10-12 09:51 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 862
    ok: 862
    rate_limits: 0
    errors: 0
    snitt_ms: 2873
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
    anrop: 22
    ok: 22
    rate_limits: 0
    errors: 0
    snitt_ms: 2316
  gemini:
    anrop: 59
    ok: 19
    rate_limits: 26
    errors: 14
    snitt_ms: 8252
---

# AI Provider Performance — 2026-10-12

## Hälsostatus

🟢 **95.8%** lyckade anrop senaste 24h · 957 anrop totalt
🟢 **95.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 22 anrop · 22 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 862 | 862 (100%) | 0 (0%) | 0 | 2873 ms | 100% ok · 1440 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 1990 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3950 ms |
| 🟢 `groq` | 22 | 22 (100%) | 0 (0%) | 0 | 2316 ms | 100% ok · 680 ms |
| 🔴 `gemini` | 59 | 19 (32.2%) | 26 (44.1%) | 14 | 8252 ms | 100% ok · 950 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-10-12 09:51 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (905 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (22 anrop, 0 rl, 0 err)
  🔴 gemini           32.2% ok   (59 anrop, 26 rl, 14 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 19/59 ok (32.2%), 26 rate-limits, 14 errors

## Analys

**AI-providerprestanda senaste 24h:**
Mistral och Groq presterade perfekt (100% OK, låg latens), medan Gemini hade 32,2% fel och 26 rate-limits. Deepseek och Cloudflare användes ej, vilket kan bero på prioriteringen. Groq har hög kapacitet (144k TPD per konto), men fler nycklar krävs för linjär skalning. **Prioritera Groq och Mistral för hög tillgänglighet, undvik Gemini under belastning.**
