---
date: 2026-09-14
type: ai-performance
overall_health_24h: 99.4
overall_health_7d: 99.5
total_calls_24h: 878
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["gemini", "mistral", "deepseek", "cloudflare", "groq"]
config_uppdaterad: "2026-09-14 08:10 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 30
    ok: 25
    rate_limits: 5
    errors: 0
    snitt_ms: 6637
  mistral:
    anrop: 822
    ok: 822
    rate_limits: 0
    errors: 0
    snitt_ms: 4046
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
    anrop: 21
    ok: 21
    rate_limits: 0
    errors: 0
    snitt_ms: 2158
---

# AI Provider Performance — 2026-09-14

## Hälsostatus

🟢 **99.4%** lyckade anrop senaste 24h · 878 anrop totalt
🟢 **99.5%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 21 anrop · 21 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `gemini` | 30 | 25 (83.3%) | 5 (16.7%) | 0 | 6637 ms | 100% ok · 910 ms |
| 🟢 `mistral` | 822 | 822 (100%) | 0 (0%) | 0 | 4046 ms | 100% ok · 1680 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 1970 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4140 ms |
| 🟢 `groq` | 21 | 21 (100%) | 0 (0%) | 0 | 2158 ms | 100% ok · 660 ms |

## Nuvarande Fallback-ordning

`gemini → mistral → deepseek → cloudflare → groq`

*(Benchmark senast körde: 2026-09-14 08:10 UTC)*

## 7-Dagars Trend

```
  🟢 gemini           83.3% ok   (30 anrop, 5 rl, 0 err)
  🟢 mistral          100% ok   (934 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (28 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**AI-providerprestanda senaste 24h:**
Mistral har dominerat med 822 anrop (100% lyckade), medan Groq hanterade 21 anrop utan fel. Gemini hade 5 rate-limits (83.3% lyckade), och Deepseek samt Cloudflare användes ej. Groq-kvoten är troligen kontospecifik, inte nyckelspecifik, vilket kan begränsa kapacitet. Mistral är den mest pålitliga, följt av Groq.

**Prioriterad rekommendation:** Fokusera på Mistral för hög tillgänglighet, men övervaka Groqs TPD-kvot.
