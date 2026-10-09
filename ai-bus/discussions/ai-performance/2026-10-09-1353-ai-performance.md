---
date: 2026-10-09
type: ai-performance
overall_health_24h: 95.7
overall_health_7d: 95.7
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-10-09 09:43 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 904
    ok: 904
    rate_limits: 0
    errors: 0
    snitt_ms: 3519
  deepseek:
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 408
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 19
    ok: 19
    rate_limits: 0
    errors: 0
    snitt_ms: 1811
  gemini:
    anrop: 66
    ok: 23
    rate_limits: 32
    errors: 11
    snitt_ms: 8421
---

# AI Provider Performance — 2026-10-09

## Hälsostatus

🟢 **95.7%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **95.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 19 anrop · 19 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 904 | 904 (100%) | 0 (0%) | 0 | 3519 ms | 100% ok · 1600 ms |
| 🟢 `deepseek` | 1 | 1 (100%) | 0 (0%) | 0 | 408 ms | 100% ok · 1630 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4510 ms |
| 🟢 `groq` | 19 | 19 (100%) | 0 (0%) | 0 | 1811 ms | 100% ok · 700 ms |
| 🔴 `gemini` | 66 | 23 (34.8%) | 32 (48.5%) | 11 | 8421 ms | 100% ok · 810 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-10-09 09:43 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (904 anrop, 0 rl, 0 err)
  🟢 deepseek         100% ok   (1 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (19 anrop, 0 rl, 0 err)
  🔴 gemini           34.8% ok   (66 anrop, 32 rl, 11 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 23/66 ok (34.8%), 32 rate-limits, 11 errors

## Analys

**AI-providerprestanda senaste 24h:**
Mistral och Groq dominerade med 100% lyckade anrop och låg latens, medan Deepseek och Cloudflare inte användes. Gemini hade 34,8% felaktiga svar och 32 rate-limits, vilket gör den minst pålitliga. Groq:s TPD-kvot (144k tokens) verkar dela på konton, inte nycklar, så kapaciteten kan vara begränsad.

**Prioriterad rekommendation:**
Prioritera Mistral för stabilitet och Groq för låg latens, men övervaka Gemini och Cloudflare för eventuella förbättringar.
