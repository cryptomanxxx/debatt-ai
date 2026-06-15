---
date: 2026-06-15
type: ai-performance
overall_health_24h: 93.3
overall_health_7d: 81.3
total_calls_24h: 75
total_calls_7d: 310
groq_nyckelpool: 9 (1 296 000 tokens/dag poolat) + kanal-nyckel
problem_providers: []
ranked_order: ["sambanova", "groq", "mistral", "deepseek", "github_models", "cloudflare", "cerebras", "gemini"]
config_uppdaterad: "2026-06-15 08:47 UTC"
providers_24h:
  deepseek:
    anrop: 35
    ok: 35
    rate_limits: 0
    errors: 0
    snitt_ms: 3529
  groq:
    anrop: 34
    ok: 29
    rate_limits: 5
    errors: 0
    snitt_ms: 978
  sambanova:
    anrop: 5
    ok: 5
    rate_limits: 0
    errors: 0
    snitt_ms: 1541
  codestral:
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 4321
---

# AI Provider Performance — 2026-06-15

## Hälsostatus

🟢 **93.3%** lyckade anrop senaste 24h · 75 anrop totalt
🟢 **81.3%** lyckade anrop senaste 7 dagar · 310 anrop totalt

## Groq-nyckelpool

| Nyckelpool | Antal nycklar | Kapacitet (TPD) | Kanal-nyckel |
|---|---|---|---|
| Rotationsnycklar | **9** | **1 296 000 tokens/dag** | ✅ konfigurerad |

**Groq (alla nycklar sammanlagt, 24h):** 34 anrop · 29 (85.3%) OK · 5 (14.7%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `deepseek` | 35 | 35 (100%) | 0 (0%) | 0 | 3529 ms |
| 🟢 `groq` | 34 | 29 (85.3%) | 5 (14.7%) | 0 | 978 ms |
| 🟢 `sambanova` | 5 | 5 (100%) | 0 (0%) | 0 | 1541 ms |
| 🟢 `codestral` | 1 | 1 (100%) | 0 (0%) | 0 | 4321 ms |

## Nuvarande Fallback-ordning

`sambanova → groq → mistral → deepseek → github_models → cloudflare → cerebras → gemini`

*(Benchmark senast körde: 2026-06-15 08:47 UTC)*

## 7-Dagars Trend

```
  🟢 groq             85.3% ok   (136 anrop, 20 rl, 0 err)
  🟢 deepseek         100% ok   (124 anrop, 0 rl, 0 err)
  🔴 github_models    13.6% ok   (44 anrop, 0 rl, 38 err)
  🟢 sambanova        100% ok   (5 anrop, 0 rl, 0 err)
  🟢 codestral        100% ok   (1 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har Deepseek levererat 35 anrop utan några fel eller rate‑limits och med en genomsnittlig svarstid på 3 529 ms, vilket gör den till den mest pålitliga leverantören just nu. Groq har hanterat 34 anrop men har en lägre framgångsfrekvens (85,3 %) och fem rate‑limits, även om svarstiden är betydligt snabbare (≈ 978 ms). Sambanova har presterat felfritt på sina 5 anrop med en svarstid på 1 541 ms, och Codestral har bara använts en gång utan problem men med en högre latens (4 321 ms). **Rekommendation:** Prioritera Deepseek för stabilitet, använd Groq som sekundär när hastighet är kritisk men håll ett öga på rate‑limits, och håll Sambanova som reserv‑fallback.
