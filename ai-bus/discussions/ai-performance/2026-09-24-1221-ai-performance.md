---
date: 2026-09-24
type: ai-performance
overall_health_24h: 98.7
overall_health_7d: 98.7
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["gemini", "deepseek", "cloudflare", "groq", "mistral"]
config_uppdaterad: "2026-09-24 07:52 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 23
    ok: 11
    rate_limits: 2
    errors: 10
    snitt_ms: 10828
  deepseek:
    anrop: 899
    ok: 899
    rate_limits: 0
    errors: 0
    snitt_ms: 3002
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 22
    ok: 22
    rate_limits: 0
    errors: 0
    snitt_ms: 2376
  mistral:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-09-24

## Hälsostatus

🟢 **98.7%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **98.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 22 anrop · 22 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🔴 `gemini` | 23 | 11 (47.8%) | 2 (8.7%) | 10 | 10828 ms | 100% ok · 990 ms |
| 🟢 `deepseek` | 899 | 899 (100%) | 0 (0%) | 0 | 3002 ms | 100% ok · 1700 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4320 ms |
| 🟢 `groq` | 22 | 22 (100%) | 0 (0%) | 0 | 2376 ms | 100% ok · 600 ms |
| ⚪ `mistral` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`gemini → deepseek → cloudflare → groq → mistral`

*(Benchmark senast körde: 2026-09-24 07:52 UTC)*

## 7-Dagars Trend

```
  🔴 gemini           47.8% ok   (23 anrop, 2 rl, 10 err)
  🟢 deepseek         100% ok   (899 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (22 anrop, 0 rl, 0 err)
  ⚪ mistral          ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`gemini`**: 11/23 ok (47.8%), 2 rate-limits, 10 errors

## Analys

Under det senaste dygnet har plattformen upprätthållit en stabil total hälsopoäng på 98,7 % över 1000 anrop, där DeepSeek har dragit det absolut tyngsta lasset med 899 anrop, 100 % framgångsgrad och en genomsnittlig svarstid på 3002 ms. Vår primära fallback Gemini har däremot underpresterat kraftigt med endast 47,8 % lyckade anrop och en genomsnittlig svarstid på extremt höga 10 828 ms, medan Groq har levererat felfritt på sina 22 anrop med snabba 2376 ms. Eftersom vi har 10 konfigurerade Groq-nycklar är det viktigt att flagga för att deras TPD-kvot (Tokens Per Day) sannolikt begränsas per konto snarare än per nyckel, vilket innebär att vi inte kan räkna med en linjär kapacitetsökning där.

**Prioriterad rekommendation:** Justera fallback-ordningen omedelbart genom att flytta ner Gemini från förstaplatsen till efter Groq (ny ordning: deepseek → cloudflare → groq → gemini → mistral) för att undvika att användare drabbas av Geminis nuvarande instabilitet och långsamma svarstider.
