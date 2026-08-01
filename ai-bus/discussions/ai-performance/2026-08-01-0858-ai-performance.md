---
date: 2026-08-01
type: ai-performance
overall_health_24h: 99.5
overall_health_7d: 99.7
total_calls_24h: 608
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["sambanova", "mistral", "deepseek", "groq", "cloudflare", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-01 05:46 UTC"
order_source: "provider_config"
providers_24h:
  sambanova:
    anrop: 12
    ok: 9
    rate_limits: 3
    errors: 0
    snitt_ms: 1256
  mistral:
    anrop: 560
    ok: 560
    rate_limits: 0
    errors: 0
    snitt_ms: 1111
  deepseek:
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
    snitt_ms: 2031
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

# AI Provider Performance — 2026-08-01

## Hälsostatus

🟢 **99.5%** lyckade anrop senaste 24h · 608 anrop totalt
🟢 **99.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 31 anrop · 31 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `sambanova` | 12 | 9 (75%) | 3 (25%) | 0 | 1256 ms | 100% ok · 1050 ms |
| 🟢 `mistral` | 560 | 560 (100%) | 0 (0%) | 0 | 1111 ms | 100% ok · 1300 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2960 ms |
| 🟢 `groq` | 31 | 31 (100%) | 0 (0%) | 0 | 2031 ms | 100% ok · 670 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4000 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`sambanova → mistral → deepseek → groq → cloudflare → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-01 05:46 UTC)*

## 7-Dagars Trend

```
  🟡 sambanova        76.9% ok   (13 anrop, 3 rl, 0 err)
  🟢 mistral          100% ok   (928 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (53 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformens hälsopoäng legat på 99,5 % (99,7 % på 7 dagar) och totalt 608 anrop har genomförts utan kritiska problem. Mistral har dominerat med 560 anrop (100 % lyckade, ingen rate‑limit) och en genomsnittlig svarstid på 1111 ms, medan Groq levererade 31 anrop (100 % lyckade) men med en högre latens på 2031 ms. Sambanova har däremot bara 12 anrop, varav endast 75 % lyckades och tre av dem drabbades av rate‑limits, vilket ger en svarstid på 1256 ms. Inga andra leverantörer har använts under perioden.

**Rekommendation (prioriterad):**  
1. Fortsätt att använda Mistral som primär provider.  
2. Aktivera Groq som sekundär backup för att hantera toppbelastning, med medvetenhet om högre latens.  
3. Övervaka Sambanova noggrant
