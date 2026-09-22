---
date: 2026-09-22
type: ai-performance
overall_health_24h: 94
overall_health_7d: 94
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["deepseek", "cloudflare", "groq", "gemini", "mistral"]
config_uppdaterad: "2026-09-22 08:00 UTC"
order_source: "provider_config"
providers_24h:
  deepseek:
    anrop: 828
    ok: 828
    rate_limits: 0
    errors: 0
    snitt_ms: 3511
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 23
    ok: 23
    rate_limits: 0
    errors: 0
    snitt_ms: 2067
  gemini:
    anrop: 63
    ok: 8
    rate_limits: 30
    errors: 25
    snitt_ms: 16498
  mistral:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-09-22

## Hälsostatus

🟢 **94%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **94%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 23 anrop · 23 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `deepseek` | 828 | 828 (100%) | 0 (0%) | 0 | 3511 ms | 100% ok · 1970 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4840 ms |
| 🟢 `groq` | 23 | 23 (100%) | 0 (0%) | 0 | 2067 ms | 100% ok · 730 ms |
| 🔴 `gemini` | 63 | 8 (12.7%) | 30 (47.6%) | 25 | 16498 ms | 100% ok · 980 ms |
| ⚪ `mistral` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`deepseek → cloudflare → groq → gemini → mistral`

*(Benchmark senast körde: 2026-09-22 08:00 UTC)*

## 7-Dagars Trend

```
  🟢 deepseek         100% ok   (828 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (23 anrop, 0 rl, 0 err)
  🔴 gemini           12.7% ok   (63 anrop, 30 rl, 25 err)
  ⚪ mistral          ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`gemini`**: 8/63 ok (12.7%), 30 rate-limits, 25 errors

## Analys

Senaste 24h dominerade deepseek med 828 anrop och 100% ok i 3511 ms, medan groq levererade 23 anrop med 100% ok och snabbast latens (2067 ms). Gemini är den tydliga problemleverantören: 63 anrop, endast 12,7% ok, 30 rate-limits och 16 498 ms latens. Cloudflare och mistral anropades inte alls, vilket gör deras verkliga kapacitet oprövad. Rekommendation: prioritera att flytta gemini bakom groq i fallback-kedjan (eller tillfälligt ta bort gemini) och verifiera Groqs TPD-kvot per konto innan ni räknar med 9 nycklar som linjär kapacitetsökning.
