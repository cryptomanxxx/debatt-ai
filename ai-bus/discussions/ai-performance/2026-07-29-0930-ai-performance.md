---
date: 2026-07-29
type: ai-performance
overall_health_24h: 99.7
overall_health_7d: 99.8
total_calls_24h: 636
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["sambanova", "mistral", "deepseek", "github_models", "cloudflare", "groq", "cerebras", "gemini"]
config_uppdaterad: "2026-07-29 05:42 UTC"
order_source: "provider_config"
providers_24h:
  sambanova:
    anrop: 11
    ok: 9
    rate_limits: 2
    errors: 0
    snitt_ms: 1495
  mistral:
    anrop: 594
    ok: 594
    rate_limits: 0
    errors: 0
    snitt_ms: 1074
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
    snitt_ms: 2136
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

# AI Provider Performance — 2026-07-29

## Hälsostatus

🟢 **99.7%** lyckade anrop senaste 24h · 636 anrop totalt
🟢 **99.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 26 anrop · 26 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `sambanova` | 11 | 9 (81.8%) | 2 (18.2%) | 0 | 1495 ms | 100% ok · 1100 ms |
| 🟢 `mistral` | 594 | 594 (100%) | 0 (0%) | 0 | 1074 ms | 100% ok · 1110 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2510 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3040 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3590 ms |
| 🟢 `groq` | 26 | 26 (100%) | 0 (0%) | 0 | 2136 ms | 100% ok · 690 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`sambanova → mistral → deepseek → github_models → cloudflare → groq → cerebras → gemini`

*(Benchmark senast körde: 2026-07-29 05:42 UTC)*

## 7-Dagars Trend

```
  🟢 sambanova        83.3% ok   (12 anrop, 2 rl, 0 err)
  🟢 mistral          100% ok   (935 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (47 anrop, 0 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har plattformen hanterat 636 anrop med en hälsopoäng på 99,7 % (99,8 % på 7 dagar). Mistral dominerade trafiken med 594 anrop och 100 % lyckade svar utan någon rate‑limit, medan Groq levererade 26 anrop med en något högre svarstid (2 136 ms) men utan throttling. Sambanova visade sig vara den enda leverantören med rate‑limit‑problem (2 begränsningar) och en lägre framgångsgrad på 81,8 % samt längre svarstid (1 495 ms). Inga andra leverantörer användes under perioden, så deras benchmark‑status förblir obeaktad.

**Rekommendation:** Prioritera Mistral för primära arbetsbelastningar, behåll Groq som sekundär backup för redundans, och minska eller omfördela Sambanova‑trafiken tills rate‑limit‑problemen är lösta.
