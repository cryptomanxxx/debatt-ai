---
date: 2026-08-13
type: ai-performance
overall_health_24h: 99.7
overall_health_7d: 99.8
total_calls_24h: 661
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "sambanova", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-13 04:44 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 597
    ok: 597
    rate_limits: 0
    errors: 0
    snitt_ms: 1107
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
    anrop: 47
    ok: 47
    rate_limits: 0
    errors: 0
    snitt_ms: 1233
  sambanova:
    anrop: 6
    ok: 4
    rate_limits: 2
    errors: 0
    snitt_ms: 1773
  cerebras:
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 347
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

# AI Provider Performance — 2026-08-13

## Hälsostatus

🟢 **99.7%** lyckade anrop senaste 24h · 661 anrop totalt
🟢 **99.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 47 anrop · 47 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 597 | 597 (100%) | 0 (0%) | 0 | 1107 ms | 100% ok · 1040 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2550 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3350 ms |
| 🟢 `groq` | 47 | 47 (100%) | 0 (0%) | 0 | 1233 ms | 100% ok · 650 ms |
| 🟡 `sambanova` | 6 | 4 (66.7%) | 2 (33.3%) | 0 | 1773 ms | 0% ok · 0 ms |
| 🟢 `cerebras` | 1 | 1 (100%) | 0 (0%) | 0 | 347 ms | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → sambanova → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-13 04:44 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (910 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (69 anrop, 0 rl, 0 err)
  🟡 sambanova        71.4% ok   (7 anrop, 2 rl, 0 err)
  🟢 cerebras         100% ok   (1 anrop, 0 rl, 0 err)
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 4/6 ok (66.7%), 2 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har debatt‑ai.se haft en hälsopoäng på 99,7 % och totalt 661 anrop. Mistral dominerade med 597 anrop, 100 % framgång och en medel‑latency på 1 107 ms, medan Groq levererade 47 anrop utan rate‑limits och en något högre latency på 1 233 ms. Sambanova visade problem: endast 6 anrop, 66,7 % framgång och två rate‑limits samt den längsta svarstiden på 1 773 ms. 

**Rekommendation (prioriterad):** Använd först Mistral för alla nya förfrågningar, följt av Groq som backup; undvik Sambanova tills dess rate‑limit‑ och stabilitetsproblem är lösta.
