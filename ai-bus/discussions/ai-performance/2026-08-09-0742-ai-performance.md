---
date: 2026-08-09
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 669
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "sambanova", "deepseek", "cloudflare", "groq", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-09 04:09 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 632
    ok: 632
    rate_limits: 0
    errors: 0
    snitt_ms: 1043
  sambanova:
    anrop: 3
    ok: 3
    rate_limits: 0
    errors: 0
    snitt_ms: 3340
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
    anrop: 27
    ok: 27
    rate_limits: 0
    errors: 0
    snitt_ms: 2020
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

# AI Provider Performance — 2026-08-09

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 669 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 27 anrop · 27 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 632 | 632 (100%) | 0 (0%) | 0 | 1043 ms | 100% ok · 1210 ms |
| 🟢 `sambanova` | 3 | 3 (100%) | 0 (0%) | 0 | 3340 ms | 100% ok · 1600 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2590 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3300 ms |
| 🟢 `groq` | 27 | 27 (100%) | 0 (0%) | 0 | 2020 ms | 100% ok · 670 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → sambanova → deepseek → cloudflare → groq → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-09 04:09 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (939 anrop, 0 rl, 0 err)
  🟢 sambanova        100% ok   (4 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (47 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen hanterat 669 anrop utan någon hälsoproblem – både 24‑timmars‑ och 7‑dagars‑hälsopoäng ligger på 100 %. Mistral dominerade med 632 anrop och en genomsnittlig svarstid på 1 043 ms, medan Groq levererade 27 anrop på 2 020 ms och Sambanova 3 anrop på 3 340 ms; inga provider‑gränser (rate‑limits) nåddes. Inga leverantörer har rapporterats som problematiska (>30 % felrate eller <50 % OK‑andel), och de övriga (Deepseek, Cloudflare, Cerebras, GitHub‑models, Gemini) har ännu inte använts. **Rekommendation:** Prioritera Mistral för primär belastning, behåll Groq som sekundär reserv och utvärdera Sambanova för högre latens‑toleranta uppgifter; överväg att aktivera Deepseek och Cloudflare som framtida fallback‑alternativ.
