---
date: 2026-11-17
type: ai-performance
overall_health_24h: 68.5
overall_health_7d: 67.8
total_calls_24h: 863
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "deepseek"]
ranked_order: ["groq", "mistral", "gemini", "cloudflare", "deepseek"]
config_uppdaterad: "2026-11-17 11:16 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 296
    ok: 238
    rate_limits: 58
    errors: 0
    snitt_ms: 1839
  mistral:
    anrop: 223
    ok: 178
    rate_limits: 45
    errors: 0
    snitt_ms: 5919
  gemini:
    anrop: 108
    ok: 44
    rate_limits: 50
    errors: 14
    snitt_ms: 19417
  cloudflare:
    anrop: 183
    ok: 124
    rate_limits: 54
    errors: 5
    snitt_ms: 6114
  deepseek:
    anrop: 42
    ok: 0
    rate_limits: 0
    errors: 42
    snitt_ms: null
---

# AI Provider Performance — 2026-11-17

## Hälsostatus

🟡 **68.5%** lyckade anrop senaste 24h · 863 anrop totalt
🟡 **67.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 296 anrop · 238 (80.4%) OK · 58 (19.6%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 296 | 238 (80.4%) | 58 (19.6%) | 0 | 1839 ms | 100% ok · 630 ms |
| 🟡 `mistral` | 223 | 178 (79.8%) | 45 (20.2%) | 0 | 5919 ms | 20% ok · 1110 ms |
| 🔴 `gemini` | 108 | 44 (40.7%) | 50 (46.3%) | 14 | 19417 ms | 100% ok · 3980 ms |
| 🟡 `cloudflare` | 183 | 124 (67.8%) | 54 (29.5%) | 5 | 6114 ms | 0% ok · 0 ms |
| 🔴 `deepseek` | 42 | 0 (0%) | 0 (0%) | 42 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → mistral → gemini → cloudflare → deepseek`

*(Benchmark senast körde: 2026-11-17 11:16 UTC)*

## 7-Dagars Trend

```
  🟢 groq             81.1% ok   (350 anrop, 66 rl, 0 err)
  🟡 mistral          79.2% ok   (265 anrop, 55 rl, 0 err)
  🔴 gemini           40.2% ok   (127 anrop, 59 rl, 17 err)
  🟡 cloudflare       64.2% ok   (193 anrop, 64 rl, 5 err)
  🔴 deepseek         0% ok   (52 anrop, 0 rl, 52 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 44/108 ok (40.7%), 50 rate-limits, 14 errors
- **`deepseek`**: 0/42 ok (0%), 0 rate-limits, 42 errors

## Analys

Under de senaste 24 timmarna har Groq fortsatt att vara den mest pålitliga leverantören med 80 % lyckade anrop (296 stycken) och en genomsnittlig svarstid på 1,8 s, men den har nått sin TPD‑kvot på ca 144 k och visar 58 rate‑limits. Mistral ligger på 79 % lyckade anrop (223 stycken) men svarstiden har ökat till 5,9 s och även den har 45 rate‑limits. Gemini och DeepSeek presterar dåligt: Gemini har bara 40 % lyckade anrop (108 stycken) med en extrem svarstid på 19,4 s, medan DeepSeek inte levererat någon lyckad förfrågan alls (42 anrop). 

**Rekommendation (prioriterad):** 1️⃣ fortsätt att prioritera Groq som primär leverantör och övervaka kvotanvändning; 2️⃣ om Groq‑kapaciteten blir en flaskhals, skifta till Mistral som sekundär; 3️⃣ undvik Gemini och DeepSeek tills deras felprocent sjunker under 30 % och svarstiderna förbättras.
