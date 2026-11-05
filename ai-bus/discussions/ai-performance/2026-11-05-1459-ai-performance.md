---
date: 2026-11-05
type: ai-performance
overall_health_24h: 95.3
overall_health_7d: 95.3
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "cloudflare", "groq", "gemini", "deepseek"]
config_uppdaterad: "2026-11-05 10:00 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 893
    ok: 891
    rate_limits: 0
    errors: 2
    snitt_ms: 3034
  cloudflare:
    anrop: 2
    ok: 2
    rate_limits: 0
    errors: 0
    snitt_ms: 21340
  groq:
    anrop: 25
    ok: 25
    rate_limits: 0
    errors: 0
    snitt_ms: 2275
  gemini:
    anrop: 68
    ok: 24
    rate_limits: 26
    errors: 18
    snitt_ms: 9028
  deepseek:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-11-05

## Hälsostatus

🟢 **95.3%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **95.3%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 25 anrop · 25 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 893 | 891 (99.8%) | 0 (0%) | 2 | 3034 ms | 100% ok · 1260 ms |
| 🟢 `cloudflare` | 2 | 2 (100%) | 0 (0%) | 0 | 21340 ms | 100% ok · 4260 ms |
| 🟢 `groq` | 25 | 25 (100%) | 0 (0%) | 0 | 2275 ms | 100% ok · 710 ms |
| 🔴 `gemini` | 68 | 24 (35.3%) | 26 (38.2%) | 18 | 9028 ms | 70% ok · 9080 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → cloudflare → groq → gemini → deepseek`

*(Benchmark senast körde: 2026-11-05 10:00 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          99.8% ok   (893 anrop, 0 rl, 2 err)
  🟢 cloudflare       100% ok   (2 anrop, 0 rl, 0 err)
  🟢 groq             100% ok   (25 anrop, 0 rl, 0 err)
  🔴 gemini           35.3% ok   (68 anrop, 26 rl, 18 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`gemini`**: 24/68 ok (35.3%), 26 rate-limits, 18 errors

## Analys

**AI-providerprestanda senaste 24h:**
Mistral och Groq levererade stabilt med 100% lyckade svar och låg latens, medan Cloudflare hanterade få anrop men med hög prestanda. Gemini drabbades av 26 rate-limits och låg tillgänglighet (35,3% ok), och DeepSeek användes inte alls. Groq har hög kapacitet (144k TPD-kvoter), men kvoten är kontospecifik, inte nyckelspecifik.

**Prioriterad rekommendation:** Prioritera Mistral och Groq för stabilitet och hastighet, och undvik Gemini under nuvarande belastning.
