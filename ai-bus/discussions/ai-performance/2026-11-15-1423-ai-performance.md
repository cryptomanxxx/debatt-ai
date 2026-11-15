---
date: 2026-11-15
type: ai-performance
overall_health_24h: 65.2
overall_health_7d: 64.8
total_calls_24h: 944
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "deepseek"]
ranked_order: ["groq", "mistral", "cloudflare", "gemini", "deepseek"]
config_uppdaterad: "2026-11-15 10:00 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 286
    ok: 224
    rate_limits: 62
    errors: 0
    snitt_ms: 2025
  mistral:
    anrop: 261
    ok: 198
    rate_limits: 59
    errors: 4
    snitt_ms: 5393
  cloudflare:
    anrop: 211
    ok: 143
    rate_limits: 57
    errors: 11
    snitt_ms: 4355
  gemini:
    anrop: 124
    ok: 47
    rate_limits: 56
    errors: 21
    snitt_ms: 10822
  deepseek:
    anrop: 56
    ok: 0
    rate_limits: 0
    errors: 56
    snitt_ms: null
---

# AI Provider Performance — 2026-11-15

## Hälsostatus

🟡 **65.2%** lyckade anrop senaste 24h · 944 anrop totalt
🟡 **64.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 286 anrop · 224 (78.3%) OK · 62 (21.7%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `groq` | 286 | 224 (78.3%) | 62 (21.7%) | 0 | 2025 ms | 100% ok · 660 ms |
| 🟡 `mistral` | 261 | 198 (75.9%) | 59 (22.6%) | 4 | 5393 ms | 20% ok · 1670 ms |
| 🟡 `cloudflare` | 211 | 143 (67.8%) | 57 (27%) | 11 | 4355 ms | 0% ok · 0 ms |
| 🔴 `gemini` | 124 | 47 (37.9%) | 56 (45.2%) | 21 | 10822 ms | 80% ok · 2800 ms |
| 🔴 `deepseek` | 56 | 0 (0%) | 0 (0%) | 56 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → mistral → cloudflare → gemini → deepseek`

*(Benchmark senast körde: 2026-11-15 10:00 UTC)*

## 7-Dagars Trend

```
  🟡 groq             78.4% ok   (306 anrop, 66 rl, 0 err)
  🟡 mistral          75.9% ok   (278 anrop, 63 rl, 4 err)
  🟡 cloudflare       66.5% ok   (215 anrop, 61 rl, 11 err)
  🔴 gemini           36.8% ok   (133 anrop, 60 rl, 24 err)
  🔴 deepseek         0% ok   (60 anrop, 0 rl, 60 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 47/124 ok (37.9%), 56 rate-limits, 21 errors
- **`deepseek`**: 0/56 ok (0%), 0 rate-limits, 56 errors

## Analys

Under de senaste 24 timmarna har Groq fortsatt att leverera den bästa prestandan med 78 % lyckade anrop (286 totalt) och en medelrespons på ca 2 sekunder, men har redan nått sin TPD‑kvot (≈144 k) och visar tecken på rate‑limiting (62 träffar). Mistral ligger på 75 % lyckade anrop (261) men svarstiden har ökat kraftigt till ca 5,4 sekunder, medan Cloudflare presterar något sämre med 68 % (211) och en genomsnittlig svarstid på 4,3 sekunder. Gemini och Deepseek är kritiska flaskhalsar: Gemini har bara 38 % lyckade anrop (124) och en mycket hög latens på 10,8 sekunder, och Deepseek har ingen lyckad förfrågan alls (56 anrop). **Rekommendation:** Prioritera att förstärka Groq‑kapaciteten (t.ex. fler nycklar eller högre kvot) och, om det inte räcker, skifta fallback‑trafik till Mistral; samtidigt bör Gemini och Deepseek tillfälligt avaktiveras tills deras stabilitet förbättras.
