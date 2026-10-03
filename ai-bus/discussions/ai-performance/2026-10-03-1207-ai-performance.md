---
date: 2026-10-03
type: ai-performance
overall_health_24h: 99
overall_health_7d: 99
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["gemini", "mistral", "deepseek", "cloudflare", "groq"]
config_uppdaterad: "2026-10-03 08:37 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 18
    ok: 8
    rate_limits: 1
    errors: 9
    snitt_ms: 34586
  mistral:
    anrop: 37
    ok: 37
    rate_limits: 0
    errors: 0
    snitt_ms: 9817
  deepseek:
    anrop: 909
    ok: 909
    rate_limits: 0
    errors: 0
    snitt_ms: 2877
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 20
    ok: 20
    rate_limits: 0
    errors: 0
    snitt_ms: 2072
---

# AI Provider Performance — 2026-10-03

## Hälsostatus

🟢 **99%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **99%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 20 anrop · 20 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🔴 `gemini` | 18 | 8 (44.4%) | 1 (5.6%) | 9 | 34586 ms | 100% ok · 1010 ms |
| 🟢 `mistral` | 37 | 37 (100%) | 0 (0%) | 0 | 9817 ms | 100% ok · 1270 ms |
| 🟢 `deepseek` | 909 | 909 (100%) | 0 (0%) | 0 | 2877 ms | 100% ok · 1740 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4250 ms |
| 🟢 `groq` | 20 | 20 (100%) | 0 (0%) | 0 | 2072 ms | 100% ok · 660 ms |

## Nuvarande Fallback-ordning

`gemini → mistral → deepseek → cloudflare → groq`

*(Benchmark senast körde: 2026-10-03 08:37 UTC)*

## 7-Dagars Trend

```
  🔴 gemini           44.4% ok   (18 anrop, 1 rl, 9 err)
  🟢 mistral          100% ok   (37 anrop, 0 rl, 0 err)
  🟢 deepseek         100% ok   (909 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (20 anrop, 0 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 8/18 ok (44.4%), 1 rate-limits, 9 errors

## Analys

Under det senaste dygnet har plattformen upprätthållit en stark hälsopoäng på 99% över 1000 anrop, där Deepseek har dragit det absolut tyngsta lasset med 909 felfria anrop och en snabb svarstid på 2,8 sekunder. Vår primära provider Gemini har däremot underpresterat kraftigt med enbart 44,4% lyckade anrop och en oacceptabel genomsnittlig svarstid på nära 35 sekunder, vilket tvingat systemet att flitigt falla tillbaka i kedjan. Groq och Mistral har levererat med 100% stabilitet, men vi måste förhålla oss till att Groqs nio konfigurerade nycklar sannolikt begränsas av en gemensam TPD-kvot per konto snarare än att ge en linjär kapacitetsökning.

**Prioriterad rekommendation:** Justera omedelbart fallback-ordningen genom att flytta ner underpresterande Gemini och istället sätta den stabila och snabba Deepseek som primär provider, för att på så sätt minimera svarstiderna och avlasta felhanteringen.
