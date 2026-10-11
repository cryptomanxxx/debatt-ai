---
date: 2026-10-11
type: ai-performance
overall_health_24h: 98.9
overall_health_7d: 98.9
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["gemini", "mistral", "deepseek", "cloudflare", "groq"]
config_uppdaterad: "2026-10-11 09:22 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 20
    ok: 9
    rate_limits: 1
    errors: 10
    snitt_ms: 9649
  mistral:
    anrop: 960
    ok: 960
    rate_limits: 0
    errors: 0
    snitt_ms: 2829
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
    snitt_ms: 2044
---

# AI Provider Performance — 2026-10-11

## Hälsostatus

🟢 **98.9%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **98.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 13 anrop · 13 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🔴 `gemini` | 20 | 9 (45%) | 1 (5%) | 10 | 9649 ms | 100% ok · 820 ms |
| 🟢 `mistral` | 960 | 960 (100%) | 0 (0%) | 0 | 2829 ms | 100% ok · 1560 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 1630 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4150 ms |
| 🟢 `groq` | 13 | 13 (100%) | 0 (0%) | 0 | 2044 ms | 100% ok · 650 ms |

## Nuvarande Fallback-ordning

`gemini → mistral → deepseek → cloudflare → groq`

*(Benchmark senast körde: 2026-10-11 09:22 UTC)*

## 7-Dagars Trend

```
  🔴 gemini           45% ok   (20 anrop, 1 rl, 10 err)
  🟢 mistral          100% ok   (960 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (13 anrop, 0 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 9/20 ok (45%), 1 rate-limits, 10 errors

## Analys

Under de senaste 24 timmarna har plattformen upprätthållit en stabil hälsopoäng på 98,9 % baserat på totalt 1 000 anrop, där Mistral fungerat som den huvudsakliga arbetshästen med 960 anrop, 100 % framgång och en genomsnittlig responstid på 2,8 sekunder. Gemini har haft avsevärda prestandaproblem med endast 45 % godkända anrop och en hög responstid på nästan 9,6 sekunder, medan Groq levererat den snabbaste responstiden på 2,0 sekunder över sina 13 anrop. Efter
