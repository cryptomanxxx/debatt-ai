---
date: 2026-06-14
type: ai-performance
overall_health_24h: 91.9
overall_health_7d: 77
total_calls_24h: 74
total_calls_7d: 226
problem_providers: []
ranked_order: ["groq", "sambanova", "mistral", "deepseek", "github_models", "cloudflare", "cerebras", "gemini"]
config_uppdaterad: "2026-06-14 07:14 UTC"
providers_24h:
  deepseek:
    anrop: 41
    ok: 41
    rate_limits: 0
    errors: 0
    snitt_ms: 3890
  groq:
    anrop: 33
    ok: 27
    rate_limits: 6
    errors: 0
    snitt_ms: 1210
---

# AI Provider Performance — 2026-06-14

## Hälsostatus

🟢 **91.9%** lyckade anrop senaste 24h · 74 anrop totalt
🟡 **77%** lyckade anrop senaste 7 dagar · 226 anrop totalt

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `deepseek` | 41 | 41 (100%) | 0 (0%) | 0 | 3890 ms |
| 🟢 `groq` | 33 | 27 (81.8%) | 6 (18.2%) | 0 | 1210 ms |

## Nuvarande Fallback-ordning

`groq → sambanova → mistral → deepseek → github_models → cloudflare → cerebras → gemini`

*(Benchmark senast körde: 2026-06-14 07:14 UTC)*

## 7-Dagars Trend

```
  🟢 groq             85.7% ok   (98 anrop, 14 rl, 0 err)
  🟢 deepseek         100% ok   (84 anrop, 0 rl, 0 err)
  🔴 github_models    13.6% ok   (44 anrop, 0 rl, 38 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen haft en hälsopoäng på 91,9 % och totalt 74 anrop. Deepseek hanterade 41 anrop utan några fel eller rate‑limits, men med en genomsnittlig svarstid på 3 890 ms, medan Groq svarade på 33 anrop med 81,8 % framgång och 6 rate‑limits men med kortare latens (1 210 ms). Inga leverantörer har överskridit 30 % fel‑ eller under‑50 % framgångsgränsen, så systemet fungerar stabilt. **Rekommendation:** prioritera Deepseek för kritiska uppgifter där pålitlighet är viktigare än hastighet, och låt Groq vara sekundär för snabba, mindre känsliga förfråg
