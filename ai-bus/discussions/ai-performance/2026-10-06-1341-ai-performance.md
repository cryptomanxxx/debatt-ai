---
date: 2026-10-06
type: ai-performance
overall_health_24h: 95.2
overall_health_7d: 95.5
total_calls_24h: 886
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["deepseek", "mistral", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-10-06 09:30 UTC"
order_source: "provider_config"
providers_24h:
  deepseek:
    anrop: 740
    ok: 740
    rate_limits: 0
    errors: 0
    snitt_ms: 3738
  mistral:
    anrop: 27
    ok: 27
    rate_limits: 0
    errors: 0
    snitt_ms: 5005
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 31
    ok: 31
    rate_limits: 0
    errors: 0
    snitt_ms: 2131
  gemini:
    anrop: 60
    ok: 19
    rate_limits: 23
    errors: 18
    snitt_ms: 11634
---

# AI Provider Performance — 2026-10-06

## Hälsostatus

🟢 **95.2%** lyckade anrop senaste 24h · 886 anrop totalt
🟢 **95.5%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 31 anrop · 31 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `deepseek` | 740 | 740 (100%) | 0 (0%) | 0 | 3738 ms | 100% ok · 1700 ms |
| 🟢 `mistral` | 27 | 27 (100%) | 0 (0%) | 0 | 5005 ms | 100% ok · 1740 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3760 ms |
| 🟢 `groq` | 31 | 31 (100%) | 0 (0%) | 0 | 2131 ms | 100% ok · 650 ms |
| 🔴 `gemini` | 60 | 19 (31.7%) | 23 (38.3%) | 18 | 11634 ms | 100% ok · 2080 ms |

## Nuvarande Fallback-ordning

`deepseek → mistral → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-10-06 09:30 UTC)*

## 7-Dagars Trend

```
  🟢 deepseek         100% ok   (842 anrop, 0 rl, 0 err)
  🟢 mistral          100% ok   (30 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (34 anrop, 0 rl, 0 err)
  🔴 gemini           30.2% ok   (63 anrop, 26 rl, 18 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 19/60 ok (31.7%), 23 rate-limits, 18 errors

## Analys

Senaste 24h ligger den totala hälsopoängen på 95,2% (7d: 95,5%) över 886 anrop, där deepseek bär huvuddelen med 740 anrop och 100% ok utan rate-limits, medan groq levererar snabbast (2131 ms) på 31 anrop och mistral ligger stabilt på 100% ok men långsamt (5005 ms). Cloudflare är fortsatt oanvänd i produktion (0 anrop) trots benchmark på 100% ok, vilket innebär outnyttjad kapacitet i fallback-kedjan. Den tydliga problemleverantören är gemini med endast 31,7% ok, 23 rate-limits och 11 634 ms svarstid — långt över tröskeln för >30% rate-limits. Notera även att Groqs 9 nycklar sannolikt delar TPD-kvot per konto (~144k), så kapaciteten skalar inte linjärt. Prioriterad rekommendation: ta bort eller kraftigt nedprioritera gemini ur fallback-ordningen och aktivera cloudflare som ersättare, samt verifiera Groq-kontostruktur för att undvika kvotöverraskningar.
