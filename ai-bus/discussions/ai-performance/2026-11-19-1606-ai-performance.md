---
date: 2026-11-19
type: ai-performance
overall_health_24h: 64.8
overall_health_7d: 64.8
total_calls_24h: 411
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "cloudflare", "deepseek"]
ranked_order: ["groq", "mistral", "gemini", "cloudflare", "deepseek"]
config_uppdaterad: "2026-11-19 10:49 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 80
    ok: 80
    rate_limits: 0
    errors: 0
    snitt_ms: 1312
  mistral:
    anrop: 157
    ok: 125
    rate_limits: 32
    errors: 0
    snitt_ms: 6992
  gemini:
    anrop: 84
    ok: 43
    rate_limits: 26
    errors: 15
    snitt_ms: 14681
  cloudflare:
    anrop: 46
    ok: 8
    rate_limits: 26
    errors: 12
    snitt_ms: 43070
  deepseek:
    anrop: 28
    ok: 0
    rate_limits: 0
    errors: 28
    snitt_ms: null
---

# AI Provider Performance — 2026-11-19

## Hälsostatus

🟡 **64.8%** lyckade anrop senaste 24h · 411 anrop totalt
🟡 **64.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 80 anrop · 80 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 80 | 80 (100%) | 0 (0%) | 0 | 1312 ms | 100% ok · 660 ms |
| 🟡 `mistral` | 157 | 125 (79.6%) | 32 (20.4%) | 0 | 6992 ms | 20% ok · 1010 ms |
| 🟡 `gemini` | 84 | 43 (51.2%) | 26 (31%) | 15 | 14681 ms | 100% ok · 2350 ms |
| 🔴 `cloudflare` | 46 | 8 (17.4%) | 26 (56.5%) | 12 | 43070 ms | 0% ok · 0 ms |
| 🔴 `deepseek` | 28 | 0 (0%) | 0 (0%) | 28 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → mistral → gemini → cloudflare → deepseek`

*(Benchmark senast körde: 2026-11-19 10:49 UTC)*

## 7-Dagars Trend

```
  🟢 groq             93.7% ok   (189 anrop, 12 rl, 0 err)
  🟡 mistral          79.4% ok   (349 anrop, 72 rl, 0 err)
  🔴 gemini           43.7% ok   (174 anrop, 63 rl, 35 err)
  🟡 cloudflare       50.5% ok   (196 anrop, 65 rl, 32 err)
  🔴 deepseek         0% ok   (62 anrop, 0 rl, 62 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 43/84 ok (51.2%), 26 rate-limits, 15 errors
- **`cloudflare`**: 8/46 ok (17.4%), 26 rate-limits, 12 errors
- **`deepseek`**: 0/28 ok (0%), 0 rate-limits, 28 errors

## Analys

Under de senaste 24 timmarna har Groq levererat stabil prestanda med 80 anrop och 100 % lyckade svar samt en genomsnittlig svarstid på 1,3 s. Mistral presterade rimligt med 158 anrop, men bara 79,6 % lyckade och 32 rate‑limits, vilket förlängde svarstiden till ca 7 s. Gemini och Cloudflare har betydligt sämre resultat – Gemini klarade endast 51 % av anropen (26 rate‑limits, 14,7 s) och Cloudflare bara 17 % (26 rate‑limits, 43 s). Deepseek levererade inga lyckade svar alls.  

**Rekommendation (prioriterad):** Använd Groq som primär leverantör, håll Mistral som sekundär fallback, och avaktivera Gemini, Cloudflare och Deepseek tills deras felprocent och svarstider förbättras.
