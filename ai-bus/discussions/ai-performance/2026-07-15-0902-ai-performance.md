---
date: 2026-07-15
type: ai-performance
overall_health_24h: 99.8
overall_health_7d: 99.9
total_calls_24h: 636
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "github_models", "sambanova", "cloudflare", "groq", "cerebras", "gemini"]
config_uppdaterad: "2026-07-15 05:21 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 592
    ok: 592
    rate_limits: 0
    errors: 0
    snitt_ms: 1046
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
  sambanova:
    anrop: 9
    ok: 8
    rate_limits: 1
    errors: 0
    snitt_ms: 3595
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 25
    ok: 25
    rate_limits: 0
    errors: 0
    snitt_ms: 2414
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

# AI Provider Performance — 2026-07-15

## Hälsostatus

🟢 **99.8%** lyckade anrop senaste 24h · 636 anrop totalt
🟢 **99.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 25 anrop · 25 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 592 | 592 (100%) | 0 (0%) | 0 | 1046 ms | 100% ok · 1180 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2600 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3160 ms |
| 🟢 `sambanova` | 9 | 8 (88.9%) | 1 (11.1%) | 0 | 3595 ms | 100% ok · 1090 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3960 ms |
| 🟢 `groq` | 25 | 25 (100%) | 0 (0%) | 0 | 2414 ms | 100% ok · 680 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → sambanova → cloudflare → groq → cerebras → gemini`

*(Benchmark senast körde: 2026-07-15 05:21 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (926 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  🟢 sambanova        92.9% ok   (14 anrop, 1 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (44 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen hanterat 636 anrop med en hälsopoäng på 99,8 % (99,9 % på 7 dagar). Mistral dominerade med 592 anrop, 100 % lyckade och ingen rate‑limit, medan Groq levererade 25 anrop utan problem (100 % ok, 2414 ms). Sambanova visade en något lägre stabilitet: 9 anrop, 88,9 % lyckade och en rate‑limit‑händelse, med en genomsnittlig svarstid på 3595 ms. Inga andra leverantörer har anropats, men ingen av dem klassas som problematiska (>30 % rl eller <50 % ok).

**Rekommendation (prioriterad):** 1️⃣ fortsätt att prioritera Mistral som huvud‑provider; 2️⃣ använd Groq som sekundär backup; 3️⃣ håll Sambanova som reserv men övervaka rate‑limit‑ och svarstidsprestanda noggrant.
