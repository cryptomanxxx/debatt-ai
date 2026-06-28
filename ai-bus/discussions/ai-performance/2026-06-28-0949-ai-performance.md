---
date: 2026-06-28
type: ai-performance
overall_health_24h: 97.1
overall_health_7d: 96.5
total_calls_24h: 596
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["groq", "mistral", "sambanova", "deepseek", "github_models", "cloudflare", "cerebras", "gemini"]
config_uppdaterad: "2026-06-28 06:51 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 381
    ok: 381
    rate_limits: 0
    errors: 0
    snitt_ms: 1194
  groq:
    anrop: 215
    ok: 198
    rate_limits: 17
    errors: 0
    snitt_ms: 881
---

# AI Provider Performance — 2026-06-28

## Hälsostatus

🟢 **97.1%** lyckade anrop senaste 24h · 596 anrop totalt
🟢 **96.5%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 215 anrop · 198 (92.1%) OK · 17 (7.9%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `mistral` | 381 | 381 (100%) | 0 (0%) | 0 | 1194 ms |
| 🟢 `groq` | 215 | 198 (92.1%) | 17 (7.9%) | 0 | 881 ms |

## Nuvarande Fallback-ordning

`groq → mistral → sambanova → deepseek → github_models → cloudflare → cerebras → gemini`

*(Benchmark senast körde: 2026-06-28 06:51 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (686 anrop, 0 rl, 0 err)
  🟢 groq             94.1% ok   (289 anrop, 17 rl, 0 err)
  🔴 sambanova        25% ok   (24 anrop, 18 rl, 0 err)
  🟢 cerebras         100% ok   (1 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen hanterat 596 anrop med en hälsopoäng på 97,1 % (96,5 % över 7 dagar). Mistral har varit den mest pålitliga leverantören med 381 anrop, 100 % framgång och ingen rate‑limit, men svarstiden är relativt hög (≈ 1,2 s). Groq har hanterat 215 anrop med 92,1 % lyckade svar; dock uppstod 17 rate‑limits och den genomsnittliga svarstiden ligger på 881 ms. 

**Rekommendation:** Prioritera Mistral som huvud‑provider och använd Groq som sekundär fallback – men håll ett öga på Groqs kvotutnyttjande för att undvika ytterligare rate‑limits.
