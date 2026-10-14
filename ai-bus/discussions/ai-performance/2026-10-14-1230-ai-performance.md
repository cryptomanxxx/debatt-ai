---
date: 2026-10-14
type: ai-performance
overall_health_24h: 95.3
overall_health_7d: 95.3
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-10-14 08:06 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 900
    ok: 900
    rate_limits: 0
    errors: 0
    snitt_ms: 3622
  deepseek:
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 361
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 21
    ok: 21
    rate_limits: 0
    errors: 0
    snitt_ms: 2168
  gemini:
    anrop: 62
    ok: 16
    rate_limits: 39
    errors: 7
    snitt_ms: 7723
---

# AI Provider Performance — 2026-10-14

## Hälsostatus

🟢 **95.3%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **95.3%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 21 anrop · 21 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 900 | 900 (100%) | 0 (0%) | 0 | 3622 ms | 100% ok · 1380 ms |
| 🟢 `deepseek` | 1 | 1 (100%) | 0 (0%) | 0 | 361 ms | 100% ok · 2130 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 5750 ms |
| 🟢 `groq` | 21 | 21 (100%) | 0 (0%) | 0 | 2168 ms | 100% ok · 660 ms |
| 🔴 `gemini` | 62 | 16 (25.8%) | 39 (62.9%) | 7 | 7723 ms | 100% ok · 820 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-10-14 08:06 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (900 anrop, 0 rl, 0 err)
  🟢 deepseek         100% ok   (1 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (21 anrop, 0 rl, 0 err)
  🔴 gemini           25.8% ok   (62 anrop, 39 rl, 7 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 16/62 ok (25.8%), 39 rate-limits, 7 errors

## Analys

**Senaste 24h:** Mistral och Groq dominerade med 900 respektive 21 anrop, båda med 100% lyckade svar. Deepseek fick bara ett anrop, medan Cloudflare inte användes alls. Gemini hade 62 anrop, men endast 25,8% lyckades, med 39 rate-limits. Groq-nycklarna (9 konfigurerade + 1 kanal-nyckel) verkar fungera bra, men TPD-kvoten är kontospecifik, inte nyckelspecifik.

**Prioriterad rekommendation:** Prioritera Mistral för stabilitet och hastighet, och undvik Gemini på grund av dess höga fel- och rate-limit-frekvens. Groq är bra för snabbhet, men övervaka TPD-kvoten nära.
