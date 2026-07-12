---
date: 2026-07-12
type: ai-performance
overall_health_24h: 96.4
overall_health_7d: 97.3
total_calls_24h: 735
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["mistral", "deepseek", "github_models", "cloudflare", "groq", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-07-12 05:47 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 682
    ok: 682
    rate_limits: 0
    errors: 0
    snitt_ms: 1042
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
    anrop: 22
    ok: 22
    rate_limits: 0
    errors: 0
    snitt_ms: 2403
  sambanova:
    anrop: 26
    ok: 0
    rate_limits: 26
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

# AI Provider Performance — 2026-07-12

## Hälsostatus

🟢 **96.4%** lyckade anrop senaste 24h · 735 anrop totalt
🟢 **97.3%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 22 anrop · 22 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 682 | 682 (100%) | 0 (0%) | 0 | 1042 ms | 100% ok · 1470 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2400 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2870 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4060 ms |
| 🟢 `groq` | 22 | 22 (100%) | 0 (0%) | 0 | 2403 ms | 100% ok · 640 ms |
| 🔴 `sambanova` | 26 | 0 (0%) | 26 (100%) | 0 | – | 0% ok · 0 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → cloudflare → groq → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-07-12 05:47 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (881 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (41 anrop, 0 rl, 0 err)
  🟡 sambanova        60.3% ok   (68 anrop, 27 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 0/26 ok (0%), 26 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har plattformen hanterat 735 anrop med en hälsopoäng på 96,4 % (7‑dagsmedel 97,3 %). Mistral dominerade med 682 anrop, 100 % lyckade svar och en svarstid på ca 1 sekund, medan Groq levererade 22 anrop utan rate‑limits men med längre svarstid (≈2,4 s). Sambanova misslyckades helt – 26 anrop drabbades av rate‑limits och ingen svarade korrekt, vilket placerar den i problemkategorin (>30 % misslyckande). **Rekommendation:** behåll Mistral som primär leverantör, använd Groq som sekundär fallback och ta omedelbart bort Sambanova från fallback‑kedjan tills kvoten justeras eller en ny nyckel konfigureras.
