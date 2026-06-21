---
date: 2026-06-21
type: ai-performance
overall_health_24h: 94.8
overall_health_7d: 94.3
total_calls_24h: 593
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["groq", "mistral", "deepseek", "cloudflare", "github_models", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-06-21 07:23 UTC"
providers_24h:
  mistral:
    anrop: 419
    ok: 419
    rate_limits: 0
    errors: 0
    snitt_ms: 871
  groq:
    anrop: 113
    ok: 97
    rate_limits: 16
    errors: 0
    snitt_ms: 751
  sambanova:
    anrop: 61
    ok: 46
    rate_limits: 15
    errors: 0
    snitt_ms: 2448
---

# AI Provider Performance — 2026-06-21

## Hälsostatus

🟢 **94.8%** lyckade anrop senaste 24h · 593 anrop totalt
🟢 **94.3%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 113 anrop · 97 (85.8%) OK · 16 (14.2%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `mistral` | 419 | 419 (100%) | 0 (0%) | 0 | 871 ms |
| 🟢 `groq` | 113 | 97 (85.8%) | 16 (14.2%) | 0 | 751 ms |
| 🟡 `sambanova` | 61 | 46 (75.4%) | 15 (24.6%) | 0 | 2448 ms |

## Nuvarande Fallback-ordning

`groq → mistral → deepseek → cloudflare → github_models → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-06-21 07:23 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (594 anrop, 0 rl, 0 err)
  🟡 groq             77.5% ok   (204 anrop, 42 rl, 4 err)
  🟢 deepseek         100% ok   (128 anrop, 0 rl, 0 err)
  🟢 sambanova        84.3% ok   (70 anrop, 11 rl, 0 err)
  🟢 codestral        100% ok   (3 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen hanterat 593 anrop med en hälsopoäng på 94,8 % (7‑dagsgenomsnitt 94,3 %). Mistral har levererat 419 anrop utan några rate‑limits och med en genomsnittlig svarstid på 871 ms, vilket gör den till den mest pålitliga leverantören. Groq har presterat bra men har en lägre framgångsgrad (85,8 %) och 16 rate‑limits, medan Sambanova visar både högre latens (2 448 ms) och en success‑rate på endast 75,4 % med 15 rate‑limits. **Rekommendation:** prioritera Mistral som primär provider, håll Groq som sekundär fallback och begränsa Sambanova‑användning tills dess latency och kvot‑restriktioner förbättras.
