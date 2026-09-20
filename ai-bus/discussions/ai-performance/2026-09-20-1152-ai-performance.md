---
date: 2026-09-20
type: ai-performance
overall_health_24h: 94.3
overall_health_7d: 94.3
total_calls_24h: 926
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-09-20 07:58 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 812
    ok: 812
    rate_limits: 0
    errors: 0
    snitt_ms: 3395
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
    anrop: 16
    ok: 16
    rate_limits: 0
    errors: 0
    snitt_ms: 2694
  gemini:
    anrop: 83
    ok: 31
    rate_limits: 35
    errors: 17
    snitt_ms: 15814
---

# AI Provider Performance — 2026-09-20

## Hälsostatus

🟢 **94.3%** lyckade anrop senaste 24h · 926 anrop totalt
🟢 **94.3%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 16 anrop · 16 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 812 | 812 (100%) | 0 (0%) | 0 | 3395 ms | 100% ok · 1490 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 1880 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3900 ms |
| 🟢 `groq` | 16 | 16 (100%) | 0 (0%) | 0 | 2694 ms | 100% ok · 640 ms |
| 🔴 `gemini` | 83 | 31 (37.3%) | 35 (42.2%) | 17 | 15814 ms | 100% ok · 1120 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-09-20 07:58 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (876 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (17 anrop, 0 rl, 0 err)
  🔴 gemini           37.1% ok   (89 anrop, 38 rl, 18 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 31/83 ok (37.3%), 35 rate-limits, 17 errors

## Analys

**AI-providerprestanda senaste 24h:**
Mistral och Groq presterade perfekt (100% OK, låg latens), medan Gemini drabbades av 35 rate-limits och endast 37,3% lyckade anrop. Deepseek och Cloudflare användes ej, men har tidigare visat 100% tillgänglighet. Groq-kvoten är begränsad (144k TPD per konto), så prioritering av anrop är nödvändig. **Prioriterad rekommendation:** Undvik Gemini för kritiska uppgifter; skala Groq-anrop för att utnyttja kvoten effektivt.**
