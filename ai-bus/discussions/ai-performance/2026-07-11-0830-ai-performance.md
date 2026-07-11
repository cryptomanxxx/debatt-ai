---
date: 2026-07-11
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 758
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["sambanova", "mistral", "deepseek", "github_models", "cloudflare", "groq", "cerebras", "gemini"]
config_uppdaterad: "2026-07-11 05:33 UTC"
order_source: "provider_config"
providers_24h:
  sambanova:
    anrop: 39
    ok: 39
    rate_limits: 0
    errors: 0
    snitt_ms: 1099
  mistral:
    anrop: 686
    ok: 686
    rate_limits: 0
    errors: 0
    snitt_ms: 1105
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
    anrop: 26
    ok: 26
    rate_limits: 0
    errors: 0
    snitt_ms: 2412
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

# AI Provider Performance — 2026-07-11

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 758 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 26 anrop · 26 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `sambanova` | 39 | 39 (100%) | 0 (0%) | 0 | 1099 ms | 100% ok · 1150 ms |
| 🟢 `mistral` | 686 | 686 (100%) | 0 (0%) | 0 | 1105 ms | 100% ok · 1210 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2510 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3460 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 6060 ms |
| 🟢 `groq` | 26 | 26 (100%) | 0 (0%) | 0 | 2412 ms | 100% ok · 660 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`sambanova → mistral → deepseek → github_models → cloudflare → groq → cerebras → gemini`

*(Benchmark senast körde: 2026-07-11 05:33 UTC)*

## 7-Dagars Trend

```
  🟢 sambanova        100% ok   (39 anrop, 0 rl, 0 err)
  🟢 mistral          100% ok   (912 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (40 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har alla aktiva leverantörer presterat utan problem; ingen har nått någon rate‑limit och hälsopoängen är 100 % både för 24 h och 7 dagar. Mistral dominerade med 686 anrop och en genomsnittlig svarstid på ca 1,1 s, följt av Sambanova (39 anrop, 1,1 s) och Groq (26 anrop, 2,4 s). De övriga leverantörerna (DeepSeek, GitHub‑models, Cloudflare, Cerebras och Gemini) har inte använts under perioden, men deras benchmark‑status visar också full funktionalitet. **Rekommendation:** fortsätt att prioritera Mistral och Sambanova för låg latens och hög tillförlitlighet, och minska Groq‑användningen tills dess svarstid förbättras eller tills TPD‑kvoten blir mer flexibel.
