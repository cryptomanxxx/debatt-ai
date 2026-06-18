---
date: 2026-06-18
type: ai-performance
overall_health_24h: 94.1
overall_health_7d: 90.3
total_calls_24h: 543
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["groq", "mistral", "deepseek", "cloudflare", "github_models", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-06-18 07:24 UTC"
providers_24h:
  mistral:
    anrop: 357
    ok: 357
    rate_limits: 0
    errors: 0
    snitt_ms: 937
  groq:
    anrop: 132
    ok: 116
    rate_limits: 16
    errors: 0
    snitt_ms: 712
  sambanova:
    anrop: 52
    ok: 36
    rate_limits: 16
    errors: 0
    snitt_ms: 3966
---

# AI Provider Performance — 2026-06-18

## Hälsostatus

🟢 **94.1%** lyckade anrop senaste 24h · 543 anrop totalt
🟢 **90.3%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 132 anrop · 116 (87.9%) OK · 16 (12.1%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `mistral` | 357 | 357 (100%) | 0 (0%) | 0 | 937 ms |
| 🟢 `groq` | 132 | 116 (87.9%) | 16 (12.1%) | 0 | 712 ms |
| 🟡 `sambanova` | 52 | 36 (69.2%) | 16 (30.8%) | 0 | 3966 ms |

## Nuvarande Fallback-ordning

`groq → mistral → deepseek → cloudflare → github_models → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-06-18 07:24 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (537 anrop, 0 rl, 0 err)
  🟢 groq             80.1% ok   (241 anrop, 47 rl, 1 err)
  🟢 deepseek         100% ok   (129 anrop, 0 rl, 0 err)
  🟡 sambanova        76.6% ok   (47 anrop, 11 rl, 0 err)
  🔴 github_models    13.6% ok   (44 anrop, 0 rl, 38 err)
  🟢 codestral        100% ok   (1 anrop, 0 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 36/52 ok (69.2%), 16 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har Mistral levererat stabil prestanda med 357 anrop och 100 % utan fel, med en genomsnittlig svarstid på 937 ms. Groq har hanterat 132 anrop men visar en lägre tillförlitlighet (87,9 % ok) och har redan nått 16 rate‑limits, vilket indikerar att den nuvarande kvoten på ~144 k per konto snart kan bli en flaskhals. Sambanova är den tydligaste flaskhalsen: endast 69,2 % av 52 anrop lyckas och svarstiden skjuter upp till 3 966 ms, samtidigt som den också har 16 rate‑limits. **Rekommendation:** prioritera Mistral som huvudleverantör, öka Groq‑kapaciteten med ytterligare nycklar men håll noga koll på rate‑limits, och de‑prioritera Sambanova tills problemet är löst.
