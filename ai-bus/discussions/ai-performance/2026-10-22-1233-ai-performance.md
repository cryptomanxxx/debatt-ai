---
date: 2026-10-22
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "gemini", "cloudflare", "groq"]
config_uppdaterad: "2026-10-22 08:02 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 961
    ok: 961
    rate_limits: 0
    errors: 0
    snitt_ms: 3716
  deepseek:
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
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 27
    ok: 27
    rate_limits: 0
    errors: 0
    snitt_ms: 2033
---

# AI Provider Performance — 2026-10-22

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 27 anrop · 27 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 961 | 961 (100%) | 0 (0%) | 0 | 3716 ms | 100% ok · 1440 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2770 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3170 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4040 ms |
| 🟢 `groq` | 27 | 27 (100%) | 0 (0%) | 0 | 2033 ms | 100% ok · 690 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → gemini → cloudflare → groq`

*(Benchmark senast körde: 2026-10-22 08:02 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (961 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (27 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**AI-providerprestanda senaste 24h:**
Mistral dominerade med 961 anrop (100% OK, 3716 ms), medan DeepSeek, Gemini och Cloudflare inte användes. Groq fick 27 anrop (100% OK, 2033 ms), men TPD-kvoten (144k) verkar gälla per konto, inte per nyckel. Inga problemleverantörer identifierades.

**Prioriterad rekommendation:** Fokusera på Mistral för hög prestanda och låg latens, medan Groq kan vara ett bra val för högkapacitetsbehov om kvotbegränsningar hanteras.
