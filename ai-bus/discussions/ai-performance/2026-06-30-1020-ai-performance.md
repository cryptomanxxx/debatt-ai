---
date: 2026-06-30
type: ai-performance
overall_health_24h: 100
overall_health_7d: 98
total_calls_24h: 625
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "sambanova", "github_models", "cloudflare", "deepseek", "groq", "cerebras", "gemini"]
config_uppdaterad: "2026-06-30 06:45 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 595
    ok: 595
    rate_limits: 0
    errors: 0
    snitt_ms: 1449
  groq:
    anrop: 30
    ok: 30
    rate_limits: 0
    errors: 0
    snitt_ms: 1977
---

# AI Provider Performance — 2026-06-30

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 625 anrop totalt
🟢 **98%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 30 anrop · 30 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `mistral` | 595 | 595 (100%) | 0 (0%) | 0 | 1449 ms |
| 🟢 `groq` | 30 | 30 (100%) | 0 (0%) | 0 | 1977 ms |

## Nuvarande Fallback-ordning

`mistral → sambanova → github_models → cloudflare → deepseek → groq → cerebras → gemini`

*(Benchmark senast körde: 2026-06-30 06:45 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (874 anrop, 0 rl, 0 err)
  🟢 groq             86.6% ok   (119 anrop, 16 rl, 0 err)
  🟡 cerebras         60% ok   (5 anrop, 2 rl, 0 err)
  🔴 gemini           0% ok   (2 anrop, 2 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har AI‑plattformen hanterat 625 anrop utan några fel eller rate‑limits. Mistral stod för 595 anrop med 100 % framgång och en medel‑latens på 1 449 ms, vilket gör den till den mest pålitliga leverantören. Groq levererade 30 anrop, också utan fel, men med en högre medellatens på 1 977 ms och en begränsad kvot på ~144 k per konto. Eftersom inga leverantörer visar problematiska fel‑ eller begränsningsnivåer rekommenderas att fortsätta prioritera Mistral som huvudprovider och, om efterfrågan ökar, utöka Groq‑kapaciteten eller lägga till en sekundär fallback (t.ex. Sambanova) för att minska latency‑risker.
