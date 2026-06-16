---
date: 2026-06-16
type: ai-performance
overall_health_24h: 94.6
overall_health_7d: 83.7
total_calls_24h: 74
total_calls_7d: 380
groq_nyckelpool: 9 (1 296 000 tokens/dag poolat) + kanal-nyckel
problem_providers: []
ranked_order: ["groq", "mistral", "deepseek", "github_models", "cloudflare", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-06-16 08:38 UTC"
providers_24h:
  sambanova:
    anrop: 34
    ok: 34
    rate_limits: 0
    errors: 0
    snitt_ms: 2059
  groq:
    anrop: 25
    ok: 21
    rate_limits: 2
    errors: 2
    snitt_ms: 989
  deepseek:
    anrop: 13
    ok: 13
    rate_limits: 0
    errors: 0
    snitt_ms: 3612
  codestral:
    anrop: 2
    ok: 2
    rate_limits: 0
    errors: 0
    snitt_ms: 1215
---

# AI Provider Performance — 2026-06-16

## Hälsostatus

🟢 **94.6%** lyckade anrop senaste 24h · 74 anrop totalt
🟢 **83.7%** lyckade anrop senaste 7 dagar · 380 anrop totalt

## Groq-nyckelpool

| Nyckelpool | Antal nycklar | Kapacitet (TPD) | Kanal-nyckel |
|---|---|---|---|
| Rotationsnycklar | **9** | **1 296 000 tokens/dag** | ✅ konfigurerad |

**Groq (alla nycklar sammanlagt, 24h):** 25 anrop · 21 (84%) OK · 2 (8%) rate-limits · 2 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `sambanova` | 34 | 34 (100%) | 0 (0%) | 0 | 2059 ms |
| 🟢 `groq` | 25 | 21 (84%) | 2 (8%) | 2 | 989 ms |
| 🟢 `deepseek` | 13 | 13 (100%) | 0 (0%) | 0 | 3612 ms |
| 🟢 `codestral` | 2 | 2 (100%) | 0 (0%) | 0 | 1215 ms |

## Nuvarande Fallback-ordning

`groq → mistral → deepseek → github_models → cloudflare → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-06-16 08:38 UTC)*

## 7-Dagars Trend

```
  🟢 groq             85.1% ok   (161 anrop, 22 rl, 2 err)
  🟢 deepseek         100% ok   (137 anrop, 0 rl, 0 err)
  🔴 github_models    13.6% ok   (44 anrop, 0 rl, 38 err)
  🟢 sambanova        100% ok   (35 anrop, 0 rl, 0 err)
  🟢 codestral        100% ok   (3 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har vi hanterat 74 anrop med en hälsopoäng på 94,6 % (7‑dags‑genomsnitt 83,7 %). Sambanova levererade 34 anrop utan några fel eller rate‑limits och hade en medel‑latens på 2059 ms, vilket gör den till den mest pålitliga leverantören. Groq utförde 25 anrop men nådde bara 84 % framgång och drabbades av två rate‑limits, även om latensen låg på 989 ms; Deepseek och Codestral var felfria men hade högre svarstider (3612 ms respektive 1215 ms). **Rekommendation:** Prioritera Sambanova för alla kritiska arbetsflöden, håll Groq som sekundär men övervaka och justera nyckelpoolen för att undvika rate‑limits, och använd Deepseek eller Codestral endast för uppgifter
