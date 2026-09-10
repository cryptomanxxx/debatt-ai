---
date: 2026-09-10
type: ai-performance
overall_health_24h: 96
overall_health_7d: 96
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-09-10 07:33 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 895
    ok: 895
    rate_limits: 0
    errors: 0
    snitt_ms: 5715
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
    snitt_ms: 2543
  gemini:
    anrop: 62
    ok: 23
    rate_limits: 39
    errors: 0
    snitt_ms: 16586
---

# AI Provider Performance — 2026-09-10

## Hälsostatus

🟢 **96%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **96%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 22 anrop · 22 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 895 | 895 (100%) | 0 (0%) | 0 | 5715 ms | 100% ok · 1230 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2020 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 5020 ms |
| 🟢 `groq` | 22 | 22 (100%) | 0 (0%) | 0 | 2543 ms | 100% ok · 720 ms |
| 🔴 `gemini` | 62 | 23 (37.1%) | 39 (62.9%) | 0 | 16586 ms | 100% ok · 930 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-09-10 07:33 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (895 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (22 anrop, 0 rl, 0 err)
  🔴 gemini           37.1% ok   (62 anrop, 39 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 23/62 ok (37.1%), 39 rate-limits, 0 errors

## Analys

**AI-provider-prestanda senaste 24h:**
Mistral och Groq presterade utmärkt med 100% lyckade anrop och låg latens, medan Gemini hade 37% felaktiga svar och 39 rate-limits. Deepseek och Cloudflare användes ej, men har tidigare visat 100% tillgänglighet. Groq-kvoten är kontospecifik, inte nyckelspecifik, så kapacitet kan vara begränsad.

**Prioriterad rekommendation:** Prioritera Mistral och Groq för stabilitet, överväg fallbacks till Deepseek om Groq-kvoten är nära gränsen. Undvik Gemini vid hög belastning.
