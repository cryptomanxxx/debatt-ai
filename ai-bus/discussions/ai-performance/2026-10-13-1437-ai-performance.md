---
date: 2026-10-13
type: ai-performance
overall_health_24h: 98.4
overall_health_7d: 98.4
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["gemini", "mistral", "deepseek", "cloudflare", "groq"]
config_uppdaterad: "2026-10-13 09:48 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 33
    ok: 17
    rate_limits: 11
    errors: 5
    snitt_ms: 4134
  mistral:
    anrop: 927
    ok: 927
    rate_limits: 0
    errors: 0
    snitt_ms: 3229
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
    snitt_ms: 2478
---

# AI Provider Performance — 2026-10-13

## Hälsostatus

🟢 **98.4%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **98.4%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 22 anrop · 22 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `gemini` | 33 | 17 (51.5%) | 11 (33.3%) | 5 | 4134 ms | 100% ok · 960 ms |
| 🟢 `mistral` | 927 | 927 (100%) | 0 (0%) | 0 | 3229 ms | 100% ok · 1310 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2100 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3950 ms |
| 🟢 `groq` | 22 | 22 (100%) | 0 (0%) | 0 | 2478 ms | 100% ok · 660 ms |

## Nuvarande Fallback-ordning

`gemini → mistral → deepseek → cloudflare → groq`

*(Benchmark senast körde: 2026-10-13 09:48 UTC)*

## 7-Dagars Trend

```
  🟡 gemini           51.5% ok   (33 anrop, 11 rl, 5 err)
  🟢 mistral          100% ok   (927 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (22 anrop, 0 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 17/33 ok (51.5%), 11 rate-limits, 5 errors

## Analys

**AI-provider-prestanda senaste 24h:**
Gemini har låg tillgänglighet (51,5% OK, 33 anrop), medan Mistral och Groq presterar stabilt (100% OK). Deepseek och Cloudflare har ej anropats. Groq har hög kapacitet (22 anrop), men TPD-kvoten är kontospecifik. Mistral är den mest pålitliga, följt av Groq.

**Prioriterad rekommendation:** Prioritera Mistral för hög tillgänglighet och Groq för låg latens, men övervaka Gemini och justera fallback-ordningen.
