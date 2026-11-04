---
date: 2026-11-04
type: ai-performance
overall_health_24h: 97.8
overall_health_7d: 97.8
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["gemini", "mistral", "cloudflare", "groq", "deepseek"]
config_uppdaterad: "2026-11-04 10:01 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 44
    ok: 22
    rate_limits: 13
    errors: 9
    snitt_ms: 6638
  mistral:
    anrop: 921
    ok: 921
    rate_limits: 0
    errors: 0
    snitt_ms: 3664
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
    snitt_ms: 2424
  deepseek:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-11-04

## Hälsostatus

🟢 **97.8%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **97.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 21 anrop · 21 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `gemini` | 44 | 22 (50%) | 13 (29.5%) | 9 | 6638 ms | 100% ok · 1090 ms |
| 🟢 `mistral` | 921 | 921 (100%) | 0 (0%) | 0 | 3664 ms | 100% ok · 1160 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 6110 ms |
| 🟢 `groq` | 21 | 21 (100%) | 0 (0%) | 0 | 2424 ms | 100% ok · 700 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`gemini → mistral → cloudflare → groq → deepseek`

*(Benchmark senast körde: 2026-11-04 10:01 UTC)*

## 7-Dagars Trend

```
  🟡 gemini           50% ok   (44 anrop, 13 rl, 9 err)
  🟢 mistral          100% ok   (921 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (21 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen upprätthållit en stabil hälsopoäng på 97,8 % över totalt 1 000 anrop, men primärleverantören Gemini har uppvisat stora flaskhalsar med enbart 50 % godkända anrop, 13 rate-limits och en hög genomsnittlig svarstid på 6 638 ms. Trafiken har därför i huvudsak slussats vidare till Mistral, som hanterat 921 anrop med 100 % tillförlitlighet och en snabbare responstid på 3 664 ms, medan Groq levererat perfekt prestanda (2 424 ms) på sina 21 anrop. Varken Cloudflare eller Deepseek har belastats under perioden. 

**Prioriterad rekommendation:** Justera fallback-ordningen tillfälligt genom att flytta ner Gemini och sätta Mistral eller Groq som primär provider för att minska latensen och undvika onödiga rate-limits vid första anropet.
