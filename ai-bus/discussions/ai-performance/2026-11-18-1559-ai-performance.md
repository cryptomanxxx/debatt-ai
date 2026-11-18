---
date: 2026-11-18
type: ai-performance
overall_health_24h: 68.6
overall_health_7d: 62.7
total_calls_24h: 463
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "deepseek"]
ranked_order: ["groq", "mistral", "gemini", "cloudflare", "deepseek"]
config_uppdaterad: "2026-11-18 10:48 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 77
    ok: 77
    rate_limits: 0
    errors: 0
    snitt_ms: 1280
  mistral:
    anrop: 140
    ok: 109
    rate_limits: 31
    errors: 0
    snitt_ms: 4999
  gemini:
    anrop: 73
    ok: 31
    rate_limits: 25
    errors: 17
    snitt_ms: 13826
  cloudflare:
    anrop: 134
    ok: 91
    rate_limits: 23
    errors: 20
    snitt_ms: 5937
  deepseek:
    anrop: 25
    ok: 0
    rate_limits: 0
    errors: 25
    snitt_ms: null
---

# AI Provider Performance — 2026-11-18

## Hälsostatus

🟡 **68.6%** lyckade anrop senaste 24h · 463 anrop totalt
🟡 **62.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 77 anrop · 77 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 77 | 77 (100%) | 0 (0%) | 0 | 1280 ms | 100% ok · 670 ms |
| 🟡 `mistral` | 140 | 109 (77.9%) | 31 (22.1%) | 0 | 4999 ms | 20% ok · 900 ms |
| 🔴 `gemini` | 73 | 31 (42.5%) | 25 (34.2%) | 17 | 13826 ms | 100% ok · 1140 ms |
| 🟡 `cloudflare` | 134 | 91 (67.9%) | 23 (17.2%) | 20 | 5937 ms | 0% ok · 0 ms |
| 🔴 `deepseek` | 25 | 0 (0%) | 0 (0%) | 25 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → mistral → gemini → cloudflare → deepseek`

*(Benchmark senast körde: 2026-11-18 10:48 UTC)*

## 7-Dagars Trend

```
  🟢 groq             81.4% ok   (258 anrop, 48 rl, 0 err)
  🟡 mistral          78.7% ok   (315 anrop, 67 rl, 0 err)
  🔴 gemini           40.6% ok   (165 anrop, 68 rl, 30 err)
  🔴 cloudflare       49.7% ok   (183 anrop, 72 rl, 20 err)
  🔴 deepseek         0% ok   (61 anrop, 0 rl, 61 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 31/73 ok (42.5%), 25 rate-limits, 17 errors
- **`deepseek`**: 0/25 ok (0%), 0 rate-limits, 25 errors

## Analys

Under de senaste 24 timmarna har Groq levererat stabil prestanda med 77 anrop och 100 % lyckade svar utan någon rate‑limit, men svarstiden är relativt hög (≈1,3 s). Mistral har klarat 140 anrop men bara 77,9 % lyckade svar och drabbats av 31 rate‑limits, vilket ger en genomsnittlig svarstid på nästan 5 s. Gemini och Deepseek presterar dåligt: Gemini har bara 42,5 % lyckade anrop och 25 rate‑limits med en mycket lång svarstid (≈13,8 s), medan Deepseek inte lyckades leverera någon giltig svar alls. **Rekommendation:** prioritera Groq som primär leverantör, använd Mistral som sekundär fallback och undvik Gemini samt Deepseek tills deras stabilitet förbättras.
