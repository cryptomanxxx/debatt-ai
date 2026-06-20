---
date: 2026-06-20
type: ai-performance
overall_health_24h: 97.1
overall_health_7d: 93.7
total_calls_24h: 652
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["groq", "sambanova", "mistral", "deepseek", "cloudflare", "github_models", "cerebras", "gemini"]
config_uppdaterad: "2026-06-20 06:53 UTC"
providers_24h:
  mistral:
    anrop: 496
    ok: 496
    rate_limits: 0
    errors: 0
    snitt_ms: 1246
  groq:
    anrop: 156
    ok: 137
    rate_limits: 19
    errors: 0
    snitt_ms: 769
---

# AI Provider Performance — 2026-06-20

## Hälsostatus

🟢 **97.1%** lyckade anrop senaste 24h · 652 anrop totalt
🟢 **93.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 156 anrop · 137 (87.8%) OK · 19 (12.2%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `mistral` | 496 | 496 (100%) | 0 (0%) | 0 | 1246 ms |
| 🟢 `groq` | 156 | 137 (87.8%) | 19 (12.2%) | 0 | 769 ms |

## Nuvarande Fallback-ordning

`groq → sambanova → mistral → deepseek → cloudflare → github_models → cerebras → gemini`

*(Benchmark senast körde: 2026-06-20 06:53 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (537 anrop, 0 rl, 0 err)
  🟡 groq             77.5% ok   (231 anrop, 48 rl, 4 err)
  🟢 deepseek         100% ok   (159 anrop, 0 rl, 0 err)
  🟢 sambanova        84.1% ok   (69 anrop, 11 rl, 0 err)
  🟢 codestral        100% ok   (3 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har Mistral levererat 496 anrop utan några rate‑limits och med 100 % framgång, vilket ger en genomsnittlig svarstid på 1 246 ms. Groq har hanterat 156 anrop men bara 87,8 % lyckades, och 19 anrop drabbades av rate‑limits; svarstiden är något bättre (≈ 769 ms) men den begränsade kvoten (~144 k per konto) kan bli en flaskhals. Inga andra leverantörer har nått kritiska felnivåer (>30 % misslyckande eller <50 % OK), så fallback‑kedjan (groq → sambanova → mistral …) har inte behövts aktiveras. **Rekommendation:** prioritera Mistral som primär provider, håll Groq som sekundär men övervaka kvot‑ och rate‑limit‑status noggrant och förbered en snabb switch till Sambanova om Groq‑kapaciteten blir ett hinder.
