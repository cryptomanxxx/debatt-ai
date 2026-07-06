---
date: 2026-07-06
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "sambanova", "deepseek", "cloudflare", "github_models", "groq", "cerebras", "gemini"]
config_uppdaterad: "2026-07-06 07:00 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 976
    ok: 976
    rate_limits: 0
    errors: 0
    snitt_ms: 1114
  sambanova:
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 3504
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
  github_models:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 19
    ok: 19
    rate_limits: 0
    errors: 0
    snitt_ms: 2292
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

# AI Provider Performance — 2026-07-06

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 19 anrop · 19 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 976 | 976 (100%) | 0 (0%) | 0 | 1114 ms | 100% ok · 1270 ms |
| 🟢 `sambanova` | 1 | 1 (100%) | 0 (0%) | 0 | 3504 ms | 100% ok · 1460 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2820 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3060 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3110 ms |
| 🟢 `groq` | 19 | 19 (100%) | 0 (0%) | 0 | 2292 ms | 100% ok · 670 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → sambanova → deepseek → cloudflare → github_models → groq → cerebras → gemini`

*(Benchmark senast körde: 2026-07-06 07:00 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (976 anrop, 0 rl, 0 err)
  🟢 sambanova        100% ok   (1 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (19 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har hela systemet presterat stabilt med 100 % hälsopoäng och inga problemleverantörer (ingen provider över 30 % felrate eller under 50 % lyckade anrop). Mistral har dominerat med 976 anrop och en genomsnittlig svarstid på 1 114 ms, medan Sambanova bara har använts en gång men visade en längre svarstid på 3 504 ms. Groq har hanterat 19 anrop utan rate‑limits och med en svarstid på 2 292 ms, och de övriga leverantörerna har ännu inte anropats. 

**Rekommendation (prioriterad):** behåll Mistral som primär provider, fortsätt att ha Sambanova som sekundär fallback men håll ett öga på dess högre latens, och utnyttja Groq som en reserv när belastningen på Mistral ökar.
