---
date: 2026-11-09
type: ai-performance
overall_health_24h: 62.4
overall_health_7d: 64.7
total_calls_24h: 831
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "cloudflare", "deepseek"]
ranked_order: ["groq", "mistral", "gemini", "cloudflare", "deepseek"]
config_uppdaterad: "2026-11-09 10:28 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 256
    ok: 199
    rate_limits: 57
    errors: 0
    snitt_ms: 2320
  mistral:
    anrop: 260
    ok: 199
    rate_limits: 57
    errors: 4
    snitt_ms: 5776
  gemini:
    anrop: 98
    ok: 27
    rate_limits: 51
    errors: 20
    snitt_ms: 10309
  cloudflare:
    anrop: 146
    ok: 82
    rate_limits: 53
    errors: 11
    snitt_ms: 2655
  deepseek:
    anrop: 53
    ok: 0
    rate_limits: 0
    errors: 53
    snitt_ms: null
---

# AI Provider Performance — 2026-11-09

## Hälsostatus

🟡 **62.4%** lyckade anrop senaste 24h · 831 anrop totalt
🟡 **64.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 256 anrop · 199 (77.7%) OK · 57 (22.3%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `groq` | 256 | 199 (77.7%) | 57 (22.3%) | 0 | 2320 ms | 100% ok · 690 ms |
| 🟡 `mistral` | 260 | 199 (76.5%) | 57 (21.9%) | 4 | 5776 ms | 20% ok · 1340 ms |
| 🔴 `gemini` | 98 | 27 (27.6%) | 51 (52%) | 20 | 10309 ms | 100% ok · 970 ms |
| 🟡 `cloudflare` | 146 | 82 (56.2%) | 53 (36.3%) | 11 | 2655 ms | 0% ok · 0 ms |
| 🔴 `deepseek` | 53 | 0 (0%) | 0 (0%) | 53 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → mistral → gemini → cloudflare → deepseek`

*(Benchmark senast körde: 2026-11-09 10:28 UTC)*

## 7-Dagars Trend

```
  🟡 groq             78.8% ok   (311 anrop, 66 rl, 0 err)
  🟡 mistral          76.4% ok   (296 anrop, 66 rl, 4 err)
  🔴 gemini           29.5% ok   (112 anrop, 58 rl, 21 err)
  🟡 cloudflare       64.1% ok   (198 anrop, 56 rl, 15 err)
  🔴 deepseek         0% ok   (58 anrop, 0 rl, 58 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 27/98 ok (27.6%), 51 rate-limits, 20 errors
- **`cloudflare`**: 82/146 ok (56.2%), 53 rate-limits, 11 errors
- **`deepseek`**: 0/53 ok (0%), 0 rate-limits, 53 errors

## Analys

Under de senaste 24 timmarna har Groq levererat 256 anrop med 77,7 % lyckade svar och en medel‑latens på 2,3 s, medan Mistral ligger nära med 260 anrop, 76,5 % lyckade svar och 5,8 s latens. Gemini presterar dåligt (27,6 % lyckade svar, 10,3 s latens) och Cloudflare är också underkänt (56,2 % lyckade svar, 2,7 s latens); Deepseek har ingen lyckad förfrågan alls. Hälsopoängen för hela systemet är 62,4 % för 24 h och 64,7 % för 7 d, med totalt 831 anrop. **Rekommendation:** prioritera Groq som primär leverantör, håll Mistral som sekundär fallback och undvik Gemini, Cloudflare och Deepseek tills deras felprocent sjunker under 30 %.
