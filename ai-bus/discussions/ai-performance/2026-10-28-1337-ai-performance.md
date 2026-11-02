---
date: 2026-10-28
type: ai-performance
overall_health_24h: 93.6
overall_health_7d: 93.6
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "mistral"]
ranked_order: ["deepseek", "cloudflare", "groq", "gemini", "mistral"]
config_uppdaterad: "2026-10-28 09:03 UTC"
order_source: "provider_config"
providers_24h:
  deepseek:
    anrop: 801
    ok: 801
    rate_limits: 0
    errors: 0
    snitt_ms: 3803
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 79
    ok: 79
    rate_limits: 0
    errors: 0
    snitt_ms: 3160
  gemini:
    anrop: 77
    ok: 30
    rate_limits: 32
    errors: 15
    snitt_ms: 10983
  mistral:
    anrop: 15
    ok: 0
    rate_limits: 0
    errors: 15
    snitt_ms: null
---

# AI Provider Performance — 2026-10-28

## Hälsostatus

🟢 **93.6%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **93.6%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 79 anrop · 79 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `deepseek` | 801 | 801 (100%) | 0 (0%) | 0 | 3803 ms | 100% ok · 2050 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4470 ms |
| 🟢 `groq` | 79 | 79 (100%) | 0 (0%) | 0 | 3160 ms | 100% ok · 700 ms |
| 🔴 `gemini` | 77 | 30 (39%) | 32 (41.6%) | 15 | 10983 ms | 100% ok · 1010 ms |
| 🔴 `mistral` | 15 | 0 (0%) | 0 (0%) | 15 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`deepseek → cloudflare → groq → gemini → mistral`

*(Benchmark senast körde: 2026-10-28 09:03 UTC)*

## 7-Dagars Trend

```
  🟢 deepseek         100% ok   (801 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (79 anrop, 0 rl, 0 err)
  🔴 gemini           39% ok   (77 anrop, 32 rl, 15 err)
  🔴 mistral          0% ok   (15 anrop, 0 rl, 15 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 30/77 ok (39%), 32 rate-limits, 15 errors
- **`mistral`**: 0/15 ok (0%), 0 rate-limits, 15 errors

## Analys

Senaste 24h dominerar deepseek med 801 anrop och 100% ok i 3,8 s svarstid, medan groq levererar 100% ok på 79 anrop (3,2 s) och cloudflare står oanvänd trots benchmark på 100% ok. Problemleverantörerna är gemini (39% ok, 32 rate-limits, 11 s svarstid) och mistral (0% ok på 15 anrop), vilket drar ner hälsopoängen till 93,6%. Notera att Groqs 9 nycklar sannolikt delar TPD-kvot per konto (~144k), så nyckelantalet ger ingen linjär kapacitetsökning. Prioriterad rekommendation: ta bort eller kraftigt nedprioritera mistral och gemini ur fallback-kedjan och flytta cloudflare före groq — åtgärda mistrals 0%-fel först eftersom det är ett rent funktionsfel, inte kvotproblem.
