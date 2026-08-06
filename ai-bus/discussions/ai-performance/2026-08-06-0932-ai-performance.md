---
date: 2026-08-06
type: ai-performance
overall_health_24h: 100
overall_health_7d: 98.6
total_calls_24h: 528
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "sambanova", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-06 05:39 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 495
    ok: 495
    rate_limits: 0
    errors: 0
    snitt_ms: 1150
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
    anrop: 28
    ok: 28
    rate_limits: 0
    errors: 0
    snitt_ms: 2041
  sambanova:
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 3329
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

# AI Provider Performance — 2026-08-06

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 528 anrop totalt
🟢 **98.6%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 28 anrop · 28 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 495 | 495 (100%) | 0 (0%) | 0 | 1150 ms | 100% ok · 1200 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2980 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3190 ms |
| 🟢 `groq` | 28 | 28 (100%) | 0 (0%) | 0 | 2041 ms | 100% ok · 600 ms |
| 🟢 `sambanova` | 1 | 1 (100%) | 0 (0%) | 0 | 3329 ms | 100% ok · 1950 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → sambanova → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-06 05:39 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (929 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (47 anrop, 0 rl, 0 err)
  🔴 sambanova        12.5% ok   (16 anrop, 14 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har vår plattform hanterat 528 anrop med en hälsopoäng på 100 % (7‑dagars medel 98,6 %). Mistral dominerade med 495 anrop och en genomsnittlig svarstid på 1 150 ms utan några rate‑limits, medan Groq levererade 28 anrop på 2 041 ms och Sambanova 1 anrop på 3 329 ms – alla utan fel. Inga leverantörer har överskridit 30 % rate‑limit eller fallit under 50 % godkända svar, och de övriga (Deepseek, Cloudflare, Cerebras, GitHub‑models, Gemini) har ännu inte använts i produktion. **Rekommendation:** behåll Mistral som primär leverantör, utöka gradvis Groq‑kapaciteten som sekundär fallback och planera en pilot med Deepseek för att diversifiera riskerna.
