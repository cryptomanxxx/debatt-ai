---
date: 2026-07-17
type: ai-performance
overall_health_24h: 99.1
overall_health_7d: 99.5
total_calls_24h: 573
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["sambanova", "mistral", "deepseek", "github_models", "cloudflare", "groq", "cerebras", "gemini"]
config_uppdaterad: "2026-07-17 05:33 UTC"
order_source: "provider_config"
providers_24h:
  sambanova:
    anrop: 17
    ok: 13
    rate_limits: 4
    errors: 0
    snitt_ms: 1474
  mistral:
    anrop: 521
    ok: 520
    rate_limits: 0
    errors: 1
    snitt_ms: 1245
  deepseek:
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 2705
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
    anrop: 26
    ok: 26
    rate_limits: 0
    errors: 0
    snitt_ms: 2342
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

# AI Provider Performance — 2026-07-17

## Hälsostatus

🟢 **99.1%** lyckade anrop senaste 24h · 573 anrop totalt
🟢 **99.5%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 26 anrop · 26 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `sambanova` | 17 | 13 (76.5%) | 4 (23.5%) | 0 | 1474 ms | 100% ok · 970 ms |
| 🟢 `mistral` | 521 | 520 (99.8%) | 0 (0%) | 1 | 1245 ms | 100% ok · 1320 ms |
| 🟢 `deepseek` | 1 | 1 (100%) | 0 (0%) | 0 | 2705 ms | 100% ok · 2290 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3030 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3910 ms |
| 🟢 `groq` | 26 | 26 (100%) | 0 (0%) | 0 | 2342 ms | 100% ok · 620 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`sambanova → mistral → deepseek → github_models → cloudflare → groq → cerebras → gemini`

*(Benchmark senast körde: 2026-07-17 05:33 UTC)*

## 7-Dagars Trend

```
  🟢 sambanova        81% ok   (21 anrop, 4 rl, 0 err)
  🟢 mistral          99.9% ok   (920 anrop, 0 rl, 1 err)
  🟢 deepseek         100% ok   (1 anrop, 0 rl, 0 err)
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (42 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har systemets hälsopoäng legat på 99,1 % (99,5 % på 7‑dagarsperioden) och totalt 573 anrop har genomförts. Mistral dominerade med 521 anrop och en exceptionell 99,8 % lyckad leverans utan några rate‑limits, medan Groq levererade 26 anrop med 100 % framgång men med längre svarstid (2 342 ms). Sambanova visade sig vara den enda leverantören med märkbara problem – endast 76,5 % av 17 anrop godkändes och fyra av dem drabbades av rate‑limit, vilket ger en genomsnittlig svarstid på 1 474 ms. 

**Rekommendation (prioriterad):** 1️⃣ fortsätt att prioritera Mistral som huvudleverantör; 2️⃣ använd Groq som sekundär backup för kapacitetsökning; 3️⃣ minska beroendet av Sambanova tills rate‑limit‑problemen är lösta eller ersätt dem med en annan stabil leverantör.
