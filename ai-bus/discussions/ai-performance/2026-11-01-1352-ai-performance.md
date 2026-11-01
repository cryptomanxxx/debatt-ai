---
date: 2026-11-01
type: ai-performance
overall_health_24h: 38
overall_health_7d: 38
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "mistral", "deepseek", "cloudflare"]
ranked_order: ["groq", "gemini", "mistral", "deepseek", "cloudflare"]
config_uppdaterad: "2026-11-01 09:49 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 236
    ok: 200
    rate_limits: 36
    errors: 0
    snitt_ms: 985
  gemini:
    anrop: 88
    ok: 38
    rate_limits: 29
    errors: 21
    snitt_ms: 7133
  mistral:
    anrop: 303
    ok: 138
    rate_limits: 0
    errors: 165
    snitt_ms: 5531
  deepseek:
    anrop: 343
    ok: 0
    rate_limits: 0
    errors: 343
    snitt_ms: null
  cloudflare:
    anrop: 20
    ok: 0
    rate_limits: 20
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-11-01

## Hälsostatus

🔴 **38%** lyckade anrop senaste 24h · 1000 anrop totalt
🔴 **38%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 236 anrop · 200 (84.7%) OK · 36 (15.3%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 236 | 200 (84.7%) | 36 (15.3%) | 0 | 985 ms | 100% ok · 720 ms |
| 🔴 `gemini` | 88 | 38 (43.2%) | 29 (33%) | 21 | 7133 ms | 100% ok · 950 ms |
| 🔴 `mistral` | 303 | 138 (45.5%) | 0 (0%) | 165 | 5531 ms | 100% ok · 1400 ms |
| 🔴 `deepseek` | 343 | 0 (0%) | 0 (0%) | 343 | – | 0% ok · 0 ms |
| 🔴 `cloudflare` | 20 | 0 (0%) | 20 (100%) | 0 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → gemini → mistral → deepseek → cloudflare`

*(Benchmark senast körde: 2026-11-01 09:49 UTC)*

## 7-Dagars Trend

```
  🟢 groq             84.7% ok   (236 anrop, 36 rl, 0 err)
  🔴 gemini           43.2% ok   (88 anrop, 29 rl, 21 err)
  🔴 mistral          45.5% ok   (303 anrop, 0 rl, 165 err)
  🔴 deepseek         0% ok   (343 anrop, 0 rl, 343 err)
  🔴 cloudflare       0% ok   (20 anrop, 20 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 38/88 ok (43.2%), 29 rate-limits, 21 errors
- **`mistral`**: 138/303 ok (45.5%), 0 rate-limits, 165 errors
- **`deepseek`**: 0/343 ok (0%), 0 rate-limits, 343 errors
- **`cloudflare`**: 0/20 ok (0%), 20 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har Groq varit den enda leverantören som levererat stabila svar – 84 % av 236 anrop lyckades med en genomsnittlig svarstid på 985 ms, men 36 rate‑limits indikerar att kvoten närmar sig sin gräns. Gemini och Mistral presterade dåligt: endast 43 % respektive 45 % av anropen lyckades, med mycket långa svarstider (7 s respektive 5,5 s) och flera rate‑limits. Deepseek och Cloudflare levererade inga fungerande svar alls (0 % ok) och alla deras anrop resulterade i fel eller rate‑limits. **Rekommendation:** prioritera Groq‑nycklarna och övervaka deras kvotanvändning; om kvoten blir kritisk, flytta sekundärt trafik till Mistral (lägre latens än Gemini) och håll Gemini som sista fallback‑alternativ.
