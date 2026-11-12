---
date: 2026-11-12
type: ai-performance
overall_health_24h: 60.5
overall_health_7d: 60.6
total_calls_24h: 915
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "cloudflare", "deepseek"]
ranked_order: ["groq", "gemini", "mistral", "cloudflare", "deepseek"]
config_uppdaterad: "2026-11-12 10:23 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 276
    ok: 212
    rate_limits: 64
    errors: 0
    snitt_ms: 2122
  gemini:
    anrop: 120
    ok: 44
    rate_limits: 59
    errors: 17
    snitt_ms: 6900
  mistral:
    anrop: 267
    ok: 201
    rate_limits: 62
    errors: 4
    snitt_ms: 6717
  cloudflare:
    anrop: 167
    ok: 79
    rate_limits: 53
    errors: 35
    snitt_ms: 6919
  deepseek:
    anrop: 56
    ok: 0
    rate_limits: 0
    errors: 56
    snitt_ms: null
---

# AI Provider Performance — 2026-11-12

## Hälsostatus

🟡 **60.5%** lyckade anrop senaste 24h · 915 anrop totalt
🟡 **60.6%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 276 anrop · 212 (76.8%) OK · 64 (23.2%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `groq` | 276 | 212 (76.8%) | 64 (23.2%) | 0 | 2122 ms | 100% ok · 650 ms |
| 🔴 `gemini` | 120 | 44 (36.7%) | 59 (49.2%) | 17 | 6900 ms | 100% ok · 970 ms |
| 🟡 `mistral` | 267 | 201 (75.3%) | 62 (23.2%) | 4 | 6717 ms | 20% ok · 1110 ms |
| 🔴 `cloudflare` | 167 | 79 (47.3%) | 53 (31.7%) | 35 | 6919 ms | 0% ok · 0 ms |
| 🔴 `deepseek` | 56 | 0 (0%) | 0 (0%) | 56 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → gemini → mistral → cloudflare → deepseek`

*(Benchmark senast körde: 2026-11-12 10:23 UTC)*

## 7-Dagars Trend

```
  🟡 groq             77% ok   (300 anrop, 69 rl, 0 err)
  🔴 gemini           36.8% ok   (133 anrop, 65 rl, 19 err)
  🟡 mistral          75.8% ok   (298 anrop, 68 rl, 4 err)
  🔴 cloudflare       45.7% ok   (173 anrop, 59 rl, 35 err)
  🔴 deepseek         0% ok   (62 anrop, 0 rl, 62 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 44/120 ok (36.7%), 59 rate-limits, 17 errors
- **`cloudflare`**: 79/167 ok (47.3%), 53 rate-limits, 35 errors
- **`deepseek`**: 0/56 ok (0%), 0 rate-limits, 56 errors

## Analys

Under de senaste 24 timmarna har Groq levererat den bästa prestandan med 276 anrop och 76,8 % lyckade svar samt en genomsnittlig svarstid på 2,1 s, medan Gemini och Cloudflare har haft betydande problem – endast 36,7 % respektive 47,3 % av anropen lyckades och svarstiderna ligger runt 7 s. Mistral presterar rimligt med 75,3 % lyckade anrop (267 stycken) men har också en hög andel rate‑limits (62). Deepseek har i nuläget ingen lyckad förfrågan och bör undvikas helt. Prioriterad rekommendation: fortsätt att använda Groq som primär leverantör, håll Mistral som sekundär fallback och avaktivera Gemini, Cloudflare och Deepseek tills deras felprocent sjunker under 30 %.
