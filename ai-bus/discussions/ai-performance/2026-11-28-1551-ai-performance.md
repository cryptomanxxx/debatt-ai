---
date: 2026-11-28
type: ai-performance
overall_health_24h: 10.3
overall_health_7d: 10.3
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "mistral", "deepseek", "cloudflare"]
ranked_order: ["groq", "gemini", "mistral", "deepseek", "cloudflare"]
config_uppdaterad: "2026-11-28 10:58 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 76
    ok: 76
    rate_limits: 0
    errors: 0
    snitt_ms: 1165
  gemini:
    anrop: 77
    ok: 24
    rate_limits: 35
    errors: 18
    snitt_ms: 6765
  mistral:
    anrop: 767
    ok: 0
    rate_limits: 0
    errors: 767
    snitt_ms: null
  deepseek:
    anrop: 35
    ok: 0
    rate_limits: 0
    errors: 35
    snitt_ms: null
  cloudflare:
    anrop: 44
    ok: 3
    rate_limits: 35
    errors: 6
    snitt_ms: 43562
---

# AI Provider Performance — 2026-11-28

## Hälsostatus

🔴 **10.3%** lyckade anrop senaste 24h · 1000 anrop totalt
🔴 **10.3%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 76 anrop · 76 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 76 | 76 (100%) | 0 (0%) | 0 | 1165 ms | 100% ok · 650 ms |
| 🔴 `gemini` | 77 | 24 (31.2%) | 35 (45.5%) | 18 | 6765 ms | 100% ok · 730 ms |
| 🔴 `mistral` | 767 | 0 (0%) | 0 (0%) | 767 | – | 0% ok · 0 ms |
| 🔴 `deepseek` | 35 | 0 (0%) | 0 (0%) | 35 | – | 0% ok · 0 ms |
| 🔴 `cloudflare` | 44 | 3 (6.8%) | 35 (79.5%) | 6 | 43562 ms | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → gemini → mistral → deepseek → cloudflare`

*(Benchmark senast körde: 2026-11-28 10:58 UTC)*

## 7-Dagars Trend

```
  🟢 groq             100% ok   (76 anrop, 0 rl, 0 err)
  🔴 gemini           31.2% ok   (77 anrop, 35 rl, 18 err)
  🔴 mistral          0% ok   (767 anrop, 0 rl, 767 err)
  🔴 deepseek         0% ok   (35 anrop, 0 rl, 35 err)
  🔴 cloudflare       6.8% ok   (44 anrop, 35 rl, 6 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 24/77 ok (31.2%), 35 rate-limits, 18 errors
- **`mistral`**: 0/767 ok (0%), 0 rate-limits, 767 errors
- **`deepseek`**: 0/35 ok (0%), 0 rate-limits, 35 errors
- **`cloudflare`**: 3/44 ok (6.8%), 35 rate-limits, 6 errors

## Analys

Under de senaste 24 timmarna har Groq presterat stabilt med 76 anrop och 100 % lyckade svar utan några rate‑limits (med en genomsnittlig svarstid på 1 165 ms). Gemini har däremot bara 31,2 % lyckade anrop (77 totalt) och drabbats av 35 rate‑limits, vilket har lett till en genomsnittlig svarstid på 6 765 ms. Mistral och DeepSeek har ingen framgångsrik respons alls (0 % av 767 respektive 35 anrop), och Cloudflare levererar bara 6,8 % lyckade svar med extremt långa svarstider (43 562 ms) och 35 rate‑limits. **Rekommendation:** Prioritera Groq som huvud‑provider, håll Gemini som sekundär backup med strikt throttling, och inaktivera Mistral, DeepSeek samt Cloudflare tills deras tillgänglighet och svarstider förbättras.
