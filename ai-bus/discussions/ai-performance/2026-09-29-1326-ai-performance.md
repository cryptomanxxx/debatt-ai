---
date: 2026-09-29
type: ai-performance
overall_health_24h: 99.9
overall_health_7d: 99.9
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["deepseek", "gemini", "cloudflare", "groq", "mistral"]
config_uppdaterad: "2026-09-29 09:10 UTC"
order_source: "provider_config"
providers_24h:
  deepseek:
    anrop: 929
    ok: 929
    rate_limits: 0
    errors: 0
    snitt_ms: 3153
  gemini:
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
    anrop: 32
    ok: 32
    rate_limits: 0
    errors: 0
    snitt_ms: 2295
  mistral:
    anrop: 1
    ok: 0
    rate_limits: 0
    errors: 1
    snitt_ms: null
---

# AI Provider Performance — 2026-09-29

## Hälsostatus

🟢 **99.9%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **99.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 32 anrop · 32 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `deepseek` | 929 | 929 (100%) | 0 (0%) | 0 | 3153 ms | 100% ok · 1710 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2220 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4360 ms |
| 🟢 `groq` | 32 | 32 (100%) | 0 (0%) | 0 | 2295 ms | 100% ok · 650 ms |
| 🔴 `mistral` | 1 | 0 (0%) | 0 (0%) | 1 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`deepseek → gemini → cloudflare → groq → mistral`

*(Benchmark senast körde: 2026-09-29 09:10 UTC)*

## 7-Dagars Trend

```
  🟢 deepseek         100% ok   (929 anrop, 0 rl, 0 err)
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (32 anrop, 0 rl, 0 err)
  🔴 mistral          0% ok   (1 anrop, 0 rl, 1 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under senaste 24h har plattformen haft 1000 anrop med 99,9% hälsopoäng, där deepseek dominerar med 929 anrop (100% ok, 3153 ms) och groq står för 32 anrop (100% ok, 2295 ms). Gemini, cloudflare och mistral är i praktiken oanvända — mistral hade ett enda anrop med 0% ok, medan gemini och cloudflare inte anropades alls. Inga rate-limits rapporteras, men notera att Groqs 9 nycklar sannolikt delar samma TPD-kvot per konto (~144k), så kapacitetsökningen är inte linjär. Prioriterad rekommendation: utred mistrals 0%-fel och verifiera Groq-kontostruktur/TPD-fördelning innan ni förlitar er på Groq som skalbar fallback.
