---
date: 2026-10-16
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 961
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-10-16 07:36 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 933
    ok: 933
    rate_limits: 0
    errors: 0
    snitt_ms: 3444
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
    anrop: 13
    ok: 13
    rate_limits: 0
    errors: 0
    snitt_ms: 2432
  gemini:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-10-16

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 961 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 13 anrop · 13 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 933 | 933 (100%) | 0 (0%) | 0 | 3444 ms | 100% ok · 1270 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2070 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3990 ms |
| 🟢 `groq` | 13 | 13 (100%) | 0 (0%) | 0 | 2432 ms | 100% ok · 640 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 70% ok · 6490 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-10-16 07:36 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (971 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (13 anrop, 0 rl, 0 err)
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 70% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**AI-provider-prestanda senaste 24h:**
Mistral och Groq dominerade med 100% tillgänglighet och noll rate-limits, medan DeepSeek, Cloudflare och Gemini inte användes. Mistral svarade snabbt (3444 ms) och Groq var stabil (2432 ms). Inga leverantörer hade över 30% fel eller under 50% tillgänglighet.

**Prioriterad rekommendation:** Fortsätt använda Mistral som primärleverantör för snabbhet och pålitlighet, med Groq som backup för högpresterande modeller.
