---
date: 2026-08-14
type: ai-performance
overall_health_24h: 99.8
overall_health_7d: 99.7
total_calls_24h: 608
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "sambanova", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-14 04:41 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 555
    ok: 555
    rate_limits: 0
    errors: 0
    snitt_ms: 1213
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
    anrop: 43
    ok: 43
    rate_limits: 0
    errors: 0
    snitt_ms: 2114
  sambanova:
    anrop: 1
    ok: 0
    rate_limits: 1
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

# AI Provider Performance — 2026-08-14

## Hälsostatus

🟢 **99.8%** lyckade anrop senaste 24h · 608 anrop totalt
🟢 **99.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 43 anrop · 43 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 555 | 555 (100%) | 0 (0%) | 0 | 1213 ms | 100% ok · 1210 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2690 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3300 ms |
| 🟢 `groq` | 43 | 43 (100%) | 0 (0%) | 0 | 2114 ms | 100% ok · 680 ms |
| 🔴 `sambanova` | 1 | 0 (0%) | 1 (100%) | 0 | – | 0% ok · 0 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → sambanova → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-14 04:41 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (908 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (73 anrop, 0 rl, 0 err)
  🔴 sambanova        25% ok   (4 anrop, 3 rl, 0 err)
  🟢 cerebras         100% ok   (1 anrop, 0 rl, 0 err)
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen haft en hälsopoäng på 99,8 % och hanterat 608 anrop utan kritiska fel. Mistral dominerade med 555 anrop och levererade 100 % framgångsrika svar med en genomsnittlig svarstid på 1,213 ms, medan Groq hanterade 43 anrop men med längre svarstid (2,114 ms) och inga rate‑limits. Sambanova misslyckades med sitt enda anrop och drabbades av en rate‑limit, och de övriga leverantörerna (deepseek, Cloudflare, Cerebras, GitHub‑models och Gemini) har ännu inte använts. **Rekommendation (prioriterad):** fortsätt primärt att använda Mistral, håll Groq som sekundär fallback men observera latensen, och aktivera Deepseek som nästa fallback för att minska beroendet av den nu rate‑begränsade Sambanova‑nyckeln.
