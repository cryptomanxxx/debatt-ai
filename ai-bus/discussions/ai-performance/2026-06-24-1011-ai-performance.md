---
date: 2026-06-24
type: ai-performance
overall_health_24h: 100
overall_health_7d: 95.4
total_calls_24h: 508
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["groq", "mistral", "sambanova", "deepseek", "github_models", "cloudflare", "cerebras", "gemini"]
config_uppdaterad: "2026-06-24 06:36 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 455
    ok: 455
    rate_limits: 0
    errors: 0
    snitt_ms: 1169
  groq:
    anrop: 53
    ok: 53
    rate_limits: 0
    errors: 0
    snitt_ms: 906
---

# AI Provider Performance — 2026-06-24

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 508 anrop totalt
🟢 **95.4%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 53 anrop · 53 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `mistral` | 455 | 455 (100%) | 0 (0%) | 0 | 1169 ms |
| 🟢 `groq` | 53 | 53 (100%) | 0 (0%) | 0 | 906 ms |

## Nuvarande Fallback-ordning

`groq → mistral → sambanova → deepseek → github_models → cloudflare → cerebras → gemini`

*(Benchmark senast körde: 2026-06-24 06:36 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (674 anrop, 0 rl, 0 err)
  🟢 groq             88.5% ok   (261 anrop, 30 rl, 0 err)
  🟡 sambanova        74.6% ok   (63 anrop, 16 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timarna har Mistral levererat 455 anrop utan några rate‑limits och med en genomsnittlig svarstid på 1 169 ms, vilket ger 100 % framgång. Groq har hanterat 53 anrop med samma 100 % framgång och en något bättre svarstid på 906 ms, men den totala kvoten på ~144 k per konto innebär att ytterligare nycklar inte ger en linjär kapacitetsökning. Inga andra leverantörer har nått kritiska trösklar (>30 % fel eller <50 % OK), så fallback‑kedjan har inte behövt aktiveras. **Rekommendation:** behåll Mistral som primär provider, håll Groq som sekundär fallback och övervaka TPD‑kvoten noggrant; vid behov kan extra Groq‑nycklar läggas till för att säkra marginalen utan att förvänta sig proportionell kapacitetstillväxt.
