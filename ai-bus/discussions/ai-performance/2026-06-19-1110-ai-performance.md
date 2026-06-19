---
date: 2026-06-19
type: ai-performance
overall_health_24h: 96.7
overall_health_7d: 90.6
total_calls_24h: 541
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["groq", "mistral", "sambanova", "deepseek", "cloudflare", "github_models", "cerebras", "gemini"]
config_uppdaterad: "2026-06-19 08:26 UTC"
providers_24h:
  mistral:
    anrop: 410
    ok: 410
    rate_limits: 0
    errors: 0
    snitt_ms: 1196
  groq:
    anrop: 131
    ok: 113
    rate_limits: 18
    errors: 0
    snitt_ms: 759
---

# AI Provider Performance — 2026-06-19

## Hälsostatus

🟢 **96.7%** lyckade anrop senaste 24h · 541 anrop totalt
🟢 **90.6%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 131 anrop · 113 (86.3%) OK · 18 (13.7%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `mistral` | 410 | 410 (100%) | 0 (0%) | 0 | 1196 ms |
| 🟢 `groq` | 131 | 113 (86.3%) | 18 (13.7%) | 0 | 759 ms |

## Nuvarande Fallback-ordning

`groq → mistral → sambanova → deepseek → cloudflare → github_models → cerebras → gemini`

*(Benchmark senast körde: 2026-06-19 08:26 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (537 anrop, 0 rl, 0 err)
  🟡 groq             79.5% ok   (229 anrop, 46 rl, 1 err)
  🟢 deepseek         100% ok   (132 anrop, 0 rl, 0 err)
  🟢 sambanova        81.4% ok   (59 anrop, 11 rl, 0 err)
  🔴 github_models    12.2% ok   (41 anrop, 0 rl, 36 err)
  🟢 codestral        100% ok   (1 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har Mistral levererat 410 anrop utan några rate‑limits och med en genomsnittlig svarstid på 1196 ms, vilket ger 100 % godkända svar. Groq har hanterat 131 anrop med en svarstid på 759 ms, men endast 86,3 % av dem var godkända och 18 anrop drabbades av rate‑limits – troligen på grund av den gemensamma TPD‑kvoten på ~144 k per konto. Inga andra leverantörer har nått kritiska trösklar (>30 % fel eller <50 % godkända), så fallback‑kedjan har inte behövt aktiveras. **Rekommendation:** fortsätt prioritera Mistral som huvud‑provider, men övervaka Groq‑kvoten noggrant och överväg att distribuera ytterligare Groq‑nycklar eller skifta belastning till nästa i fallback‑ordningen (Mistral → Sambanova) om rate‑limits blir återkommande.
