---
date: 2026-08-07
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 569
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "sambanova", "deepseek", "cloudflare", "groq", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-07 04:47 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 537
    ok: 537
    rate_limits: 0
    errors: 0
    snitt_ms: 1029
  sambanova:
    anrop: 3
    ok: 3
    rate_limits: 0
    errors: 0
    snitt_ms: 3363
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
    anrop: 22
    ok: 22
    rate_limits: 0
    errors: 0
    snitt_ms: 2089
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

# AI Provider Performance — 2026-08-07

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 569 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 22 anrop · 22 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 537 | 537 (100%) | 0 (0%) | 0 | 1029 ms | 100% ok · 1060 ms |
| 🟢 `sambanova` | 3 | 3 (100%) | 0 (0%) | 0 | 3363 ms | 100% ok · 1890 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2860 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3230 ms |
| 🟢 `groq` | 22 | 22 (100%) | 0 (0%) | 0 | 2089 ms | 100% ok · 610 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → sambanova → deepseek → cloudflare → groq → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-07 04:47 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (950 anrop, 0 rl, 0 err)
  🟢 sambanova        100% ok   (3 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (39 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har **Mistral** fortsatt att vara den dominerande leverantören med 537 anrop och en genomsnittlig svarstid på 1 029 ms utan några rate‑limits. **Sambanova** har bara använts i 3 anrop, men svarstiden är betydligt högre (3 363 ms), vilket kan bli en flaskhals om trafiken ökar. **Groq** har hanterat 22 anrop med en medel‑latens på 2 089 ms och inga begränsningar, men den totala kapaciteten är begränsad av en TPD‑kvot på ca 144 k per konto. Inga andra leverantörer har använts och inga problem har rapporterats (>30 % rl eller <50 % ok).

**Rekommendation (prioriterad):** behåll Mistral som primär leverantör, utöka Sambanova‑användning endast om den högre latensen kan tolereras, och håll Groq som sekundär
