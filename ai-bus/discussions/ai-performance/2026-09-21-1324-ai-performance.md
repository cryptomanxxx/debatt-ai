---
date: 2026-09-21
type: ai-performance
overall_health_24h: 84.1
overall_health_7d: 84.6
total_calls_24h: 964
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["gemini", "deepseek", "cloudflare", "groq", "mistral"]
config_uppdaterad: "2026-09-21 08:15 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 27
    ok: 15
    rate_limits: 4
    errors: 8
    snitt_ms: 10431
  deepseek:
    anrop: 210
    ok: 210
    rate_limits: 0
    errors: 0
    snitt_ms: 5501
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 11
    ok: 11
    rate_limits: 0
    errors: 0
    snitt_ms: 3182
  mistral:
    anrop: 700
    ok: 561
    rate_limits: 0
    errors: 139
    snitt_ms: 3078
---

# AI Provider Performance — 2026-09-21

## Hälsostatus

🟢 **84.1%** lyckade anrop senaste 24h · 964 anrop totalt
🟢 **84.6%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 11 anrop · 11 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `gemini` | 27 | 15 (55.6%) | 4 (14.8%) | 8 | 10431 ms | 100% ok · 1020 ms |
| 🟢 `deepseek` | 210 | 210 (100%) | 0 (0%) | 0 | 5501 ms | 100% ok · 1830 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4420 ms |
| 🟢 `groq` | 11 | 11 (100%) | 0 (0%) | 0 | 3182 ms | 100% ok · 690 ms |
| 🟢 `mistral` | 700 | 561 (80.1%) | 0 (0%) | 139 | 3078 ms | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`gemini → deepseek → cloudflare → groq → mistral`

*(Benchmark senast körde: 2026-09-21 08:15 UTC)*

## 7-Dagars Trend

```
  🟡 gemini           55.6% ok   (27 anrop, 4 rl, 8 err)
  🟢 deepseek         100% ok   (210 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (15 anrop, 0 rl, 0 err)
  🟢 mistral          81% ok   (730 anrop, 0 rl, 139 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Senaste 24h: 964 anrop, 84,1% hälsopoäng. Mistral bär huvuddelen (700 anrop) men tappar till 80,1% ok, medan deepseek levererar 100% ok på 210 anrop och groq 100% ok på 11 anrop med bäst latens (3 182 ms). Gemini är svagaste länken: 55,6% ok, 4 rate-limits och 10 431 ms — den ligger först i fallback-kedjan och bromsar därmed hela kedjan. Cloudflare är oanvänd (0 anrop) trots benchmark på 100% ok, och Groqs 9 nycklar ger sannolikt ingen linjär kapacitetsökning pga TPD-kvot per konto. **Rekommendation: prioritera att flytta gemini från första plats i fallback-ordningen (t.ex. efter deepseek) och aktivera cloudflare som primär eller sekundär — det ger störst hälsovinst per insats.**
