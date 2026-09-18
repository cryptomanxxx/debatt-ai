---
date: 2026-09-18
type: ai-performance
overall_health_24h: 94.3
overall_health_7d: 94.3
total_calls_24h: 922
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-09-18 07:40 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 134
    ok: 134
    rate_limits: 0
    errors: 0
    snitt_ms: 5635
  deepseek:
    anrop: 690
    ok: 690
    rate_limits: 0
    errors: 0
    snitt_ms: 3655
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 16
    ok: 16
    rate_limits: 0
    errors: 0
    snitt_ms: 2775
  gemini:
    anrop: 66
    ok: 14
    rate_limits: 34
    errors: 18
    snitt_ms: 14150
---

# AI Provider Performance — 2026-09-18

## Hälsostatus

🟢 **94.3%** lyckade anrop senaste 24h · 922 anrop totalt
🟢 **94.3%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 16 anrop · 16 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 134 | 134 (100%) | 0 (0%) | 0 | 5635 ms | 100% ok · 1280 ms |
| 🟢 `deepseek` | 690 | 690 (100%) | 0 (0%) | 0 | 3655 ms | 100% ok · 1910 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3420 ms |
| 🟢 `groq` | 16 | 16 (100%) | 0 (0%) | 0 | 2775 ms | 100% ok · 630 ms |
| 🔴 `gemini` | 66 | 14 (21.2%) | 34 (51.5%) | 18 | 14150 ms | 100% ok · 910 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-09-18 07:40 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (136 anrop, 0 rl, 0 err)
  🟢 deepseek         100% ok   (757 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (17 anrop, 0 rl, 0 err)
  🔴 gemini           22.2% ok   (72 anrop, 37 rl, 19 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 14/66 ok (21.2%), 34 rate-limits, 18 errors

## Analys

**AI-providerprestanda senaste 24h:**
Mistral och DeepSeek presterade perfekt med 100% lyckade anrop och låg latens, medan Groq hanterade få anrop men utan problem. Gemini hade allvarliga problem med 21,2% lyckade svar och 34 rate-limits, vilket gör den olämplig för kritiska applikationer. Cloudflare användes inte alls.

**Prioriterad rekommendation:** Prioritera Mistral och DeepSeek för stabilitet, och begränsa Gemini till icke-kritiska uppgifter tills dess prestanda förbättras.
