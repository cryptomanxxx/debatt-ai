---
date: 2026-09-12
type: ai-performance
overall_health_24h: 99.9
overall_health_7d: 99.9
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "gemini", "cloudflare", "groq"]
config_uppdaterad: "2026-09-12 07:25 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 954
    ok: 953
    rate_limits: 0
    errors: 1
    snitt_ms: 3884
  deepseek:
    anrop: 2
    ok: 2
    rate_limits: 0
    errors: 0
    snitt_ms: 1014
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
    snitt_ms: 2262
---

# AI Provider Performance — 2026-09-12

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
| 🟢 `mistral` | 954 | 953 (99.9%) | 0 (0%) | 1 | 3884 ms | 100% ok · 1220 ms |
| 🟢 `deepseek` | 2 | 2 (100%) | 0 (0%) | 0 | 1014 ms | 100% ok · 2190 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2600 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3590 ms |
| 🟢 `groq` | 32 | 32 (100%) | 0 (0%) | 0 | 2262 ms | 100% ok · 620 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → gemini → cloudflare → groq`

*(Benchmark senast körde: 2026-09-12 07:25 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          99.9% ok   (954 anrop, 0 rl, 1 err)
  🟢 deepseek         100% ok   (2 anrop, 0 rl, 0 err)
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (32 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**AI-provider-prestanda senaste 24h:**
Mistral dominerade med 954 anrop (99,9% lyckade, 3,9s svarstid), följt av Groq (32 anrop, 100% ok, 2,3s). Deepseek och Gemini användes sparsamt (2 respektive 0 anrop). Cloudflare och Google ej anropade. Groq visar låg latens men begränsad kapacitet (TPD-kvot ~144k per konto). Mistral är prioriterad för hög prestanda och stabilitet.

**Rekommendation:** Fokusera på Mistral för snabbhet och Groq för låg latens, med Deepseek som reserv för specialiserade uppgifter.
