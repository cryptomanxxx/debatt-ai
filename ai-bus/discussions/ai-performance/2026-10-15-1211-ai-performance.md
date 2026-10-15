---
date: 2026-10-15
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "gemini", "groq"]
config_uppdaterad: "2026-10-15 07:47 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 966
    ok: 966
    rate_limits: 0
    errors: 0
    snitt_ms: 3263
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
    anrop: 22
    ok: 22
    rate_limits: 0
    errors: 0
    snitt_ms: 1963
---

# AI Provider Performance — 2026-10-15

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 22 anrop · 22 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 966 | 966 (100%) | 0 (0%) | 0 | 3263 ms | 100% ok · 1700 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2080 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3820 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 90% ok · 4250 ms |
| 🟢 `groq` | 22 | 22 (100%) | 0 (0%) | 0 | 1963 ms | 100% ok · 690 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → gemini → groq`

*(Benchmark senast körde: 2026-10-15 07:47 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (966 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 90% ok
  🟢 groq             100% ok   (22 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**Sammanfattning av AI-provider-prestanda senaste 24h:**
Mistral dominerade med 966 anrop (100% ok, 3263 ms), medan Groq hanterade 22 anrop (100% ok, 1963 ms) utan rate-limits. Deepseek, Cloudflare och Gemini användes ej, men har tidigare visat 100% och 90% ok-rater. Groq-kvoten är begränsad per konto, inte per nyckel, och kan orsaka begränsad kapacitet. **Prioritera Mistral för stabilitet och Groq för låg latens, men övervaka Groq-kvoten.**

*(Hälsopoäng 100% 24h/7d, inga problemleverantörer.)*
