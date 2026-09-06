---
date: 2026-09-06
type: ai-performance
overall_health_24h: 95.9
overall_health_7d: 95.9
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-09-06 07:21 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 886
    ok: 886
    rate_limits: 0
    errors: 0
    snitt_ms: 4084
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
    anrop: 34
    ok: 34
    rate_limits: 0
    errors: 0
    snitt_ms: 2096
  gemini:
    anrop: 66
    ok: 26
    rate_limits: 40
    errors: 0
    snitt_ms: 12019
---

# AI Provider Performance — 2026-09-06

## Hälsostatus

🟢 **95.9%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **95.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 34 anrop · 34 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 886 | 886 (100%) | 0 (0%) | 0 | 4084 ms | 100% ok · 1390 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2150 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3130 ms |
| 🟢 `groq` | 34 | 34 (100%) | 0 (0%) | 0 | 2096 ms | 100% ok · 620 ms |
| 🔴 `gemini` | 66 | 26 (39.4%) | 40 (60.6%) | 0 | 12019 ms | 100% ok · 910 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-09-06 07:21 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (886 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (34 anrop, 0 rl, 0 err)
  🔴 gemini           39.4% ok   (66 anrop, 40 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 26/66 ok (39.4%), 40 rate-limits, 0 errors

## Analys

**Prestandaöversikt senaste 24h:**
Mistral och Groq presterade perfekt med 100% lyckade anrop och låg latens, medan Gemini drabbades av 40 rate-limits och 39,4% felaktiga svar. Deepseek och Cloudflare användes ej, men är konfigurerade som fallback. Groq-kvoten är kritisk med ~144k TPD per konto, inte per nyckel.

**Prioriterad rekommendation:** Prioritera Mistral och Groq för stabilitet, övervaka Gemini-kvoter och justera fallback-ordningen om Groq-kapaciteten blir begränsande.
