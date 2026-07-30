---
date: 2026-07-30
type: ai-performance
overall_health_24h: 96.7
overall_health_7d: 97.9
total_calls_24h: 584
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["mistral", "deepseek", "github_models", "cloudflare", "groq", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-07-30 05:31 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 515
    ok: 515
    rate_limits: 0
    errors: 0
    snitt_ms: 1053
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
    anrop: 27
    ok: 27
    rate_limits: 0
    errors: 0
    snitt_ms: 2158
  sambanova:
    anrop: 34
    ok: 15
    rate_limits: 19
    errors: 0
    snitt_ms: 5736
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

# AI Provider Performance — 2026-07-30

## Hälsostatus

🟢 **96.7%** lyckade anrop senaste 24h · 584 anrop totalt
🟢 **97.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 27 anrop · 27 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 515 | 515 (100%) | 0 (0%) | 0 | 1053 ms | 100% ok · 1150 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2530 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3100 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4930 ms |
| 🟢 `groq` | 27 | 27 (100%) | 0 (0%) | 0 | 2158 ms | 100% ok · 620 ms |
| 🔴 `sambanova` | 34 | 15 (44.1%) | 19 (55.9%) | 0 | 5736 ms | 0% ok · 0 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → cloudflare → groq → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-07-30 05:31 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (901 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (46 anrop, 0 rl, 0 err)
  🟡 sambanova        51.2% ok   (43 anrop, 21 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 15/34 ok (44.1%), 19 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har plattformen hanterat 584 anrop med en hälsopoäng på 96,7 % (7‑dagars genomsnitt 97,9 %). Mistral levererade 515 anrop utan några rate‑limits och med en genomsnittlig svarstid på 1 053 ms, medan Groq klarade 27 anrop på 2 158 ms utan begränsningar. Sambanova var den enda leverantören med problem – endast 44 % av 34 anrop lyckades och 19 av dem träffade rate‑limit med en medellatens på 5 736 ms. **Rekommendation:** prioritera Mistral (första valet) och Groq som sekundär; avlägsna eller minska beroendet av Sambanova tills dess kvot‑ och prestandaproblem är lösta, och håll fallback‑ordningen på mistral → groq → deepseek → … .
