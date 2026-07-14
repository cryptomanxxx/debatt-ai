---
date: 2026-07-14
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 768
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "github_models", "cloudflare", "sambanova", "groq", "cerebras", "gemini"]
config_uppdaterad: "2026-07-14 05:21 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 721
    ok: 721
    rate_limits: 0
    errors: 0
    snitt_ms: 1000
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
  sambanova:
    anrop: 9
    ok: 9
    rate_limits: 0
    errors: 0
    snitt_ms: 3847
  groq:
    anrop: 26
    ok: 26
    rate_limits: 0
    errors: 0
    snitt_ms: 2403
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

# AI Provider Performance — 2026-07-14

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 768 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 26 anrop · 26 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 721 | 721 (100%) | 0 (0%) | 0 | 1000 ms | 100% ok · 1270 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2270 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3200 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 5230 ms |
| 🟢 `sambanova` | 9 | 9 (100%) | 0 (0%) | 0 | 3847 ms | 100% ok · 990 ms |
| 🟢 `groq` | 26 | 26 (100%) | 0 (0%) | 0 | 2403 ms | 100% ok · 600 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → cloudflare → sambanova → groq → cerebras → gemini`

*(Benchmark senast körde: 2026-07-14 05:21 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (934 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 sambanova        100% ok   (9 anrop, 0 rl, 0 err)
  🟢 groq             100% ok   (41 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har systemet hanterat 768 anrop utan några kritiska problem – inga leverantörer har överskridit 30 % responstid eller fallit under 50 % framgångsgrad. Mistral dominerade med 721 anrop och levererade konsekvent 100 % utan rate‑limits (med en medel‑latens på ca 1 sekund), medan Sambanova och Groq fick färre anrop (9 respektive 26) men märktes av högre svarstider (3,8 s respektive 2,4 s). De övriga leverantörerna (deepseek, github_models, cloudflare, cerebras, gemini) har inte använts under perioden, men deras benchmark‑status visar 100 % funktionalitet när de aktiveras. **Rekommendation:** behåll Mistral som primär leverantör, prioritera Sambanova som sekundär fallback på grund av dess högre latens, och övervä
