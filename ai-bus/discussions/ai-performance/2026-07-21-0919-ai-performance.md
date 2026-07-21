---
date: 2026-07-21
type: ai-performance
overall_health_24h: 100
overall_health_7d: 99.8
total_calls_24h: 571
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "github_models", "cloudflare", "groq", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-07-21 05:41 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 526
    ok: 526
    rate_limits: 0
    errors: 0
    snitt_ms: 1283
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
    anrop: 24
    ok: 24
    rate_limits: 0
    errors: 0
    snitt_ms: 2428
  sambanova:
    anrop: 9
    ok: 9
    rate_limits: 0
    errors: 0
    snitt_ms: 3906
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

# AI Provider Performance — 2026-07-21

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 571 anrop totalt
🟢 **99.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 24 anrop · 24 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 526 | 526 (100%) | 0 (0%) | 0 | 1283 ms | 100% ok · 1050 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2560 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3040 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4260 ms |
| 🟢 `groq` | 24 | 24 (100%) | 0 (0%) | 0 | 2428 ms | 100% ok · 660 ms |
| 🟢 `sambanova` | 9 | 9 (100%) | 0 (0%) | 0 | 3906 ms | 10% ok · 2290 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → cloudflare → groq → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-07-21 05:41 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (929 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (46 anrop, 0 rl, 0 err)
  🟢 sambanova        81.8% ok   (11 anrop, 2 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen hanterat 571 anrop med en hälsopoäng på 100 % (7‑dagars genomsnitt 99,8 %). Mistral dominerade med 526 anrop och levererade konsekvent 100 % utan rate‑limits, men med en genomsnittlig svarstid på 1 283 ms. Groq och Sambanova användes sparsamt (24 respektive 9 anrop) och presterade också utan fel, men deras svarstider var betydligt högre – 2 428 ms respektive 3 906 ms. Inga leverantörer nådde kritiska trösklar (>30 % rate‑limit eller <50 % OK).

**Rekommendation (prioriterad):** behåll Mistral som primär leverantör, men för tidskänsliga eller beräkningsintensiva uppgifter bör du börja fördela en del av belastningen till Groq (med sin lägre latens än Sambanova) och övervaka deras kvotutnyttj
