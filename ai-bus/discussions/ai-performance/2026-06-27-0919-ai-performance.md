---
date: 2026-06-27
type: ai-performance
overall_health_24h: 95.7
overall_health_7d: 94.7
total_calls_24h: 506
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["groq", "mistral", "deepseek", "github_models", "cloudflare", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-06-27 06:21 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 419
    ok: 419
    rate_limits: 0
    errors: 0
    snitt_ms: 1186
  groq:
    anrop: 57
    ok: 57
    rate_limits: 0
    errors: 0
    snitt_ms: 705
  sambanova:
    anrop: 29
    ok: 7
    rate_limits: 22
    errors: 0
    snitt_ms: 7506
  cerebras:
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 438
---

# AI Provider Performance — 2026-06-27

## Hälsostatus

🟢 **95.7%** lyckade anrop senaste 24h · 506 anrop totalt
🟢 **94.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 57 anrop · 57 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `mistral` | 419 | 419 (100%) | 0 (0%) | 0 | 1186 ms |
| 🟢 `groq` | 57 | 57 (100%) | 0 (0%) | 0 | 705 ms |
| 🔴 `sambanova` | 29 | 7 (24.1%) | 22 (75.9%) | 0 | 7506 ms |
| 🟢 `cerebras` | 1 | 1 (100%) | 0 (0%) | 0 | 438 ms |

## Nuvarande Fallback-ordning

`groq → mistral → deepseek → github_models → cloudflare → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-06-27 06:21 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (632 anrop, 0 rl, 0 err)
  🟢 deepseek         100% ok   (155 anrop, 0 rl, 0 err)
  🟢 groq             88.5% ok   (130 anrop, 15 rl, 0 err)
  🟡 sambanova        53.7% ok   (82 anrop, 38 rl, 0 err)
  🟢 cerebras         100% ok   (1 anrop, 0 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 7/29 ok (24.1%), 22 rate-limits, 0 errors

## Analys

Hälsopoängen för de senaste 24 timmarna ligger på 95,7 % (7‑dagsgenomsnitt 94,7 %) med totalt 506 anrop. Mistral (419 anrop) och Groq (57 anrop) levererar 100 % framgång med svarstider på 1,19 s respektive 0,71 s, medan Sambanova har allvarliga problem – endast 24 % lyckade anrop, 22 rate‑limits och en genomsnittlig svarstid på 7,5 s. Fallback‑kedjan följer fortfarande groq → mistral → deepseek → github_models → cloudflare → sambanova → cerebras → gemini, men de 9 konfigurerade Groq‑nycklarna (plus en kanal‑nyckel)
