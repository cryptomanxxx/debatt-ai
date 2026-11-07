---
date: 2026-11-07
type: ai-performance
overall_health_24h: 97.6
overall_health_7d: 97.6
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "cloudflare", "groq", "gemini", "deepseek"]
config_uppdaterad: "2026-11-07 09:20 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 922
    ok: 922
    rate_limits: 0
    errors: 0
    snitt_ms: 2726
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 23
    ok: 23
    rate_limits: 0
    errors: 0
    snitt_ms: 2394
  gemini:
    anrop: 41
    ok: 17
    rate_limits: 20
    errors: 4
    snitt_ms: 10619
  deepseek:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-11-07

## Hälsostatus

🟢 **97.6%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **97.6%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 23 anrop · 23 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 922 | 922 (100%) | 0 (0%) | 0 | 2726 ms | 100% ok · 1280 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3570 ms |
| 🟢 `groq` | 23 | 23 (100%) | 0 (0%) | 0 | 2394 ms | 100% ok · 640 ms |
| 🔴 `gemini` | 41 | 17 (41.5%) | 20 (48.8%) | 4 | 10619 ms | 90% ok · 1740 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → cloudflare → groq → gemini → deepseek`

*(Benchmark senast körde: 2026-11-07 09:20 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (922 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (23 anrop, 0 rl, 0 err)
  🔴 gemini           41.5% ok   (41 anrop, 20 rl, 4 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`gemini`**: 17/41 ok (41.5%), 20 rate-limits, 4 errors

## Analys

**AI-providerprestanda senaste 24h:**
Mistral och Groq levererade perfekt (100% OK) med snabb svarstid, medan Gemini drabbades av 20 rate-limits och låg på 41,5% OK. Cloudflare och DeepSeek användes ej, vilket kan vara en optimeringstips. Groq har hög kapacitet (144k TPD per konto), men kvoten delas troligen mellan nycklarna.

**Prioriterad rekommendation:** Fokusera på Mistral och Groq för stabilitet, överväg att minska Gemini-anrop eller justera kvoter.
