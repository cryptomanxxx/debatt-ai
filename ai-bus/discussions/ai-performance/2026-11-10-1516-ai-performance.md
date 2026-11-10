---
date: 2026-11-10
type: ai-performance
overall_health_24h: 63.4
overall_health_7d: 62.3
total_calls_24h: 916
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "deepseek"]
ranked_order: ["groq", "mistral", "gemini", "cloudflare", "deepseek"]
config_uppdaterad: "2026-11-10 10:32 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 260
    ok: 201
    rate_limits: 59
    errors: 0
    snitt_ms: 2147
  mistral:
    anrop: 259
    ok: 196
    rate_limits: 60
    errors: 3
    snitt_ms: 5710
  gemini:
    anrop: 123
    ok: 39
    rate_limits: 59
    errors: 25
    snitt_ms: 13627
  cloudflare:
    anrop: 178
    ok: 118
    rate_limits: 53
    errors: 7
    snitt_ms: 6052
  deepseek:
    anrop: 54
    ok: 0
    rate_limits: 0
    errors: 54
    snitt_ms: null
---

# AI Provider Performance — 2026-11-10

## Hälsostatus

🟡 **63.4%** lyckade anrop senaste 24h · 916 anrop totalt
🟡 **62.3%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 260 anrop · 201 (77.3%) OK · 59 (22.7%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `groq` | 260 | 201 (77.3%) | 59 (22.7%) | 0 | 2147 ms | 100% ok · 760 ms |
| 🟡 `mistral` | 259 | 196 (75.7%) | 60 (23.2%) | 3 | 5710 ms | 30% ok · 1250 ms |
| 🔴 `gemini` | 123 | 39 (31.7%) | 59 (48%) | 25 | 13627 ms | 90% ok · 3170 ms |
| 🟡 `cloudflare` | 178 | 118 (66.3%) | 53 (29.8%) | 7 | 6052 ms | 0% ok · 0 ms |
| 🔴 `deepseek` | 54 | 0 (0%) | 0 (0%) | 54 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → mistral → gemini → cloudflare → deepseek`

*(Benchmark senast körde: 2026-11-10 10:32 UTC)*

## 7-Dagars Trend

```
  🟡 groq             76.1% ok   (280 anrop, 67 rl, 0 err)
  🟡 mistral          75.9% ok   (295 anrop, 68 rl, 3 err)
  🔴 gemini           30.8% ok   (133 anrop, 67 rl, 25 err)
  🟡 cloudflare       63.4% ok   (186 anrop, 61 rl, 7 err)
  🔴 deepseek         0% ok   (62 anrop, 0 rl, 62 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 39/123 ok (31.7%), 59 rate-limits, 25 errors
- **`deepseek`**: 0/54 ok (0%), 0 rate-limits, 54 errors

## Analys

Under de senaste 24 timmarna har Groq fortsatt att leverera den bästa stabiliteten med 260 anrop och 77,3 % lyckade svar, men har ändå nått 59 rate‑limits och en genomsnittlig svarstid på 2 147 ms. Mistral ligger nära efter med 259 anrop, 75,7 % lyckade svar och 60 rate‑limits, men svarstiden är betydligt högre (5 052 ms). Gemini och Deepseek har kritiska problem: Gemini har bara 31,7 % lyckade anrop (123 totalt) och en svarstid på 13 627 ms, medan Deepseek inte levererat någon lyckad svar på 54 anrop.  

**Rekommendation (prioriterad):** 1️⃣ Prioritera Groq‑nycklarna och öka deras kvot om möjligt; 2️⃣ Använd Mistral som sekundär fallback; 3️⃣ Undvik Gemini och Deepseek tills deras felprocent sjunker under 30 % och svarstiderna förbättras.
