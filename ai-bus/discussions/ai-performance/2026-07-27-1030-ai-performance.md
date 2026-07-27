---
date: 2026-07-27
type: ai-performance
overall_health_24h: 99.8
overall_health_7d: 98.4
total_calls_24h: 515
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "github_models", "cloudflare", "groq", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-07-27 06:17 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 490
    ok: 490
    rate_limits: 0
    errors: 0
    snitt_ms: 1075
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
    anrop: 17
    ok: 17
    rate_limits: 0
    errors: 0
    snitt_ms: 2400
  sambanova:
    anrop: 2
    ok: 1
    rate_limits: 1
    errors: 0
    snitt_ms: 2970
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

# AI Provider Performance — 2026-07-27

## Hälsostatus

🟢 **99.8%** lyckade anrop senaste 24h · 515 anrop totalt
🟢 **98.4%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 17 anrop · 17 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 490 | 490 (100%) | 0 (0%) | 0 | 1075 ms | 100% ok · 1130 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2630 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3280 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3990 ms |
| 🟢 `groq` | 17 | 17 (100%) | 0 (0%) | 0 | 2400 ms | 100% ok · 650 ms |
| 🟡 `sambanova` | 2 | 1 (50%) | 1 (50%) | 0 | 2970 ms | 100% ok · 1110 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → cloudflare → groq → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-07-27 06:17 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (929 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (40 anrop, 0 rl, 0 err)
  🔴 sambanova        15.8% ok   (19 anrop, 16 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen haft en hälsopoäng på 99,8 % och totalt 515 anrop. Mistral dominerade med 490 anrop och levererade 100 % utan någon rate‑limit (genomsnittlig svarstid 1 075 ms). Groq följde med 17 anrop, också 100 % ok, men svarstiden var längre (≈2 400 ms). Sambanova visade tecken på problem – endast 2 anrop, 50 % lyckade och en rate‑limit, vilket gör den till den svagaste länken i kedjan.  

**Rekommendation (prioriterad):** 1️⃣ Fortsätt att prioritera Mistral som huvud‑provider; 2️⃣ Använd Groq som sekundär backup med medvetenhet om högre latens; 3️⃣ Undvik Sambanova tills dess
