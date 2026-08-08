---
date: 2026-08-08
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 663
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "sambanova", "deepseek", "cloudflare", "groq", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-08 04:02 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 628
    ok: 628
    rate_limits: 0
    errors: 0
    snitt_ms: 1123
  sambanova:
    anrop: 3
    ok: 3
    rate_limits: 0
    errors: 0
    snitt_ms: 3530
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
    snitt_ms: 2067
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

# AI Provider Performance — 2026-08-08

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 663 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 29 anrop · 29 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 628 | 628 (100%) | 0 (0%) | 0 | 1123 ms | 100% ok · 1080 ms |
| 🟢 `sambanova` | 3 | 3 (100%) | 0 (0%) | 0 | 3530 ms | 100% ok · 1120 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3040 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3760 ms |
| 🟢 `groq` | 29 | 29 (100%) | 0 (0%) | 0 | 2067 ms | 100% ok · 650 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → sambanova → deepseek → cloudflare → groq → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-08 04:02 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (949 anrop, 0 rl, 0 err)
  🟢 sambanova        100% ok   (5 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (40 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har Mistral varit den tydligaste vinnaren med 628 anrop, 100 % framgång och en genomsnittlig svarstid på 1 123 ms. Sambanova har bara 3 anrop men en högre latens på 3 530 ms, medan Groq har hanterat 29 anrop med 2 067 ms utan några rate‑limits. Inga andra leverantörer har använts och ingen har nått kritiska gränsvärden (>30 % rate‑limit eller <50 % lyckade anrop). **Rekommendation:** fortsätt prioritera Mistral som primär provider, utöka Groq‑kapaciteten (t.ex. fler nycklar) för att avlasta eventuella framtida toppar, och håll Sambanova som sekundär fallback för specifika fall med lägre belastning.
