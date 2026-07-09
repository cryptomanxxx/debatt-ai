---
date: 2026-07-09
type: ai-performance
overall_health_24h: 96.6
overall_health_7d: 96.7
total_calls_24h: 804
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["mistral", "deepseek", "github_models", "groq", "cloudflare", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-07-09 06:34 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 710
    ok: 710
    rate_limits: 0
    errors: 0
    snitt_ms: 1161
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
  groq:
    anrop: 21
    ok: 21
    rate_limits: 0
    errors: 0
    snitt_ms: 2493
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  sambanova:
    anrop: 66
    ok: 39
    rate_limits: 27
    errors: 0
    snitt_ms: 4385
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

# AI Provider Performance — 2026-07-09

## Hälsostatus

🟢 **96.6%** lyckade anrop senaste 24h · 804 anrop totalt
🟢 **96.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 21 anrop · 21 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 710 | 710 (100%) | 0 (0%) | 0 | 1161 ms | 100% ok · 1740 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3140 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3290 ms |
| 🟢 `groq` | 21 | 21 (100%) | 0 (0%) | 0 | 2493 ms | 100% ok · 670 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 80% ok · 5600 ms |
| 🟡 `sambanova` | 66 | 39 (59.1%) | 27 (40.9%) | 0 | 4385 ms | 10% ok · 1170 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → groq → cloudflare → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-07-09 06:34 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (855 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (34 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 80% ok
  🟡 sambanova        66.3% ok   (98 anrop, 33 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 39/66 ok (59.1%), 27 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har plattformen hanterat 804 anrop med en hälsopoäng på 96,6 % (7‑dags medelvärde 96,7 %). Mistral har presterat bäst med 710 anrop, 100 % lyckade svar och en medelrespons på 1 161 ms, medan Groq levererade 21 anrop utan fel men med en längre svarstid på 2 493 ms. Sambanova är den enda problemleverantören: av 66 anrop lyckades bara 59,1 % och 27 av dem drabbades av rate‑limits, vilket ger en medelrespons på 4 385 ms. **Rekommendation:** prioritera Mistral som primär leverantör, behåll Groq som sekundär fallback och minska beroendet av Sambanova genom att omfördela förfrågningarna till Groq (utöka antalet Groq‑nycklar) tills Sambanova‑prestandan förbättras.
