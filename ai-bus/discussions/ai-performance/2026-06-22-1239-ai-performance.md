---
date: 2026-06-22
type: ai-performance
overall_health_24h: 95.8
overall_health_7d: 94.8
total_calls_24h: 336
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: []
config_uppdaterad: " UTC"
providers_24h:
  mistral:
    anrop: 222
    ok: 222
    rate_limits: 0
    errors: 0
    snitt_ms: 1098
  groq:
    anrop: 114
    ok: 100
    rate_limits: 14
    errors: 0
    snitt_ms: 779
---

# AI Provider Performance — 2026-06-22

## Hälsostatus

🟢 **95.8%** lyckade anrop senaste 24h · 336 anrop totalt
🟢 **94.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 114 anrop · 100 (87.7%) OK · 14 (12.3%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `mistral` | 222 | 222 (100%) | 0 (0%) | 0 | 1098 ms |
| 🟢 `groq` | 114 | 100 (87.7%) | 14 (12.3%) | 0 | 779 ms |

## Nuvarande Fallback-ordning

``

*(Benchmark senast körde:  UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (663 anrop, 0 rl, 0 err)
  🟡 groq             77.3% ok   (181 anrop, 37 rl, 4 err)
  🟢 deepseek         100% ok   (88 anrop, 0 rl, 0 err)
  🟢 sambanova        83.6% ok   (67 anrop, 11 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har Mistral levererat 222 anrop utan några fel eller rate‑limits och håller en genomsnittlig svarstid på 1098 ms, vilket ger en 100 % driftsäkerhet. Groq har däremot hanterat 114 anrop med 87,7 % lyckade svar, men har drabbats av 14 rate‑limits och en kortare svarstid på 779 ms. Hälsopoängen för hela systemet ligger på 95,8 % (24 h) och 94,8 % (7 d), utan några leverantörer som överskrider 30 % fel‑ eller under‑50 % godkännandetröskeln. **Rekommendation:** Prioritera Mistral för nya arbetsbelastningar och minska Groq‑trafiken tills kvot‑ och rate‑limit‑situationen stabiliseras.
