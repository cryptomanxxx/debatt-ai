---
date: 2026-08-11
type: ai-performance
overall_health_24h: 95.8
overall_health_7d: 97.2
total_calls_24h: 607
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "sambanova", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-11 04:10 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 543
    ok: 543
    rate_limits: 0
    errors: 0
    snitt_ms: 1097
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
    anrop: 31
    ok: 31
    rate_limits: 0
    errors: 0
    snitt_ms: 1924
  sambanova:
    anrop: 25
    ok: 0
    rate_limits: 25
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

# AI Provider Performance — 2026-08-11

## Hälsostatus

🟢 **95.8%** lyckade anrop senaste 24h · 607 anrop totalt
🟢 **97.2%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 31 anrop · 31 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 543 | 543 (100%) | 0 (0%) | 0 | 1097 ms | 100% ok · 1360 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2490 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3320 ms |
| 🟢 `groq` | 31 | 31 (100%) | 0 (0%) | 0 | 1924 ms | 100% ok · 600 ms |
| 🔴 `sambanova` | 25 | 0 (0%) | 25 (100%) | 0 | – | 0% ok · 0 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → sambanova → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-11 04:10 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (899 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (51 anrop, 0 rl, 0 err)
  🔴 sambanova        28.2% ok   (39 anrop, 28 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 0/25 ok (0%), 25 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har plattformen hanterat 607 anrop med en hälsopoäng på 95,8 % (sju‑dagars genomsnitt 97,2 %). Mistral har dominerat trafiken med 543 anrop och 100 % lyckade svar (med en genomsnittlig svarstid på 1 097 ms), medan Groq levererade 31 anrop utan rate‑limits men med en längre svarstid på 1 924 ms. Sambanova är den enda leverantören med kritiska problem – alla 25 anrop har träffat rate‑limit och ingen har lyckats. **Rekommendation:** prioritera fortsatt användning av Mistral, följt av DeepSeek och Cloudflare (i fallback‑kedjan), och förstärk Groq‑kapaciteten genom att utnyttja fler nycklar; undvik Sambanova tills rate‑limit‑kvoten kan höjas eller en alternativ leverantör kan ersätta den.
