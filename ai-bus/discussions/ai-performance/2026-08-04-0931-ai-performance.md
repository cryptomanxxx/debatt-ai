---
date: 2026-08-04
type: ai-performance
overall_health_24h: 99.5
overall_health_7d: 99.6
total_calls_24h: 670
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["sambanova", "mistral", "deepseek", "cloudflare", "groq", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-04 05:37 UTC"
order_source: "provider_config"
providers_24h:
  sambanova:
    anrop: 19
    ok: 16
    rate_limits: 3
    errors: 0
    snitt_ms: 2110
  mistral:
    anrop: 613
    ok: 613
    rate_limits: 0
    errors: 0
    snitt_ms: 1054
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
    anrop: 28
    ok: 28
    rate_limits: 0
    errors: 0
    snitt_ms: 2157
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

# AI Provider Performance — 2026-08-04

## Hälsostatus

🟢 **99.5%** lyckade anrop senaste 24h · 670 anrop totalt
🟢 **99.6%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 28 anrop · 28 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `sambanova` | 19 | 16 (84.2%) | 3 (15.8%) | 0 | 2110 ms | 100% ok · 1060 ms |
| 🟢 `mistral` | 613 | 613 (100%) | 0 (0%) | 0 | 1054 ms | 100% ok · 1150 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2720 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3280 ms |
| 🟢 `groq` | 28 | 28 (100%) | 0 (0%) | 0 | 2157 ms | 100% ok · 540 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`sambanova → mistral → deepseek → cloudflare → groq → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-04 05:37 UTC)*

## 7-Dagars Trend

```
  🟢 sambanova        81% ok   (21 anrop, 4 rl, 0 err)
  🟢 mistral          100% ok   (919 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (47 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har **Mistral** dominerat med 613 anrop och 100 % lyckade svar utan några rate‑limits, men svarstiden ligger på cirka 1 050 ms. **Sambanova** har bara 19 anrop och en lägre framgångsfrekvens (84,2 %) samt tre rate‑limits, vilket ger en genomsnittlig svarstid på 2 110 ms. **Groq** har hanterat 28 anrop utan fel, men svarstiden är den högsta (2 157 ms) och den totala kvoten på ~144 k per konto kan bli en flaskhals om trafiken ökar. Inga andra leverantörer har använts, men deras benchmark‑status är god.

**Rekommendation (prioriterad):**  
1. Fortsätt att prioritera **Mistral** som huvud‑provider.  
2. Sänk Sambanova‑trafiken eller öka dess kvot för att undvika rate‑limits.  
3. Om svarstiden blir kritisk, överväg att flytta en del av belastningen till **Deepseek** (för närvarande oanvänd
