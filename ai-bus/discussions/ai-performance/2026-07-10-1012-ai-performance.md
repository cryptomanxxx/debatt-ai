---
date: 2026-07-10
type: ai-performance
overall_health_24h: 99.7
overall_health_7d: 99
total_calls_24h: 758
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "github_models", "cloudflare", "groq", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-07-10 06:33 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 727
    ok: 727
    rate_limits: 0
    errors: 0
    snitt_ms: 1114
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
    anrop: 25
    ok: 25
    rate_limits: 0
    errors: 0
    snitt_ms: 2469
  sambanova:
    anrop: 2
    ok: 0
    rate_limits: 2
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

# AI Provider Performance — 2026-07-10

## Hälsostatus

🟢 **99.7%** lyckade anrop senaste 24h · 758 anrop totalt
🟢 **99%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 25 anrop · 25 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 727 | 727 (100%) | 0 (0%) | 0 | 1114 ms | 100% ok · 1370 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2610 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3310 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 5720 ms |
| 🟢 `groq` | 25 | 25 (100%) | 0 (0%) | 0 | 2469 ms | 100% ok · 650 ms |
| 🔴 `sambanova` | 2 | 0 (0%) | 2 (100%) | 0 | – | 100% ok · 2590 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → cloudflare → groq → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-07-10 06:33 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (904 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (37 anrop, 0 rl, 0 err)
  🟡 sambanova        79.6% ok   (49 anrop, 10 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen hanterat 758 anrop med en hälsopoäng på 99,7 % och inga leverantörer som överskrider 30 % fel- eller svarstidsgränser. Mistral dominerade med 727 anrop, 100 % framgång och en genomsnittlig svarstid på 1 114 ms, medan Groq levererade 25 anrop utan rate‑limits men med en längre svarstid på 2 469 ms. Sambanova däremot har visat två rate‑limit‑händelser på två anrop och 0 % lyckade svar, vilket indikerar att den nuvarande kvoten är överskriden. **Rekommendation:** Prioritera fortsatt användning av Mistral som huvudleverantör, minska eller pausa Sambanova‑trafiken tills kvoten justeras, och överväg att fördela fler Groq‑nycklar eller aktivera Deepseek som sekundär fallback för att förbättra svarstider och redundans.
