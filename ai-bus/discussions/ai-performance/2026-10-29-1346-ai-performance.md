---
date: 2026-10-29
type: ai-performance
overall_health_24h: 98
overall_health_7d: 98
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "mistral"]
ranked_order: ["deepseek", "gemini", "groq", "cloudflare", "mistral"]
config_uppdaterad: "2026-10-29 09:01 UTC"
order_source: "provider_config"
providers_24h:
  deepseek:
    anrop: 879
    ok: 879
    rate_limits: 0
    errors: 0
    snitt_ms: 3767
  gemini:
    anrop: 3
    ok: 2
    rate_limits: 1
    errors: 0
    snitt_ms: 28037
  groq:
    anrop: 79
    ok: 79
    rate_limits: 0
    errors: 0
    snitt_ms: 1263
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  mistral:
    anrop: 19
    ok: 0
    rate_limits: 0
    errors: 19
    snitt_ms: null
---

# AI Provider Performance — 2026-10-29

## Hälsostatus

🟢 **98%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **98%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 79 anrop · 79 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `deepseek` | 879 | 879 (100%) | 0 (0%) | 0 | 3767 ms | 100% ok · 2410 ms |
| 🟡 `gemini` | 3 | 2 (66.7%) | 1 (33.3%) | 0 | 28037 ms | 100% ok · 2540 ms |
| 🟢 `groq` | 79 | 79 (100%) | 0 (0%) | 0 | 1263 ms | 100% ok · 620 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 5180 ms |
| 🔴 `mistral` | 19 | 0 (0%) | 0 (0%) | 19 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`deepseek → gemini → groq → cloudflare → mistral`

*(Benchmark senast körde: 2026-10-29 09:01 UTC)*

## 7-Dagars Trend

```
  🟢 deepseek         100% ok   (879 anrop, 0 rl, 0 err)
  🟡 gemini           66.7% ok   (3 anrop, 1 rl, 0 err)
  🟢 groq             100% ok   (79 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🔴 mistral          0% ok   (19 anrop, 0 rl, 19 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 2/3 ok (66.7%), 1 rate-limits, 0 errors
- **`mistral`**: 0/19 ok (0%), 0 rate-limits, 19 errors

## Analys

Senaste 24h dominerar deepseek med 879 anrop och 100% ok, medan groq levererar snabbast (1263 ms) på 79 anrop och cloudflare står oanvänd trots benchmark 100% ok. Problemleverantörerna är gemini (66,7% ok, 1 rate-limit, 28s svarstid) och mistral (0% ok på 19 anrop). Notera att Groqs 9 nycklar sannolikt delar TPD-kvot per konto (~144k), så kapaciteten skalar inte linjärt. Prioriterad rekommendation: felsök mistral omgående och flytta dess trafik till deepseek/groq, samt utred geminis rate-limits innan volym ökas.
