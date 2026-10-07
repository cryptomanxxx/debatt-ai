---
date: 2026-10-07
type: ai-performance
overall_health_24h: 100
overall_health_7d: 99.6
total_calls_24h: 655
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-10-07 09:25 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 55
    ok: 55
    rate_limits: 0
    errors: 0
    snitt_ms: 10177
  deepseek:
    anrop: 569
    ok: 569
    rate_limits: 0
    errors: 0
    snitt_ms: 3759
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 12
    ok: 12
    rate_limits: 0
    errors: 0
    snitt_ms: 1742
  gemini:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-10-07

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 655 anrop totalt
🟢 **99.6%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 12 anrop · 12 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 55 | 55 (100%) | 0 (0%) | 0 | 10177 ms | 100% ok · 1420 ms |
| 🟢 `deepseek` | 569 | 569 (100%) | 0 (0%) | 0 | 3759 ms | 100% ok · 1810 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3740 ms |
| 🟢 `groq` | 12 | 12 (100%) | 0 (0%) | 0 | 1742 ms | 100% ok · 700 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 100% ok · 960 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-10-07 09:25 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (71 anrop, 0 rl, 0 err)
  🟢 deepseek         100% ok   (864 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (26 anrop, 0 rl, 0 err)
  🔴 gemini           0% ok   (4 anrop, 2 rl, 2 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**AI-providerprestanda senaste 24h:**
Deepseek dominerade med 569 anrop (100% ok, 3759 ms), följt av Mistral (55 anrop, 10177 ms). Groq hade 12 anrop (100% ok, 1742 ms), medan Cloudflare och Gemini inte användes. Inga rate-limits eller problemleverantörer. **Prioriterad rekommendation:** Fokusera på Deepseek för hög hastighet och stabilitet, men övervaka Groq-kvoten (TPD ~144k per konto).
