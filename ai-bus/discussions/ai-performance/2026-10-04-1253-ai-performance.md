---
date: 2026-10-04
type: ai-performance
overall_health_24h: 95.7
overall_health_7d: 95.7
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-10-04 08:54 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 908
    ok: 908
    rate_limits: 0
    errors: 0
    snitt_ms: 3189
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
    snitt_ms: 1876
  gemini:
    anrop: 60
    ok: 17
    rate_limits: 29
    errors: 14
    snitt_ms: 22373
---

# AI Provider Performance — 2026-10-04

## Hälsostatus

🟢 **95.7%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **95.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 22 anrop · 22 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 908 | 908 (100%) | 0 (0%) | 0 | 3189 ms | 100% ok · 1250 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 1730 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3560 ms |
| 🟢 `groq` | 22 | 22 (100%) | 0 (0%) | 0 | 1876 ms | 100% ok · 630 ms |
| 🔴 `gemini` | 60 | 17 (28.3%) | 29 (48.3%) | 14 | 22373 ms | 100% ok · 880 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-10-04 08:54 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (908 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (22 anrop, 0 rl, 0 err)
  🔴 gemini           28.3% ok   (60 anrop, 29 rl, 14 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 17/60 ok (28.3%), 29 rate-limits, 14 errors

## Analys

**AI-providerprestanda senaste 24h:**
Mistral och Groq presterade utmärkt med 100% lyckade anrop och låg latens, medan Deepseek och Cloudflare inte användes. Gemini hade allvarliga problem med 28,3% lyckade anrop och 29 rate-limits, vilket gör den mindre pålitlig. Groq:s TPD-kvot (144k) verkar gälla per konto, inte per nyckel, så kapaciteten kan vara begränsad.

**Prioriterad rekommendation:** Prioritera Mistral och Groq för stabilitet, men övervaka Gemini och justera fallback-ordningen om problemet kvarstår.
