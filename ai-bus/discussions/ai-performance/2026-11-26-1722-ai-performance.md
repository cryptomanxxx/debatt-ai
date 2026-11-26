---
date: 2026-11-26
type: ai-performance
overall_health_24h: 19.7
overall_health_7d: 19.7
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "mistral", "deepseek"]
ranked_order: ["groq", "cloudflare", "gemini", "mistral", "deepseek"]
config_uppdaterad: "2026-11-26 11:36 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 103
    ok: 103
    rate_limits: 0
    errors: 0
    snitt_ms: 1183
  cloudflare:
    anrop: 120
    ok: 79
    rate_limits: 28
    errors: 13
    snitt_ms: 8016
  gemini:
    anrop: 64
    ok: 14
    rate_limits: 32
    errors: 18
    snitt_ms: 13188
  mistral:
    anrop: 676
    ok: 0
    rate_limits: 0
    errors: 676
    snitt_ms: null
  deepseek:
    anrop: 33
    ok: 0
    rate_limits: 0
    errors: 33
    snitt_ms: null
---

# AI Provider Performance — 2026-11-26

## Hälsostatus

🔴 **19.7%** lyckade anrop senaste 24h · 1000 anrop totalt
🔴 **19.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 103 anrop · 103 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 103 | 103 (100%) | 0 (0%) | 0 | 1183 ms | 100% ok · 830 ms |
| 🟡 `cloudflare` | 120 | 79 (65.8%) | 28 (23.3%) | 13 | 8016 ms | 100% ok · 5370 ms |
| 🔴 `gemini` | 64 | 14 (21.9%) | 32 (50%) | 18 | 13188 ms | 90% ok · 3500 ms |
| 🔴 `mistral` | 676 | 0 (0%) | 0 (0%) | 676 | – | 0% ok · 0 ms |
| 🔴 `deepseek` | 33 | 0 (0%) | 0 (0%) | 33 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → cloudflare → gemini → mistral → deepseek`

*(Benchmark senast körde: 2026-11-26 11:36 UTC)*

## 7-Dagars Trend

```
  🟢 groq             100% ok   (103 anrop, 0 rl, 0 err)
  🟡 cloudflare       65.8% ok   (120 anrop, 28 rl, 13 err)
  🔴 gemini           21.9% ok   (64 anrop, 32 rl, 18 err)
  🔴 mistral          0% ok   (676 anrop, 0 rl, 676 err)
  🔴 deepseek         0% ok   (33 anrop, 0 rl, 33 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 14/64 ok (21.9%), 32 rate-limits, 18 errors
- **`mistral`**: 0/676 ok (0%), 0 rate-limits, 676 errors
- **`deepseek`**: 0/33 ok (0%), 0 rate-limits, 33 errors

## Analys

Under de senaste 24 timmarna har Groq levererat stabil prestanda med 103 anrop och 100 % lyckade svar (latens 1,183 ms) utan några rate‑limits. Cloudflare fungerar också, men bara 65,8 % av de 120 anropen lyckas och 28 av dem träffar rate‑limit‑gränsen, vilket ger en hög medellatens på 8 016 ms. Gemini och Mistral är kritiska problemkällor – Gemini har endast 21,9 % lyckade anrop (32 rate‑limits) och Mistral har 0 % framgång på 676 anrop. Deepseek är också otillförlitligt med 0 % lyckade anrop.  

**Rekommendation (prioriterad):** 1) Fortsätt använda Groq som primär leverantör. 2) Öka kapaciteten eller justera rate‑limit‑hanteringen för Cloudflare för att minska avbrott. 3) Avaktivera Gemini, Mistral och Deepseek tills deras stabilitet förbättras, och ersätt dem med alternativa leverantörer i fallback‑kedjan.
