---
date: 2026-10-20
type: ai-performance
overall_health_24h: 95.9
overall_health_7d: 95.9
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-10-20 07:59 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 911
    ok: 911
    rate_limits: 0
    errors: 0
    snitt_ms: 3731
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
    anrop: 17
    ok: 17
    rate_limits: 0
    errors: 0
    snitt_ms: 1888
  gemini:
    anrop: 60
    ok: 19
    rate_limits: 32
    errors: 9
    snitt_ms: 5509
---

# AI Provider Performance — 2026-10-20

## Hälsostatus

🟢 **95.9%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **95.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 17 anrop · 17 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 911 | 911 (100%) | 0 (0%) | 0 | 3731 ms | 100% ok · 1280 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2460 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4420 ms |
| 🟢 `groq` | 17 | 17 (100%) | 0 (0%) | 0 | 1888 ms | 100% ok · 680 ms |
| 🔴 `gemini` | 60 | 19 (31.7%) | 32 (53.3%) | 9 | 5509 ms | 100% ok · 830 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-10-20 07:59 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (911 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (17 anrop, 0 rl, 0 err)
  🔴 gemini           31.7% ok   (60 anrop, 32 rl, 9 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 19/60 ok (31.7%), 32 rate-limits, 9 errors

## Analys

**AI-providerprestanda senaste 24h:**
Groq och Mistral har visat stabil prestanda med 100% lyckade anrop och låg latens, medan Gemini drabbats av 32 rate-limits och endast 31,7% lyckade svar. Deepseek och Cloudflare har ej anropats, men deras benchmark visar 100% tillgänglighet. Groq har 9 nycklar konfigurerade, men TPD-kvoten är oklar per nyckel. **Prioriterad rekommendation:** Undvik Gemini för kritiska uppgifter; prioriter Groq och Mistral för låg latens och hög tillgänglighet.
