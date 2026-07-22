---
date: 2026-07-22
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 503
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "sambanova", "deepseek", "github_models", "cloudflare", "groq", "cerebras", "gemini"]
config_uppdaterad: "2026-07-22 05:40 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 472
    ok: 472
    rate_limits: 0
    errors: 0
    snitt_ms: 1124
  sambanova:
    anrop: 2
    ok: 2
    rate_limits: 0
    errors: 0
    snitt_ms: 6270
  deepseek:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  github_models:
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
    anrop: 25
    ok: 25
    rate_limits: 0
    errors: 0
    snitt_ms: 2450
  cerebras:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  gemini:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-07-22

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 503 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 25 anrop · 25 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 472 | 472 (100%) | 0 (0%) | 0 | 1124 ms | 100% ok · 1000 ms |
| 🟢 `sambanova` | 2 | 2 (100%) | 0 (0%) | 0 | 6270 ms | 100% ok · 1290 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2410 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2890 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 5990 ms |
| 🟢 `groq` | 25 | 25 (100%) | 0 (0%) | 0 | 2450 ms | 100% ok · 620 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → sambanova → deepseek → github_models → cloudflare → groq → cerebras → gemini`

*(Benchmark senast körde: 2026-07-22 05:40 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (941 anrop, 0 rl, 0 err)
  🟢 sambanova        100% ok   (5 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (44 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har alla aktiva leverantörer presterat utan problem – ingen har nått någon rate‑limit och alla har rapporterat 100 % framgång. Mistral dominerade trafiken med 472 anrop och en genomsnittlig svarstid på 1 124 ms, följt av Groq (25 anrop, 2 450 ms) och Sambanova (2 anrop, 6 270 ms). De övriga leverantörerna har inte anropats och har därför inga aktuella mätvärden. **Rekommendation:** behåll Mistral som primär leverantör, använd Groq som sekundär fallback för lägre latens, och håll Sambanova som reserv för specifika hög‑kapacitets‑scenarier.
