---
date: 2026-11-24
type: ai-performance
overall_health_24h: 66.3
overall_health_7d: 67.7
total_calls_24h: 424
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["cloudflare", "gemini", "deepseek"]
ranked_order: ["groq", "cloudflare", "mistral", "gemini", "deepseek"]
config_uppdaterad: "2026-11-24 13:00 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 76
    ok: 76
    rate_limits: 0
    errors: 0
    snitt_ms: 1287
  cloudflare:
    anrop: 97
    ok: 43
    rate_limits: 36
    errors: 18
    snitt_ms: 5379
  mistral:
    anrop: 158
    ok: 131
    rate_limits: 27
    errors: 0
    snitt_ms: 6669
  gemini:
    anrop: 65
    ok: 28
    rate_limits: 18
    errors: 19
    snitt_ms: 13107
  deepseek:
    anrop: 23
    ok: 0
    rate_limits: 0
    errors: 23
    snitt_ms: null
---

# AI Provider Performance — 2026-11-24

## Hälsostatus

🟡 **66.3%** lyckade anrop senaste 24h · 424 anrop totalt
🟡 **67.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 76 anrop · 76 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 76 | 76 (100%) | 0 (0%) | 0 | 1287 ms | 100% ok · 670 ms |
| 🔴 `cloudflare` | 97 | 43 (44.3%) | 36 (37.1%) | 18 | 5379 ms | 100% ok · 4520 ms |
| 🟢 `mistral` | 158 | 131 (82.9%) | 27 (17.1%) | 0 | 6669 ms | 20% ok · 890 ms |
| 🔴 `gemini` | 65 | 28 (43.1%) | 18 (27.7%) | 19 | 13107 ms | 90% ok · 1590 ms |
| 🔴 `deepseek` | 23 | 0 (0%) | 0 (0%) | 23 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → cloudflare → mistral → gemini → deepseek`

*(Benchmark senast körde: 2026-11-24 13:00 UTC)*

## 7-Dagars Trend

```
  🟢 groq             100% ok   (177 anrop, 0 rl, 0 err)
  🟡 cloudflare       56.8% ok   (301 anrop, 75 rl, 55 err)
  🟢 mistral          81.7% ok   (312 anrop, 57 rl, 0 err)
  🔴 gemini           45% ok   (151 anrop, 42 rl, 41 err)
  🔴 deepseek         0% ok   (50 anrop, 0 rl, 50 err)
```

## ⚠️ Problemleverantörer

- **`cloudflare`**: 43/97 ok (44.3%), 36 rate-limits, 18 errors
- **`gemini`**: 28/65 ok (43.1%), 18 rate-limits, 19 errors
- **`deepseek`**: 0/23 ok (0%), 0 rate-limits, 23 errors

## Analys

Under de senaste 24 timmarna har Groq presterat stabilt med 76 anrop och 100 % lyckade svar (ingen rate‑limit) men med en genomsnittlig svarstid på 1 287 ms. Cloudflare och Gemini har haft allvarliga problem: Cloudflare lyckades endast 44 % av 97 anropen och drabbades av 36 rate‑limits (genomsnitt 5 379 ms), medan Gemini nådde bara 43 % av 65 anropen och hade 18 rate‑limits med en mycket hög svarstid på 13 107 ms. Mistral ligger däremellan med 82,9 % lyckade svar på 158 anrop men 27 rate‑limits och en svarstid på 6 669 ms. Deepseek har för närvarande ingen fungerande trafik (0 % ok).

**Rekommendation (prioriterad):** 1️⃣ Fortsätt använda Groq som primär leverantör. 2️⃣ Flytta så mycket trafik som möjligt från Cloudflare och Gemini till Mistral (eller till Groq om kvoten tillåter). 3️⃣ Undvik Deepseek tills problemet är löst eller ersätt den med en alternativ backup‑provider.
