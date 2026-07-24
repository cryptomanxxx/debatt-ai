---
date: 2026-07-24
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 650
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "sambanova", "deepseek", "github_models", "cloudflare", "groq", "cerebras", "gemini"]
config_uppdaterad: "2026-07-24 05:41 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 616
    ok: 616
    rate_limits: 0
    errors: 0
    snitt_ms: 1057
  sambanova:
    anrop: 3
    ok: 3
    rate_limits: 0
    errors: 0
    snitt_ms: 3320
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
    anrop: 26
    ok: 26
    rate_limits: 0
    errors: 0
    snitt_ms: 2298
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

# AI Provider Performance — 2026-07-24

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 650 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 26 anrop · 26 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 616 | 616 (100%) | 0 (0%) | 0 | 1057 ms | 100% ok · 1130 ms |
| 🟢 `sambanova` | 3 | 3 (100%) | 0 (0%) | 0 | 3320 ms | 100% ok · 1500 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2570 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3140 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4220 ms |
| 🟢 `groq` | 26 | 26 (100%) | 0 (0%) | 0 | 2298 ms | 100% ok · 610 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → sambanova → deepseek → github_models → cloudflare → groq → cerebras → gemini`

*(Benchmark senast körde: 2026-07-24 05:41 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (942 anrop, 0 rl, 0 err)
  🟢 sambanova        100% ok   (4 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (46 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen hanterat 650 anrop utan några rate‑limits eller fel, vilket ger en hälsopoäng på 100 % både för 24 h och 7 dagar. Mistral dominerade med 616 anrop och en genomsnittlig svarstid på 1 057 ms, medan Sambanova och Groq bidrog med 3 respektive 26 anrop med svarstider på 3 320 ms och 2 298 ms. Inga andra leverantörer har använts, men deras benchmark‑status visar 100 % OK för DeepSeek, GitHub‑models och Cloudflare, medan Cerebras och Gemini ännu inte har bevisat funktionalitet. **Rekommendation:** behåll Mistral som primär leverantör, placera Groq som sekundär fallback (efter Sambanova) och fortsätt att övervaka Sambanova‑latensen för eventuella optimeringar.
