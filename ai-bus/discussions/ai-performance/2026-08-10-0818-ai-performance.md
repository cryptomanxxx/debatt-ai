---
date: 2026-08-10
type: ai-performance
overall_health_24h: 99.5
overall_health_7d: 99.7
total_calls_24h: 614
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["sambanova", "mistral", "deepseek", "cloudflare", "groq", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-10 04:21 UTC"
order_source: "provider_config"
providers_24h:
  sambanova:
    anrop: 14
    ok: 11
    rate_limits: 3
    errors: 0
    snitt_ms: 2598
  mistral:
    anrop: 569
    ok: 569
    rate_limits: 0
    errors: 0
    snitt_ms: 1007
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
    snitt_ms: 1929
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

# AI Provider Performance — 2026-08-10

## Hälsostatus

🟢 **99.5%** lyckade anrop senaste 24h · 614 anrop totalt
🟢 **99.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 28 anrop · 28 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `sambanova` | 14 | 11 (78.6%) | 3 (21.4%) | 0 | 2598 ms | 100% ok · 890 ms |
| 🟢 `mistral` | 569 | 569 (100%) | 0 (0%) | 0 | 1007 ms | 100% ok · 1320 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2520 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3610 ms |
| 🟢 `groq` | 28 | 28 (100%) | 0 (0%) | 0 | 1929 ms | 100% ok · 610 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`sambanova → mistral → deepseek → cloudflare → groq → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-10 04:21 UTC)*

## 7-Dagars Trend

```
  🟢 sambanova        83.3% ok   (18 anrop, 3 rl, 0 err)
  🟢 mistral          100% ok   (925 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (49 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen haft en hälsopoäng på 99,5 % och hanterat 614 anrop. Mistral dominerade med 569 anrop, 100 % lyckade svar och den kortaste svarstiden (≈1 s), medan Groq levererade 28 anrop utan rate‑limits men med en längre latens (≈1,9 s). Sambanova hade 14 anrop men bara 78,6 % lyckade och drabbades av tre rate‑limits, vilket gör den till den svagaste länken i kedjan. **Rekommendation:** prioritera Mistral som primär leverantör, behåll Groq som sekundär fallback och övervaka Sambanova noggrant för att åtgärda rate‑limit‑problemen.
