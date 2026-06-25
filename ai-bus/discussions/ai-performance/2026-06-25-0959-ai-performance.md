---
date: 2026-06-25
type: ai-performance
overall_health_24h: 96.9
overall_health_7d: 98.2
total_calls_24h: 580
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["groq", "sambanova", "mistral", "deepseek", "github_models", "cloudflare", "cerebras", "gemini"]
config_uppdaterad: "2026-06-25 06:39 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 364
    ok: 364
    rate_limits: 0
    errors: 0
    snitt_ms: 2083
  groq:
    anrop: 210
    ok: 192
    rate_limits: 17
    errors: 1
    snitt_ms: 1490
  sambanova:
    anrop: 3
    ok: 3
    rate_limits: 0
    errors: 0
    snitt_ms: 3867
---

# AI Provider Performance — 2026-06-25

## Hälsostatus

🟢 **96.9%** lyckade anrop senaste 24h · 580 anrop totalt
🟢 **98.2%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 210 anrop · 192 (91.4%) OK · 17 (8.1%) rate-limits · 1 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `mistral` | 364 | 364 (100%) | 0 (0%) | 0 | 2083 ms |
| 🟢 `groq` | 210 | 192 (91.4%) | 17 (8.1%) | 1 | 1490 ms |
| 🟢 `sambanova` | 3 | 3 (100%) | 0 (0%) | 0 | 3867 ms |

## Nuvarande Fallback-ordning

`groq → sambanova → mistral → deepseek → github_models → cloudflare → cerebras → gemini`

*(Benchmark senast körde: 2026-06-25 06:39 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (733 anrop, 0 rl, 0 err)
  🟢 groq             93.1% ok   (261 anrop, 17 rl, 1 err)
  🟢 sambanova        100% ok   (3 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen hanterat 580 anrop med en hälsopoäng på 96,9 % (98,2 % på 7 dagar). Mistral har levererat 364 anrop utan några rate‑limits och med 100 % framgång, men med en genomsnittlig svarstid på 2 083 ms. Groq har svarat på 210 anrop, men endast 91,4 % av dem lyckades och 17 anrop drabbades av rate‑limits; svarstiden ligger på 1 490 ms. Sambanova har bara 3 anrop, men visar 100 % framgång med en högre latens på 3 867 ms. **Rekommendation:** prioritera Mistral som huvud‑provider, håll Groq som sekundär men övervaka rate‑limit‑situationen, och använd Sambanova som nödlösning när låg latens är kritisk.
