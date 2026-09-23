---
date: 2026-09-23
type: ai-performance
overall_health_24h: 99.9
overall_health_7d: 98
total_calls_24h: 846
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["deepseek", "cloudflare", "groq", "gemini", "mistral"]
config_uppdaterad: "2026-09-23 08:01 UTC"
order_source: "provider_config"
providers_24h:
  deepseek:
    anrop: 808
    ok: 808
    rate_limits: 0
    errors: 0
    snitt_ms: 3377
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 9
    ok: 9
    rate_limits: 0
    errors: 0
    snitt_ms: 1571
  gemini:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  mistral:
    anrop: 1
    ok: 0
    rate_limits: 0
    errors: 1
    snitt_ms: null
---

# AI Provider Performance — 2026-09-23

## Hälsostatus

🟢 **99.9%** lyckade anrop senaste 24h · 846 anrop totalt
🟢 **98%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 9 anrop · 9 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `deepseek` | 808 | 808 (100%) | 0 (0%) | 0 | 3377 ms | 100% ok · 1840 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4380 ms |
| 🟢 `groq` | 9 | 9 (100%) | 0 (0%) | 0 | 1571 ms | 100% ok · 700 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 100% ok · 1270 ms |
| 🔴 `mistral` | 1 | 0 (0%) | 0 (0%) | 1 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`deepseek → cloudflare → groq → gemini → mistral`

*(Benchmark senast körde: 2026-09-23 08:01 UTC)*

## 7-Dagars Trend

```
  🟢 deepseek         100% ok   (922 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (11 anrop, 0 rl, 0 err)
  🔴 gemini           0% ok   (18 anrop, 1 rl, 17 err)
  🔴 mistral          0% ok   (1 anrop, 0 rl, 1 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Senaste 24h: deepseek bar nästan hela trafiken (808 av 846 anrop) med 100% ok och 3377 ms svarstid, medan groq levererade 9 anrop på 1571 ms och cloudflare/gemini inte anropades alls. mistral hade ett enda anrop med 0% ok, vilket är en tydlig outlier värd att felsöka. Notera att Groqs 9 nycklar sannolikt delar TPD-kvot per konto (~144k), så redundansen är inte linjär — en enda kvotvägg kan slå ut hela Groq-steget. Prioriterad rekommendation: verifiera mistral-felet och flytta upp cloudflare (benchmark 100% ok) före groq i fallback-ordningen för att avlasta deepseek och minska beroendet av en kvotbegränsad provider.
