---
date: 2026-07-25
type: ai-performance
overall_health_24h: 99.5
overall_health_7d: 99.7
total_calls_24h: 597
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["sambanova", "mistral", "github_models", "groq", "cloudflare", "cerebras", "gemini", "deepseek"]
config_uppdaterad: "2026-07-25 05:35 UTC"
order_source: "provider_config"
providers_24h:
  sambanova:
    anrop: 14
    ok: 11
    rate_limits: 3
    errors: 0
    snitt_ms: 1114
  mistral:
    anrop: 555
    ok: 555
    rate_limits: 0
    errors: 0
    snitt_ms: 996
  github_models:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 24
    ok: 24
    rate_limits: 0
    errors: 0
    snitt_ms: 2470
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
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
  deepseek:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-07-25

## Hälsostatus

🟢 **99.5%** lyckade anrop senaste 24h · 597 anrop totalt
🟢 **99.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 24 anrop · 24 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `sambanova` | 14 | 11 (78.6%) | 3 (21.4%) | 0 | 1114 ms | 100% ok · 1080 ms |
| 🟢 `mistral` | 555 | 555 (100%) | 0 (0%) | 0 | 996 ms | 100% ok · 1410 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3070 ms |
| 🟢 `groq` | 24 | 24 (100%) | 0 (0%) | 0 | 2470 ms | 100% ok · 630 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 6000 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`sambanova → mistral → github_models → groq → cloudflare → cerebras → gemini → deepseek`

*(Benchmark senast körde: 2026-07-25 05:35 UTC)*

## 7-Dagars Trend

```
  🟢 sambanova        80% ok   (15 anrop, 3 rl, 0 err)
  🟢 mistral          100% ok   (934 anrop, 0 rl, 0 err)
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (44 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen haft en hälsopoäng på 99,5 % och hanterat 597 anrop utan någon kritisk leverantör (ingen med >30 % rate‑limit eller <50 % lyckade svar). Mistral dominerade med 555 anrop, 100 % lyckade svar och en genomsnittlig svarstid på 996 ms, medan Groq levererade 24 anrop utan rate‑limits men med en betydligt högre latens på 2470 ms. Sambanova hade endast 14 anrop men drabbades av tre rate‑limits och en lägre andel lyckade svar (78,6 %). 

**Rekommendation (prioriterad):** 1️⃣ fortsätt att rikta primära trafik till Mistral; 2️⃣ behåll Groq som sekundär fallback för att sprida belastning, men övervaka latensen; 3️⃣ minska beroendet av Sambanova tills rate‑limit‑problemen är lösta.
