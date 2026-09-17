---
date: 2026-09-17
type: ai-performance
overall_health_24h: 98.7
overall_health_7d: 98.9
total_calls_24h: 884
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["gemini", "deepseek", "mistral", "cloudflare", "groq"]
config_uppdaterad: "2026-09-17 08:02 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 27
    ok: 19
    rate_limits: 5
    errors: 3
    snitt_ms: 19756
  deepseek:
    anrop: 263
    ok: 263
    rate_limits: 0
    errors: 0
    snitt_ms: 4189
  mistral:
    anrop: 546
    ok: 543
    rate_limits: 3
    errors: 0
    snitt_ms: 5470
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 15
    ok: 15
    rate_limits: 0
    errors: 0
    snitt_ms: 2734
---

# AI Provider Performance — 2026-09-17

## Hälsostatus

🟢 **98.7%** lyckade anrop senaste 24h · 884 anrop totalt
🟢 **98.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 15 anrop · 15 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `gemini` | 27 | 19 (70.4%) | 5 (18.5%) | 3 | 19756 ms | 100% ok · 2040 ms |
| 🟢 `deepseek` | 263 | 263 (100%) | 0 (0%) | 0 | 4189 ms | 100% ok · 2080 ms |
| 🟢 `mistral` | 546 | 543 (99.5%) | 3 (0.5%) | 0 | 5470 ms | 100% ok · 1540 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 5230 ms |
| 🟢 `groq` | 15 | 15 (100%) | 0 (0%) | 0 | 2734 ms | 100% ok · 620 ms |

## Nuvarande Fallback-ordning

`gemini → deepseek → mistral → cloudflare → groq`

*(Benchmark senast körde: 2026-09-17 08:02 UTC)*

## 7-Dagars Trend

```
  🟡 gemini           70.4% ok   (27 anrop, 5 rl, 3 err)
  🟢 deepseek         100% ok   (263 anrop, 0 rl, 0 err)
  🟢 mistral          99.5% ok   (658 anrop, 3 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (18 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under senaste 24h ligger plattformen stabilt på 98,7% hälsopoäng (884 anrop), men Gemini utmärker sig negativt med endast 70,4% ok, 5 rate-limits och en svarstid på 19 756 ms — klart sämst av alla providers. Mistral bär huvuddelen av trafiken (546 anrop, 99,5% ok, 5 470 ms) medan DeepSeek levererar felfritt (263 anrop, 100% ok, 4 189 ms) och Groq är snabbast (2 734 ms) men knappt använd (15 anrop). Cloudflare är helt oanvänd trots benchmark på 100% ok, och notera att Groqs 9 nycklar sannolikt delar samma TPD-kvot per konto (~144k) — kapacitetsökningen är alltså inte linjär. **Prioriterad rekommendation:** flytta Gemini från första plats i fallback-kedjan (eller sänk dess vikt kraftigt) och låt DeepSeek/Mistral ta primärlasten, samt aktivera Cloudflare som billig buffert — åtgärda detta inom 24h innan Geminis rate-limits börjar påverka slutanvändare.
