---
date: 2026-08-16
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 510
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "sambanova", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-16 03:39 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 479
    ok: 479
    rate_limits: 0
    errors: 0
    snitt_ms: 1035
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
    anrop: 23
    ok: 23
    rate_limits: 0
    errors: 0
    snitt_ms: 2300
  sambanova:
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

# AI Provider Performance — 2026-08-16

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 510 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 23 anrop · 23 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 479 | 479 (100%) | 0 (0%) | 0 | 1035 ms | 100% ok · 1780 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2620 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3010 ms |
| 🟢 `groq` | 23 | 23 (100%) | 0 (0%) | 0 | 2300 ms | 100% ok · 700 ms |
| ⚪ `sambanova` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → sambanova → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-16 03:39 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (944 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (42 anrop, 0 rl, 0 err)
  ⚪ sambanova        ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har Mistral dominerat trafiken med 479 anrop och levererat 100 % framgång med en genomsnittlig svarstid på ca 1 sekund, medan Groq hanterade 23 anrop utan några rate‑limits men med en längre svarstid på ca 2,3 sekunder. Inga andra leverantörer har anropats, men deras benchmark‑status visar att Deepseek och Cloudflare förväntas fungera felfritt, medan Sambanova, Cerebras, GitHub‑models och Gemini ännu inte har bekräftats. Systemets häls
