---
date: 2026-09-05
type: ai-performance
overall_health_24h: 99.5
overall_health_7d: 99.5
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["gemini", "mistral", "deepseek", "cloudflare", "groq"]
config_uppdaterad: "2026-09-05 07:09 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 26
    ok: 21
    rate_limits: 4
    errors: 1
    snitt_ms: 11603
  mistral:
    anrop: 919
    ok: 919
    rate_limits: 0
    errors: 0
    snitt_ms: 3098
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
    snitt_ms: 2457
---

# AI Provider Performance — 2026-09-05

## Hälsostatus

🟢 **99.5%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **99.5%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 34 anrop · 34 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `gemini` | 26 | 21 (80.8%) | 4 (15.4%) | 1 | 11603 ms | 100% ok · 1130 ms |
| 🟢 `mistral` | 919 | 919 (100%) | 0 (0%) | 0 | 3098 ms | 100% ok · 1360 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2580 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3940 ms |
| 🟢 `groq` | 34 | 34 (100%) | 0 (0%) | 0 | 2457 ms | 100% ok · 650 ms |

## Nuvarande Fallback-ordning

`gemini → mistral → deepseek → cloudflare → groq`

*(Benchmark senast körde: 2026-09-05 07:09 UTC)*

## 7-Dagars Trend

```
  🟢 gemini           80.8% ok   (26 anrop, 4 rl, 1 err)
  🟢 mistral          100% ok   (919 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (34 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**AI-providerprestanda senaste 24h:**
Gemini presterade bra med 80,8% lyckade svar (26 anrop), men upplevde 4 rate-limits. Mistral var stabil med 100% lyckade svar (919 anrop) och låg svarstid (3098 ms). Groq hade 100% lyckade svar (34 anrop) och låg svarstid (2457 ms), medan Deepseek och Cloudflare inte användes. **Prioriterad rekommendation:** Fortsätt använda Mistral och Groq för hög tillgänglighet, men övervaka Gemini för eventuella kvotbegränsningar.
