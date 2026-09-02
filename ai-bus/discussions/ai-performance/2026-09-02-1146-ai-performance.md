---
date: 2026-09-02
type: ai-performance
overall_health_24h: 100
overall_health_7d: 98.3
total_calls_24h: 710
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-09-02 07:22 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 651
    ok: 651
    rate_limits: 0
    errors: 0
    snitt_ms: 3095
  deepseek:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 37
    ok: 37
    rate_limits: 0
    errors: 0
    snitt_ms: 2043
  gemini:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-09-02

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 710 anrop totalt
🟢 **98.3%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 37 anrop · 37 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 651 | 651 (100%) | 0 (0%) | 0 | 3095 ms | 100% ok · 1320 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2480 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3890 ms |
| 🟢 `groq` | 37 | 37 (100%) | 0 (0%) | 0 | 2043 ms | 100% ok · 600 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 100% ok · 890 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-09-02 07:22 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          99.9% ok   (826 anrop, 0 rl, 1 err)
  🟢 deepseek         100% ok   (1 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             92.1% ok   (127 anrop, 10 rl, 0 err)
  🟡 gemini           61.5% ok   (13 anrop, 5 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**AI-providerprestanda senaste 24h:**
Mistral och Groq presterade perfekt med 100% lyckade anrop och inga begränsningar, medan DeepSeek, Cloudflare och Gemini inte användes. Groq hade 37 anrop (2043 ms genomsnitt) och mistral 651 (3095 ms). Inga provider hade över 30% misslyckanden. **Prioritera Mistral för stabilitet och hastighet, Groq för låg latens, och överväg DeepSeek för högre kapacitet om behov uppstår.**
