---
date: 2026-07-19
type: ai-performance
overall_health_24h: 99.4
overall_health_7d: 98.1
total_calls_24h: 533
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["mistral", "deepseek", "github_models", "cloudflare", "groq", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-07-19 05:42 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 499
    ok: 499
    rate_limits: 0
    errors: 0
    snitt_ms: 1068
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
    anrop: 21
    ok: 21
    rate_limits: 0
    errors: 0
    snitt_ms: 2589
  sambanova:
    anrop: 5
    ok: 2
    rate_limits: 3
    errors: 0
    snitt_ms: 2682
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

# AI Provider Performance — 2026-07-19

## Hälsostatus

🟢 **99.4%** lyckade anrop senaste 24h · 533 anrop totalt
🟢 **98.1%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 21 anrop · 21 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 499 | 499 (100%) | 0 (0%) | 0 | 1068 ms | 100% ok · 1350 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2540 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3290 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3720 ms |
| 🟢 `groq` | 21 | 21 (100%) | 0 (0%) | 0 | 2589 ms | 100% ok · 580 ms |
| 🔴 `sambanova` | 5 | 2 (40%) | 3 (60%) | 0 | 2682 ms | 100% ok · 1030 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → cloudflare → groq → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-07-19 05:42 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (912 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (45 anrop, 0 rl, 0 err)
  🔴 sambanova        40.6% ok   (32 anrop, 17 rl, 2 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 2/5 ok (40%), 3 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har plattformen hanterat 533 anrop med en hälsopoäng på 99,4 % (7‑dagars genomsnitt 98,1 %). Mistral har presterat bäst med 499 anrop, 100 % lyckade svar och en medianlatens på 1 068 ms, medan Groq levererade 21 anrop utan rate‑limits men med längre svarstid (2 589 ms). Sambanova är den enda kritiska leverantören – endast 40 % av 5 anrop lyckades och 3 av dem drabbades av rate‑limits (latens 2 682 ms). **Rekommendation:** prioritera Mistral som primär provider, behåll Groq som sekundär backup och avaktivera Sambanova tills dess rate‑limit‑kvot kan justeras eller ersättas av en mer pålitlig leverantör.
