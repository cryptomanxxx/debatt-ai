---
date: 2026-09-07
type: ai-performance
overall_health_24h: 99
overall_health_7d: 99
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["gemini", "mistral", "deepseek", "cloudflare", "groq"]
config_uppdaterad: "2026-09-07 07:36 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 29
    ok: 19
    rate_limits: 10
    errors: 0
    snitt_ms: 3047
  mistral:
    anrop: 897
    ok: 897
    rate_limits: 0
    errors: 0
    snitt_ms: 3908
  deepseek:
    anrop: 1
    ok: 1
    rate_limits: 0
    errors: 0
    snitt_ms: 348
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 45
    ok: 45
    rate_limits: 0
    errors: 0
    snitt_ms: 2124
---

# AI Provider Performance — 2026-09-07

## Hälsostatus

🟢 **99%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **99%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 45 anrop · 45 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `gemini` | 29 | 19 (65.5%) | 10 (34.5%) | 0 | 3047 ms | 100% ok · 930 ms |
| 🟢 `mistral` | 897 | 897 (100%) | 0 (0%) | 0 | 3908 ms | 100% ok · 1450 ms |
| 🟢 `deepseek` | 1 | 1 (100%) | 0 (0%) | 0 | 348 ms | 100% ok · 2500 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3890 ms |
| 🟢 `groq` | 45 | 45 (100%) | 0 (0%) | 0 | 2124 ms | 100% ok · 640 ms |

## Nuvarande Fallback-ordning

`gemini → mistral → deepseek → cloudflare → groq`

*(Benchmark senast körde: 2026-09-07 07:36 UTC)*

## 7-Dagars Trend

```
  🟡 gemini           65.5% ok   (29 anrop, 10 rl, 0 err)
  🟢 mistral          100% ok   (897 anrop, 0 rl, 0 err)
  🟢 deepseek         100% ok   (1 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (45 anrop, 0 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 19/29 ok (65.5%), 10 rate-limits, 0 errors

## Analys

**AI-providerprestanda senaste 24h:**
Gemini har låg tillgänglighet (65,5% OK, 10 rate-limits), medan Mistral och Groq visar stabilitet (100% OK). Deepseek och Cloudflare (ej anropade) är snabba men sparsamt använda. Groq har hög kapacitet, men kvotbegränsningar kan påverka skala. Mistral är för tillfället mest pålitlig, men gemini kräver åtgärd.

**Prioriterad rekommendation:** Prioritera Mistral för hög tillgänglighet och Groq för hastighet, men övervaka gemini och justera fallback-logik.
