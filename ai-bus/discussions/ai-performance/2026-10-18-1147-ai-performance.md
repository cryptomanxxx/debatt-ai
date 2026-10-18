---
date: 2026-10-18
type: ai-performance
overall_health_24h: 94.8
overall_health_7d: 94.7
total_calls_24h: 995
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-10-18 07:29 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 887
    ok: 887
    rate_limits: 0
    errors: 0
    snitt_ms: 3359
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
    snitt_ms: 1750
  gemini:
    anrop: 73
    ok: 22
    rate_limits: 40
    errors: 11
    snitt_ms: 2795
---

# AI Provider Performance — 2026-10-18

## Hälsostatus

🟢 **94.8%** lyckade anrop senaste 24h · 995 anrop totalt
🟢 **94.7%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 21 anrop · 21 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 887 | 887 (100%) | 0 (0%) | 0 | 3359 ms | 100% ok · 1270 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 1980 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3010 ms |
| 🟢 `groq` | 21 | 21 (100%) | 0 (0%) | 0 | 1750 ms | 100% ok · 640 ms |
| 🔴 `gemini` | 73 | 22 (30.1%) | 40 (54.8%) | 11 | 2795 ms | 100% ok · 8810 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-10-18 07:29 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (891 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (21 anrop, 0 rl, 0 err)
  🔴 gemini           29.7% ok   (74 anrop, 41 rl, 11 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 22/73 ok (30.1%), 40 rate-limits, 11 errors

## Analys

**AI-providerprestanda senaste 24h:**
Mistral och Groq utmärkte sig med 100% tillgänglighet och snabba svarstider (3359 ms och 1750 ms), medan Deepseek och Cloudflare inte användes. Gemini hade 30.1% fel och 40 rate-limits, vilket är kritiskt. Groq är stabil med 9 nycklar, men TPD-kvoten (144k) troligen per konto, inte per nyckel.

**Prioriterad rekommendation:** Överväg att minska Gemini-användning eller justera fallback-ordningen till mistral → deepseek → groq → cloudflare → gemini för att undvika pålitlighetsproblem.
