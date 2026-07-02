---
date: 2026-07-02
type: ai-performance
overall_health_24h: 96.2
overall_health_7d: 96.7
total_calls_24h: 820
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["mistral", "deepseek", "github_models", "cloudflare", "groq", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-07-02 06:29 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 717
    ok: 717
    rate_limits: 0
    errors: 0
    snitt_ms: 1243
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
    snitt_ms: 2429
  sambanova:
    anrop: 71
    ok: 40
    rate_limits: 31
    errors: 0
    snitt_ms: 1989
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

# AI Provider Performance — 2026-07-02

## Hälsostatus

🟢 **96.2%** lyckade anrop senaste 24h · 820 anrop totalt
🟢 **96.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 24 anrop · 24 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 717 | 717 (100%) | 0 (0%) | 0 | 1243 ms | 100% ok · 1410 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2540 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3190 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3210 ms |
| 🟢 `groq` | 24 | 24 (100%) | 0 (0%) | 0 | 2429 ms | 100% ok · 680 ms |
| 🟡 `sambanova` | 71 | 40 (56.3%) | 31 (43.7%) | 0 | 1989 ms | 0% ok · 0 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → cloudflare → groq → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-07-02 06:29 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (863 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (36 anrop, 0 rl, 0 err)
  🟡 sambanova        64.1% ok   (92 anrop, 33 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 40/71 ok (56.3%), 31 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har plattformen hanterat 820 anrop med ett hälsopoäng på 96,2 % (96,7 % över 7 dagar). Mistral dominerade med 717 anrop och 100 % lyckade svar (genomsnittlig svarstid 1 243 ms), medan Groq levererade 24 anrop utan fel men med en längre svarstid på 2 429 ms. Sambanova visade sig vara den svagaste länken – endast 56,3 % av 71 anrop klarade, och 31 av dem möttes av rate‑limits (≈44 %). 

**Rekommendation:** Prioritera Mistral som primär leverantör, håll Groq som sekundär fallback och minska eller tillfälligt avbryt användning av Sambanova tills deras rate‑limit‑problem är lösta.
