---
date: 2026-09-08
type: ai-performance
overall_health_24h: 95.8
overall_health_7d: 95.8
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-09-08 07:29 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 858
    ok: 858
    rate_limits: 0
    errors: 0
    snitt_ms: 4189
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
    anrop: 63
    ok: 59
    rate_limits: 4
    errors: 0
    snitt_ms: 1646
  gemini:
    anrop: 56
    ok: 19
    rate_limits: 34
    errors: 3
    snitt_ms: 10082
---

# AI Provider Performance — 2026-09-08

## Hälsostatus

🟢 **95.8%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **95.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 63 anrop · 59 (93.7%) OK · 4 (6.3%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 858 | 858 (100%) | 0 (0%) | 0 | 4189 ms | 100% ok · 1610 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2220 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4370 ms |
| 🟢 `groq` | 63 | 59 (93.7%) | 4 (6.3%) | 0 | 1646 ms | 100% ok · 630 ms |
| 🔴 `gemini` | 56 | 19 (33.9%) | 34 (60.7%) | 3 | 10082 ms | 100% ok · 1130 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-09-08 07:29 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (858 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             93.7% ok   (63 anrop, 4 rl, 0 err)
  🔴 gemini           33.9% ok   (56 anrop, 34 rl, 3 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 19/56 ok (33.9%), 34 rate-limits, 3 errors

## Analys

**AI-providerprestanda senaste 24h:**
Mistral och Groq dominerade med 858 respektive 63 anrop, båda med hög tillgänglighet (100% respektive 93,7% OK). Deepseek och Cloudflare användes ej, medan Google Gemini hade allvarliga problem (33,9% OK, 34 rate-limits). Groq:s TPD-kvoten kan begränsa kapacitet, och Gemini är prioriterat att ersättas.

**Prioriterad rekommendation:** Skala upp Groq-nycklar eller migrera till Mistral för stabilitet, medan Gemini-beroende reduceras.
