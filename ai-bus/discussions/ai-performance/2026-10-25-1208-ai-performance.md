---
date: 2026-10-25
type: ai-performance
overall_health_24h: 99.3
overall_health_7d: 99.3
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["mistral"]
ranked_order: ["deepseek", "cloudflare", "groq", "gemini", "mistral"]
config_uppdaterad: "2026-10-25 07:51 UTC"
order_source: "provider_config"
providers_24h:
  deepseek:
    anrop: 888
    ok: 887
    rate_limits: 0
    errors: 1
    snitt_ms: 3733
  cloudflare:
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 2744
  groq:
    anrop: 74
    ok: 74
    rate_limits: 0
    errors: 0
    snitt_ms: 3357
  gemini:
    anrop: 16
    ok: 13
    rate_limits: 1
    errors: 2
    snitt_ms: 2892
  mistral:
    anrop: 3
    ok: 0
    rate_limits: 0
    errors: 3
    snitt_ms: null
---

# AI Provider Performance — 2026-10-25

## Hälsostatus

🟢 **99.3%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **99.3%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 74 anrop · 74 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `deepseek` | 888 | 887 (99.9%) | 0 (0%) | 1 | 3733 ms | 100% ok · 2140 ms |
| 🟢 `cloudflare` | 1 | 1 (100%) | 0 (0%) | 0 | 2744 ms | 100% ok · 3370 ms |
| 🟢 `groq` | 74 | 74 (100%) | 0 (0%) | 0 | 3357 ms | 100% ok · 690 ms |
| 🟢 `gemini` | 16 | 13 (81.3%) | 1 (6.3%) | 2 | 2892 ms | 100% ok · 960 ms |
| 🔴 `mistral` | 3 | 0 (0%) | 0 (0%) | 3 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`deepseek → cloudflare → groq → gemini → mistral`

*(Benchmark senast körde: 2026-10-25 07:51 UTC)*

## 7-Dagars Trend

```
  🟢 deepseek         99.9% ok   (888 anrop, 0 rl, 1 err)
  🟢 cloudflare       100% ok   (1 anrop, 0 rl, 0 err)
  🟢 groq             100% ok   (74 anrop, 0 rl, 0 err)
  🟢 gemini           81.3% ok   (16 anrop, 1 rl, 2 err)
  🔴 mistral          0% ok   (3 anrop, 0 rl, 3 err)
```

## ⚠️ Problemleverantörer

- **`mistral`**: 0/3 ok (0%), 0 rate-limits, 3 errors

## Analys

Senaste 24h domineras trafiken helt av deepseek med 888 anrop och 99,9% ok, medan groq ligger stabilt på 100% ok på 74 anrop och cloudflare hanterade sitt enda anrop felfritt. Gemini sticker ut negativt med 81,3% ok och en rate-limit på bara 16 anrop, och mistral är den tydliga problemleverantören med 0% ok på 3 anrop (inga svarstider registrerade). Notera att Groqs 9 nycklar sannolikt delar TPD-kvot per konto (~144k), så kapaciteten skalar inte linjärt trots nyckelantalet. Prioriterad rekommendation: ta bort eller tillfälligt inaktivera mistral ur fallback-kedjan och utred dess 0%-fel, samt lägg till övervakningslarm på geminis rate-limits innan de påverkar mer än marginell trafik.
