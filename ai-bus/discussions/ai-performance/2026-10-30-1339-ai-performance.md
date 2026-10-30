---
date: 2026-10-30
type: ai-performance
overall_health_24h: 98.4
overall_health_7d: 98.4
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["mistral"]
ranked_order: ["deepseek", "cloudflare", "gemini", "groq", "mistral"]
config_uppdaterad: "2026-10-30 09:08 UTC"
order_source: "provider_config"
providers_24h:
  deepseek:
    anrop: 885
    ok: 885
    rate_limits: 0
    errors: 0
    snitt_ms: 3567
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  gemini:
    anrop: 11
    ok: 10
    rate_limits: 1
    errors: 0
    snitt_ms: 12926
  groq:
    anrop: 69
    ok: 69
    rate_limits: 0
    errors: 0
    snitt_ms: 1380
  mistral:
    anrop: 15
    ok: 0
    rate_limits: 0
    errors: 15
    snitt_ms: null
---

# AI Provider Performance — 2026-10-30

## Hälsostatus

🟢 **98.4%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **98.4%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 69 anrop · 69 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `deepseek` | 885 | 885 (100%) | 0 (0%) | 0 | 3567 ms | 100% ok · 1950 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4570 ms |
| 🟢 `gemini` | 11 | 10 (90.9%) | 1 (9.1%) | 0 | 12926 ms | 100% ok · 1010 ms |
| 🟢 `groq` | 69 | 69 (100%) | 0 (0%) | 0 | 1380 ms | 100% ok · 670 ms |
| 🔴 `mistral` | 15 | 0 (0%) | 0 (0%) | 15 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`deepseek → cloudflare → gemini → groq → mistral`

*(Benchmark senast körde: 2026-10-30 09:08 UTC)*

## 7-Dagars Trend

```
  🟢 deepseek         100% ok   (885 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 gemini           90.9% ok   (11 anrop, 1 rl, 0 err)
  🟢 groq             100% ok   (69 anrop, 0 rl, 0 err)
  🔴 mistral          0% ok   (15 anrop, 0 rl, 15 err)
```

## ⚠️ Problemleverantörer

- **`mistral`**: 0/15 ok (0%), 0 rate-limits, 15 errors

## Analys

Under senaste 24h dominerade deepseek med 885 anrop och 100% ok, medan groq levererade 69 anrop med 100% ok och snabbast svarstid (1380 ms). Mistral är den tydliga problemleverantören med 0% ok på 15 anrop, och gemini visar både rate-limits (1 st) och hög latens (12926 ms) trots 90.9% ok. Cloudflare har inte anropats alls och bör verifieras som fungerande fallback. Prioriterad rekommendation: åtgärda eller tillfälligt avaktivera mistral i fallback-kedjan omedelbart, och följ upp med en hälsokontroll av cloudflare samt en genomgång av geminis latens/rate-limit-inställningar.
