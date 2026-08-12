---
date: 2026-08-12
type: ai-performance
overall_health_24h: 100
overall_health_7d: 98.4
total_calls_24h: 648
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "sambanova", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-12 04:32 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 612
    ok: 612
    rate_limits: 0
    errors: 0
    snitt_ms: 1168
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
    anrop: 29
    ok: 29
    rate_limits: 0
    errors: 0
    snitt_ms: 2207
  sambanova:
    anrop: 2
    ok: 2
    rate_limits: 0
    errors: 0
    snitt_ms: 4030
  cerebras:
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
  gemini:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-08-12

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 648 anrop totalt
🟢 **98.4%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 29 anrop · 29 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 612 | 612 (100%) | 0 (0%) | 0 | 1168 ms | 100% ok · 1200 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2530 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3560 ms |
| 🟢 `groq` | 29 | 29 (100%) | 0 (0%) | 0 | 2207 ms | 100% ok · 650 ms |
| 🟢 `sambanova` | 2 | 2 (100%) | 0 (0%) | 0 | 4030 ms | 100% ok · 1350 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → sambanova → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-12 04:32 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (922 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (51 anrop, 0 rl, 0 err)
  🔴 sambanova        15.8% ok   (19 anrop, 16 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen hanterat 648 anrop utan några rate‑limits eller fel. Mistral dominerade med 612 anrop (100 % lyckade) och en genomsnittlig svarstid på 1,17 s, medan Groq levererade 29 anrop med 2,21 s och Sambanova bara 2 anrop men med 4,03 s. Inga andra leverantörer har använts och inga problemleverantörer har identifierats (>30 % fel eller <50 % lyckade). **Rekommendation:** fortsätt prioritera Mistral som primär provider, behåll Groq som sekundär fallback och utnyttja Sambanova endast vid specifika behov där högre latency är acceptabelt.
