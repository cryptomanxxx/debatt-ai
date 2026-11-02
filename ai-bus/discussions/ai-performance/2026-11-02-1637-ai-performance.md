---
date: 2026-11-02
type: ai-performance
overall_health_24h: 86.4
overall_health_7d: 88.1
total_calls_24h: 762
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "deepseek"]
ranked_order: ["mistral", "cloudflare", "groq", "gemini", "deepseek"]
config_uppdaterad: "2026-11-02 10:08 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 529
    ok: 529
    rate_limits: 0
    errors: 0
    snitt_ms: 3841
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 145
    ok: 109
    rate_limits: 36
    errors: 0
    snitt_ms: 3430
  gemini:
    anrop: 67
    ok: 14
    rate_limits: 30
    errors: 23
    snitt_ms: 9548
  deepseek:
    anrop: 14
    ok: 0
    rate_limits: 0
    errors: 14
    snitt_ms: null
---

# AI Provider Performance — 2026-11-02

## Hälsostatus

🟢 **86.4%** lyckade anrop senaste 24h · 762 anrop totalt
🟢 **88.1%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 145 anrop · 109 (75.2%) OK · 36 (24.8%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 529 | 529 (100%) | 0 (0%) | 0 | 3841 ms | 100% ok · 1990 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4380 ms |
| 🟡 `groq` | 145 | 109 (75.2%) | 36 (24.8%) | 0 | 3430 ms | 100% ok · 700 ms |
| 🔴 `gemini` | 67 | 14 (20.9%) | 30 (44.8%) | 23 | 9548 ms | 100% ok · 1260 ms |
| 🔴 `deepseek` | 14 | 0 (0%) | 0 (0%) | 14 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → cloudflare → groq → gemini → deepseek`

*(Benchmark senast körde: 2026-11-02 10:08 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (732 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟡 groq             74.1% ok   (166 anrop, 43 rl, 0 err)
  🔴 gemini           25.6% ok   (78 anrop, 35 rl, 23 err)
  🔴 deepseek         0% ok   (17 anrop, 0 rl, 17 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 14/67 ok (20.9%), 30 rate-limits, 23 errors
- **`deepseek`**: 0/14 ok (0%), 0 rate-limits, 14 errors

## Analys

**AI-provider-prestanda senaste 24h:**
Mistral dominerade med 529 anrop (100% ok, 3,8 sekunder), medan Groq hade 145 anrop (75,2% ok, 36 begränsningar). Gemini och DeepSeek presterade sämre: Gemini fick 20,9% ok (30 begränsningar), DeepSeek misslyckades helt (0% ok). Cloudflare användes inte. **Prioritera Mistral för stabilitet, Groq för hastighet (med begränsade kvoter), undvik DeepSeek och Gemini för tillfället.**
