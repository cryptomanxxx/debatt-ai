---
date: 2026-07-08
type: ai-performance
overall_health_24h: 99.6
overall_health_7d: 99.7
total_calls_24h: 791
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["sambanova", "mistral", "deepseek", "github_models", "groq", "cloudflare", "cerebras", "gemini"]
config_uppdaterad: "2026-07-08 05:43 UTC"
order_source: "provider_config"
providers_24h:
  sambanova:
    anrop: 33
    ok: 30
    rate_limits: 3
    errors: 0
    snitt_ms: 1782
  mistral:
    anrop: 716
    ok: 716
    rate_limits: 0
    errors: 0
    snitt_ms: 1181
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
    anrop: 28
    ok: 28
    rate_limits: 0
    errors: 0
    snitt_ms: 2371
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
  gemini:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-07-08

## Hälsostatus

🟢 **99.6%** lyckade anrop senaste 24h · 791 anrop totalt
🟢 **99.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 28 anrop · 28 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `sambanova` | 33 | 30 (90.9%) | 3 (9.1%) | 0 | 1782 ms | 100% ok · 950 ms |
| 🟢 `mistral` | 716 | 716 (100%) | 0 (0%) | 0 | 1181 ms | 100% ok · 1390 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2870 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3100 ms |
| 🟢 `groq` | 28 | 28 (100%) | 0 (0%) | 0 | 2371 ms | 100% ok · 620 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 90% ok · 10670 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`sambanova → mistral → deepseek → github_models → groq → cloudflare → cerebras → gemini`

*(Benchmark senast körde: 2026-07-08 05:43 UTC)*

## 7-Dagars Trend

```
  🟢 sambanova        90.9% ok   (33 anrop, 3 rl, 0 err)
  🟢 mistral          100% ok   (911 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (40 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 90% ok
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har **Mistral** dominerat med 716 anrop och 100 % framgång utan någon rate‑limit, men svarstiden ligger på 1 181 ms, vilket är betydligt snabbare än de andra leverantörerna. **Sambanova** har bara 33 anrop, men tre av dem drabbades av rate‑limits och den genomsnittliga svarstiden är 1 782 ms, vilket ger en lägre pålitlighet (90,9 % ok). **Groq** har levererat 28 anrop utan fel, men svarstiden är hög (2 371 ms) och den totala kvoten på ~144 k per konto innebär att ytterligare nycklar inte ger linjär kapacitetstillväxt. Inga andra leverantörer har anropats, så deras benchmark‑status är för närvarande irrelevant.

**Rekommendation (prioriterad):** Använd Mistral som huvud‑provider, håll Groq som sekundär backup för belastningstoppar, och övervaka Sambanova för att undvika rate‑limits; de övriga lever
