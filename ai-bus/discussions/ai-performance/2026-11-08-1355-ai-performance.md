---
date: 2026-11-08
type: ai-performance
overall_health_24h: 71.2
overall_health_7d: 71.2
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "deepseek"]
ranked_order: ["groq", "mistral", "cloudflare", "gemini", "deepseek"]
config_uppdaterad: "2026-11-08 09:37 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 371
    ok: 329
    rate_limits: 42
    errors: 0
    snitt_ms: 3511
  mistral:
    anrop: 226
    ok: 171
    rate_limits: 55
    errors: 0
    snitt_ms: 5917
  cloudflare:
    anrop: 229
    ok: 174
    rate_limits: 51
    errors: 4
    snitt_ms: 4932
  gemini:
    anrop: 100
    ok: 22
    rate_limits: 51
    errors: 27
    snitt_ms: 6675
  deepseek:
    anrop: 51
    ok: 0
    rate_limits: 0
    errors: 51
    snitt_ms: null
---

# AI Provider Performance — 2026-11-08

## Hälsostatus

🟡 **71.2%** lyckade anrop senaste 24h · 1000 anrop totalt
🟡 **71.2%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 371 anrop · 329 (88.7%) OK · 42 (11.3%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 371 | 329 (88.7%) | 42 (11.3%) | 0 | 3511 ms | 100% ok · 690 ms |
| 🟡 `mistral` | 226 | 171 (75.7%) | 55 (24.3%) | 0 | 5917 ms | 20% ok · 1080 ms |
| 🟡 `cloudflare` | 229 | 174 (76%) | 51 (22.3%) | 4 | 4932 ms | 0% ok · 0 ms |
| 🔴 `gemini` | 100 | 22 (22%) | 51 (51%) | 27 | 6675 ms | 100% ok · 1000 ms |
| 🔴 `deepseek` | 51 | 0 (0%) | 0 (0%) | 51 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → mistral → cloudflare → gemini → deepseek`

*(Benchmark senast körde: 2026-11-08 09:37 UTC)*

## 7-Dagars Trend

```
  🟢 groq             88.7% ok   (371 anrop, 42 rl, 0 err)
  🟡 mistral          75.7% ok   (226 anrop, 55 rl, 0 err)
  🟡 cloudflare       76% ok   (229 anrop, 51 rl, 4 err)
  🔴 gemini           22% ok   (100 anrop, 51 rl, 27 err)
  🔴 deepseek         0% ok   (51 anrop, 0 rl, 51 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 22/100 ok (22%), 51 rate-limits, 27 errors
- **`deepseek`**: 0/51 ok (0%), 0 rate-limits, 51 errors

## Analys

Under de senaste 24 timmarna har Groq fortsatt att leverera den bästa stabiliteten med 371 anrop och 88,7 % lyckade svar, men har ändå nått 42 rate‑limits och en genomsnittlig svarstid på 3511 ms. Mistral och Cloudflare ligger nära varandra med respektive 75,7 % och 76 % lyckade anrop (226 respektive 229 anrop), men deras svarstider är längre (≈5,9 s respektive 4,9 s) och de har också många rate‑limits (55 respektive 51). Gemini och Deepseek är kritiska problemkällor – Gemini lyckas bara med 22 % av 100 anrop och Deepseek misslyckas helt (0 % av 51 anrop). **Rekommendation:** prioritera Groq som primär leverantör, håll Mistral som sekundär fallback och avaktivera Gemini samt Deepseek tills deras felprocent och svarstider förbättras.
