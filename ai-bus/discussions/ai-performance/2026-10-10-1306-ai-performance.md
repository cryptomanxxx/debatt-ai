---
date: 2026-10-10
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "gemini", "groq"]
config_uppdaterad: "2026-10-10 09:09 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 972
    ok: 972
    rate_limits: 0
    errors: 0
    snitt_ms: 3188
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
  gemini:
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
    snitt_ms: 2078
---

# AI Provider Performance — 2026-10-10

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 18 anrop · 18 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 972 | 972 (100%) | 0 (0%) | 0 | 3188 ms | 100% ok · 1390 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 1650 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3980 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 100% ok · 5500 ms |
| 🟢 `groq` | 18 | 18 (100%) | 0 (0%) | 0 | 2078 ms | 100% ok · 650 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → gemini → groq`

*(Benchmark senast körde: 2026-10-10 09:09 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (972 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (18 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**AI-providerprestanda senaste 24h:**
Mistral dominerade med 972 anrop (100% ok, 3188 ms), medan Groq hanterade 18 anrop (100% ok, 2078 ms) utan rate-limits. Deepseek, Cloudflare och Gemini användes ej, vilket kan bero på prioriteringen av Groq och Mistral. Groq-kvoten (144k TPD per konto) verkar inte ha begränsat kapaciteten, men ytterligare nycklar kan behövas för högre belastning.

**Prioriterad rekommendation:** Fortsätt använda Mistral som primärleverantör och Groq som fallback för låg-latensbehov, men övervaka Groq-kvoten nära realtid.
