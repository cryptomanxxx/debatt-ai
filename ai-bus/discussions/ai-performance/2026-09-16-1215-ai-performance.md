---
date: 2026-09-16
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 980
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "gemini", "groq"]
config_uppdaterad: "2026-09-16 07:58 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 941
    ok: 941
    rate_limits: 0
    errors: 0
    snitt_ms: 4517
  deepseek:
    anrop: 4
    ok: 4
    rate_limits: 0
    errors: 0
    snitt_ms: 12742
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
    anrop: 15
    ok: 15
    rate_limits: 0
    errors: 0
    snitt_ms: 2897
---

# AI Provider Performance — 2026-09-16

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 980 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 15 anrop · 15 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 941 | 941 (100%) | 0 (0%) | 0 | 4517 ms | 100% ok · 1480 ms |
| 🟢 `deepseek` | 4 | 4 (100%) | 0 (0%) | 0 | 12742 ms | 100% ok · 2020 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3550 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 100% ok · 970 ms |
| 🟢 `groq` | 15 | 15 (100%) | 0 (0%) | 0 | 2897 ms | 100% ok · 690 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → gemini → groq`

*(Benchmark senast körde: 2026-09-16 07:58 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (961 anrop, 0 rl, 0 err)
  🟢 deepseek         100% ok   (4 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (15 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**AI-providerprestanda senaste 24h:**
Mistral dominerade med 941 anrop (100% ok, 4,5 sekunder per svar), följt av Deepseek (4 anrop, 12,7 sekunder). Groq fick 15 anrop (100% ok, 2,9 sekunder) utan rate-limits. Cloudflare och Gemini användes ej. Groq-kvoten är troligen kontospecifik, inte nyckelspecifik.

**Prioriterad rekommendation:** Fortsätt använda Mistral som primärleverantör för hastighet och pålitlighet, med Groq som backup för låg-latensscenarier.
