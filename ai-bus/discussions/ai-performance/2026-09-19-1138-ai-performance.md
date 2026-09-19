---
date: 2026-09-19
type: ai-performance
overall_health_24h: 99
overall_health_7d: 99
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["gemini", "mistral", "deepseek", "cloudflare", "groq"]
config_uppdaterad: "2026-09-19 07:35 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 27
    ok: 17
    rate_limits: 4
    errors: 6
    snitt_ms: 7490
  mistral:
    anrop: 945
    ok: 945
    rate_limits: 0
    errors: 0
    snitt_ms: 3696
  deepseek:
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 359
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
    snitt_ms: 2796
---

# AI Provider Performance — 2026-09-19

## Hälsostatus

🟢 **99%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **99%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 13 anrop · 13 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `gemini` | 27 | 17 (63%) | 4 (14.8%) | 6 | 7490 ms | 100% ok · 1030 ms |
| 🟢 `mistral` | 945 | 945 (100%) | 0 (0%) | 0 | 3696 ms | 100% ok · 1480 ms |
| 🟢 `deepseek` | 1 | 1 (100%) | 0 (0%) | 0 | 359 ms | 100% ok · 1790 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3160 ms |
| 🟢 `groq` | 13 | 13 (100%) | 0 (0%) | 0 | 2796 ms | 100% ok · 670 ms |

## Nuvarande Fallback-ordning

`gemini → mistral → deepseek → cloudflare → groq`

*(Benchmark senast körde: 2026-09-19 07:35 UTC)*

## 7-Dagars Trend

```
  🟡 gemini           63% ok   (27 anrop, 4 rl, 6 err)
  🟢 mistral          100% ok   (945 anrop, 0 rl, 0 err)
  🟢 deepseek         100% ok   (1 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (13 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**Sammanfattning av AI-provider-prestanda senaste 24h:**
Gemini har låg tillgänglighet (63% OK, 4 rate-limits), medan Mistral och Groq presterar stabilt (100% OK). Deepseek och Cloudflare har låg användning, men Cloudflare är redo för fallback. Groq har hög latens (2796 ms), medan Mistral är snabbast (3696 ms). Inga kritiska problemleverantörer.

**Prioriterad rekommendation:** Överväg att minska beroendet på Gemini för att förbättra tillgänglighet, eller justera Groq-kvoten för att optimera svarstider. Mistral är för närvarande den mest pålitliga och snabba leverantören.
