---
date: 2026-06-26
type: ai-performance
overall_health_24h: 94.2
overall_health_7d: 94.8
total_calls_24h: 603
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["sambanova", "mistral", "groq", "deepseek", "github_models", "cloudflare", "cerebras", "gemini"]
config_uppdaterad: "2026-06-26 06:43 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 245
    ok: 244
    rate_limits: 1
    errors: 0
    snitt_ms: 2552
  deepseek:
    anrop: 174
    ok: 174
    rate_limits: 0
    errors: 0
    snitt_ms: 2459
  groq:
    anrop: 100
    ok: 83
    rate_limits: 17
    errors: 0
    snitt_ms: 881
  sambanova:
    anrop: 84
    ok: 67
    rate_limits: 17
    errors: 0
    snitt_ms: 3125
---

# AI Provider Performance — 2026-06-26

## Hälsostatus

🟢 **94.2%** lyckade anrop senaste 24h · 603 anrop totalt
🟢 **94.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 100 anrop · 83 (83%) OK · 17 (17%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `mistral` | 245 | 244 (99.6%) | 1 (0.4%) | 0 | 2552 ms |
| 🟢 `deepseek` | 174 | 174 (100%) | 0 (0%) | 0 | 2459 ms |
| 🟢 `groq` | 100 | 83 (83%) | 17 (17%) | 0 | 881 ms |
| 🟡 `sambanova` | 84 | 67 (79.8%) | 17 (20.2%) | 0 | 3125 ms |

## Nuvarande Fallback-ordning

`sambanova → mistral → groq → deepseek → github_models → cloudflare → cerebras → gemini`

*(Benchmark senast körde: 2026-06-26 06:43 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          99.8% ok   (526 anrop, 1 rl, 0 err)
  🟢 groq             83.8% ok   (210 anrop, 33 rl, 1 err)
  🟢 deepseek         100% ok   (174 anrop, 0 rl, 0 err)
  🟢 sambanova        80.5% ok   (87 anrop, 17 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har Mistral levererat flest anrop (245) med en exceptionell 99,6 % lyckade svar och endast en rate‑limit‑händelse, men med en genomsnittlig svarstid på 2 552 ms. DeepSeek har också presterat stabilt – 174 anrop, 100 % utan rate‑limits och en svarstid på 2 459 ms. Groq, trots sin kortare latens (881 ms), har bara 83 % lyckade anrop och 17 rate‑limits, vilket sannolikt beror på den gemensamma TPD‑kvoten på ~144 k per konto. Sambanova visar den lägsta tillförlitligheten (79,8 % ok) och högsta latensen (3 125 ms) med 17 rate‑limits.

**Rekommendation (prioriterad):** Använd Mistral som primär leverantör för kvalitet och stabilitet, håll DeepSeek som reserv för hög tillgänglighet, och begränsa Groq‑anrop till låg‑latens‑scenarier så länge kvoten är tillräcklig. Undvik Sambanova tills dess rate‑limit‑kapacitet förbättras.
