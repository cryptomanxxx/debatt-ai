---
date: 2026-07-23
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 572
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "github_models", "sambanova", "groq", "cloudflare", "cerebras", "gemini"]
config_uppdaterad: "2026-07-23 05:46 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 540
    ok: 540
    rate_limits: 0
    errors: 0
    snitt_ms: 1077
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
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 2757
  groq:
    anrop: 25
    ok: 25
    rate_limits: 0
    errors: 0
    snitt_ms: 2392
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
---

# AI Provider Performance — 2026-07-23

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 572 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 25 anrop · 25 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 540 | 540 (100%) | 0 (0%) | 0 | 1077 ms | 100% ok · 1160 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2240 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3130 ms |
| 🟢 `sambanova` | 1 | 1 (100%) | 0 (0%) | 0 | 2757 ms | 100% ok · 3690 ms |
| 🟢 `groq` | 25 | 25 (100%) | 0 (0%) | 0 | 2392 ms | 100% ok · 530 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 9590 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → sambanova → groq → cloudflare → cerebras → gemini`

*(Benchmark senast körde: 2026-07-23 05:46 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (945 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  🟢 sambanova        100% ok   (2 anrop, 0 rl, 0 err)
  🟢 groq             100% ok   (45 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen hanterat 572 anrop med full hälsopoäng (100 % både 24 h och 7 d). Mistral dominerade med 540 anrop och en genomsnittlig svarstid på 1 077 ms utan några rate‑limits, medan Sambanova (1 anrop) och Groq (25 anrop) uppvisade längre svarstider på 2 757 ms respektive 2 392 ms. Inga leverantörer har nått kritiska gränsvärden (>30 % rate‑limit eller <50 % OK), och de övriga (DeepSeek, GitHub‑models, Cloudflare, Cerebras, Gemini) har inte anropats under perioden. **Rekommendation:** fortsätt prioritera Mistral för bulk‑trafik, men överväg att distribuera fler Groq‑nycklar eller byta till en snabbare fallback‑leverantör (t.ex. DeepSeek) för att minska latency på de få återstående anropen.
