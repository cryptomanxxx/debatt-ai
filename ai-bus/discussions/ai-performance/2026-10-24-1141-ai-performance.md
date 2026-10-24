---
date: 2026-10-24
type: ai-performance
overall_health_24h: 94.1
overall_health_7d: 94.1
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "mistral"]
ranked_order: ["deepseek", "cloudflare", "groq", "gemini", "mistral"]
config_uppdaterad: "2026-10-24 07:39 UTC"
order_source: "provider_config"
providers_24h:
  deepseek:
    anrop: 834
    ok: 834
    rate_limits: 0
    errors: 0
    snitt_ms: 4147
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 69
    ok: 69
    rate_limits: 0
    errors: 0
    snitt_ms: 1441
  gemini:
    anrop: 60
    ok: 18
    rate_limits: 31
    errors: 11
    snitt_ms: 3315
  mistral:
    anrop: 16
    ok: 0
    rate_limits: 0
    errors: 16
    snitt_ms: null
---

# AI Provider Performance — 2026-10-24

## Hälsostatus

🟢 **94.1%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **94.1%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 69 anrop · 69 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `deepseek` | 834 | 834 (100%) | 0 (0%) | 0 | 4147 ms | 100% ok · 2200 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3480 ms |
| 🟢 `groq` | 69 | 69 (100%) | 0 (0%) | 0 | 1441 ms | 100% ok · 630 ms |
| 🔴 `gemini` | 60 | 18 (30%) | 31 (51.7%) | 11 | 3315 ms | 100% ok · 900 ms |
| 🔴 `mistral` | 16 | 0 (0%) | 0 (0%) | 16 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`deepseek → cloudflare → groq → gemini → mistral`

*(Benchmark senast körde: 2026-10-24 07:39 UTC)*

## 7-Dagars Trend

```
  🟢 deepseek         100% ok   (834 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (69 anrop, 0 rl, 0 err)
  🔴 gemini           30% ok   (60 anrop, 31 rl, 11 err)
  🔴 mistral          0% ok   (16 anrop, 0 rl, 16 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 18/60 ok (30%), 31 rate-limits, 11 errors
- **`mistral`**: 0/16 ok (0%), 0 rate-limits, 16 errors

## Analys

Senaste 24h domineras trafiken helt av deepseek med 834 anrop och 100% ok i 4147 ms, medan groq levererar stabilt på 69 anrop (100% ok, 1441 ms) och cloudflare inte anropats alls trots benchmark på 100% ok. Problemleverantörerna är gemini (60 anrop, endast 30% ok, 31 rate-limits, 3315 ms) och mistral (16 anrop, 0% ok) — båda ligger under 50% ok och bör betraktas som opålitliga i nuvarande konfiguration. Notera att Groqs 9 nycklar sannolikt delar TPD-kvot per konto (~144k), så den extra kapaciteten är inte linjär. Prioriterad rekommendation: flytta gemini och mistral längst bak i fallback-kedjan (eller tillfälligt ur) och verifiera/aktivera cloudflare som tidig buffert mellan deepseek och groq för att avlasta deepseek och minska risken vid rate-limits.
