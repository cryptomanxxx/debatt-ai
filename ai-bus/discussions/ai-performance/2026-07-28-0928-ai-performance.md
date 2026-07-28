---
date: 2026-07-28
type: ai-performance
overall_health_24h: 100
overall_health_7d: 99.9
total_calls_24h: 613
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "github_models", "cloudflare", "groq", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-07-28 05:38 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 574
    ok: 574
    rate_limits: 0
    errors: 0
    snitt_ms: 1023
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
    anrop: 28
    ok: 28
    rate_limits: 0
    errors: 0
    snitt_ms: 2374
  sambanova:
    anrop: 4
    ok: 4
    rate_limits: 0
    errors: 0
    snitt_ms: 2891
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

# AI Provider Performance — 2026-07-28

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 613 anrop totalt
🟢 **99.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 28 anrop · 28 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 574 | 574 (100%) | 0 (0%) | 0 | 1023 ms | 100% ok · 1080 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2320 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3040 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3660 ms |
| 🟢 `groq` | 28 | 28 (100%) | 0 (0%) | 0 | 2374 ms | 100% ok · 700 ms |
| 🟢 `sambanova` | 4 | 4 (100%) | 0 (0%) | 0 | 2891 ms | 50% ok · 3210 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → cloudflare → groq → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-07-28 05:38 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (940 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (43 anrop, 0 rl, 0 err)
  🟢 sambanova        80% ok   (5 anrop, 1 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har **Mistral** dominerat med 574 anrop och en genomsnittlig svarstid på 1 023 ms utan några rate‑limits. **Groq** har hanterat 28 anrop med 2 374 ms svarstid, medan **Sambanova** endast har 4 anrop men den högsta svarstiden på 2 891 ms. Inga andra leverantörer har använts, men deras benchmark‑status visar 100 % funktionalitet för Deepseek, GitHub‑models och Cloudflare. **Rekommendation (prioriterad):** behåll Mistral som huvudprovider, inför en sekundär fallback till Groq för att sprida belastning och minska svarstider, och håll ett öga på Sambanova‑latency för eventuella optimeringar.
