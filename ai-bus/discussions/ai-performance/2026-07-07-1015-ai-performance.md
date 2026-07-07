---
date: 2026-07-07
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 800
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "sambanova", "deepseek", "github_models", "cloudflare", "groq", "cerebras", "gemini"]
config_uppdaterad: "2026-07-07 06:36 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 765
    ok: 765
    rate_limits: 0
    errors: 0
    snitt_ms: 1117
  sambanova:
    anrop: 5
    ok: 5
    rate_limits: 0
    errors: 0
    snitt_ms: 4303
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
    anrop: 22
    ok: 22
    rate_limits: 0
    errors: 0
    snitt_ms: 2453
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

# AI Provider Performance — 2026-07-07

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 800 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 22 anrop · 22 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 765 | 765 (100%) | 0 (0%) | 0 | 1117 ms | 100% ok · 1230 ms |
| 🟢 `sambanova` | 5 | 5 (100%) | 0 (0%) | 0 | 4303 ms | 100% ok · 1900 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2760 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3130 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 5660 ms |
| 🟢 `groq` | 22 | 22 (100%) | 0 (0%) | 0 | 2453 ms | 100% ok · 640 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → sambanova → deepseek → github_models → cloudflare → groq → cerebras → gemini`

*(Benchmark senast körde: 2026-07-07 06:36 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (960 anrop, 0 rl, 0 err)
  🟢 sambanova        100% ok   (5 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (27 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har **Mistral** dominerat med 765 anrop och en genomsnittlig svarstid på 1 117 ms utan några rate‑limits. **Sambanova** har bara 5 anrop men är betydligt långsammare (4 303 ms), medan **Groq** levererar 22 anrop med en medel‑latens på 2 453 ms – också utan throttling. Inga andra leverantörer har använts, så deras benchmark‑status är ok men obeprövad i produktion. 

**Rekommendation (prioriterad):** behåll Mistral som primär leverantör, håll Groq som sekundär fallback och utvärdera aktivt Deepseek (och eventuellt Sambanova) för att minska svarstiderna vid hög belastning.
