---
date: 2026-08-02
type: ai-performance
overall_health_24h: 96.3
overall_health_7d: 97.5
total_calls_24h: 578
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "sambanova", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-02 05:46 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 525
    ok: 525
    rate_limits: 0
    errors: 0
    snitt_ms: 1047
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
    anrop: 29
    ok: 29
    rate_limits: 0
    errors: 0
    snitt_ms: 2176
  sambanova:
    anrop: 21
    ok: 0
    rate_limits: 21
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

# AI Provider Performance — 2026-08-02

## Hälsostatus

🟢 **96.3%** lyckade anrop senaste 24h · 578 anrop totalt
🟢 **97.5%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 29 anrop · 29 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 525 | 525 (100%) | 0 (0%) | 0 | 1047 ms | 100% ok · 1100 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3210 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3360 ms |
| 🟢 `groq` | 29 | 29 (100%) | 0 (0%) | 0 | 2176 ms | 100% ok · 660 ms |
| 🔴 `sambanova` | 21 | 0 (0%) | 21 (100%) | 0 | – | 0% ok · 0 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → sambanova → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-02 05:46 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (910 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (49 anrop, 0 rl, 0 err)
  🔴 sambanova        24.2% ok   (33 anrop, 25 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 0/21 ok (0%), 21 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har plattformen hanterat 578 anrop med en hälsopoäng på 96,3 % (7‑dagsgenomsnitt 97,5 %). Mistral levererade stabilt med 525 anrop, 100 % framgång och en svarstid på 1 047 ms, medan Groq klarade 29 anrop utan rate‑limits men med längre latens (2 176 ms). Sambanova har däremot misslyckats i samtliga 21 anrop och drabbats av rate‑limits, vilket gör den till den enda leverantören med <50 % OK‑status. **Rekommendation:** prioritera att inaktivera Sambanova i fallback‑kedjan och omfördela dess trafik till Mistral och Groq, samt övervaka Groqs svarstid för eventuella optimeringar.
