---
date: 2026-08-30
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 629
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "sambanova", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-30 08:36 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 571
    ok: 571
    rate_limits: 0
    errors: 0
    snitt_ms: 1150
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
    anrop: 24
    ok: 24
    rate_limits: 0
    errors: 0
    snitt_ms: 2284
  sambanova:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  cerebras:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  github_models:
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
---

# AI Provider Performance — 2026-08-30

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 629 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 24 anrop · 24 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 571 | 571 (100%) | 0 (0%) | 0 | 1150 ms | 100% ok · 1140 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2510 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3210 ms |
| 🟢 `groq` | 24 | 24 (100%) | 0 (0%) | 0 | 2284 ms | 100% ok · 630 ms |
| ⚪ `sambanova` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → sambanova → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-30 08:36 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (918 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (45 anrop, 0 rl, 0 err)
  ⚪ sambanova        ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**AI-provider-prestanda senaste 24h:**
Mistral och Groq presterade perfekt med 100% tillgänglighet och noll rate-limits, medan Mistral svarade snabbt (1150 ms) och Groq något långsammare (2284 ms). Deepseek, Cloudflare och andra providers användes inte, vilket kan bero på prioritering eller kvotbegränsningar. Groqs TPD-kvot (144k) verkar gälla per konto, inte per nyckel, vilket kan påverka kapaciteten.

**Prioriterad rekommendation:** Fokusera på Mistral för snabbhet och Groq för hög prestanda, men övervaka Groqs kvotanvändning för att undvika begränsningar.
