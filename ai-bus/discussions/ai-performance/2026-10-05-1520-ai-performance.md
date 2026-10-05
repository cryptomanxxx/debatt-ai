---
date: 2026-10-05
type: ai-performance
overall_health_24h: 97.8
overall_health_7d: 98.4
total_calls_24h: 734
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["gemini", "deepseek", "mistral", "cloudflare", "groq"]
config_uppdaterad: "2026-10-05 09:40 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 35
    ok: 20
    rate_limits: 11
    errors: 4
    snitt_ms: 17411
  deepseek:
    anrop: 242
    ok: 242
    rate_limits: 0
    errors: 0
    snitt_ms: 2552
  mistral:
    anrop: 420
    ok: 420
    rate_limits: 0
    errors: 0
    snitt_ms: 3918
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 21
    ok: 20
    rate_limits: 0
    errors: 1
    snitt_ms: 3060
---

# AI Provider Performance — 2026-10-05

## Hälsostatus

🟢 **97.8%** lyckade anrop senaste 24h · 734 anrop totalt
🟢 **98.4%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 21 anrop · 20 (95.2%) OK · 0 (0%) rate-limits · 1 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `gemini` | 35 | 20 (57.1%) | 11 (31.4%) | 4 | 17411 ms | 100% ok · 970 ms |
| 🟢 `deepseek` | 242 | 242 (100%) | 0 (0%) | 0 | 2552 ms | 100% ok · 1760 ms |
| 🟢 `mistral` | 420 | 420 (100%) | 0 (0%) | 0 | 3918 ms | 100% ok · 2530 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3720 ms |
| 🟢 `groq` | 21 | 20 (95.2%) | 0 (0%) | 1 | 3060 ms | 100% ok · 660 ms |

## Nuvarande Fallback-ordning

`gemini → deepseek → mistral → cloudflare → groq`

*(Benchmark senast körde: 2026-10-05 09:40 UTC)*

## 7-Dagars Trend

```
  🟡 gemini           57.1% ok   (35 anrop, 11 rl, 4 err)
  🟢 deepseek         100% ok   (242 anrop, 0 rl, 0 err)
  🟢 mistral          100% ok   (680 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             96% ok   (25 anrop, 0 rl, 1 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 20/35 ok (57.1%), 11 rate-limits, 4 errors

## Analys

Senaste 24h ligger den totala hälsopoängen på 97,8% (7d: 98,4%) över 734 anrop, där mistral (420 anrop, 100% ok, 3 918 ms) och deepseek (242 anrop, 100% ok, 2 552 ms) bär merparten av lasten stabilt. Gemini är enda problemleverantören med 35 anrop, 57,1% ok, 11 rate-limits och 17 411 ms svarstid, vilket drar ned helhetsintrycket trots att den ligger först i fallback-ordningen. Groq körde bara 21 anrop (95,2% ok, 3 060 ms) och cloudflare anropades inte alls — notera att Groqs 9 nycklar sannolikt delar TPD-kvot per konto (~144k), så kapaciteten skalar inte linjärt. Prioriterad rekommendation: flytta ned gemini i fallback-ordningen (eller sätt den efter deepseek/mistral) och utvärdera cloudflare som primär förstärkning, samt verifiera Groq-kontostruktur innan ni räknar med nyckelbaserad kapacitetsökning.
