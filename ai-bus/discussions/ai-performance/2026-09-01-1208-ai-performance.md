---
date: 2026-09-01
type: ai-performance
overall_health_24h: 95.4
overall_health_7d: 96.2
total_calls_24h: 815
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-09-01 08:02 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 622
    ok: 619
    rate_limits: 0
    errors: 3
    snitt_ms: 1107
  deepseek:
    anrop: 3
    ok: 3
    rate_limits: 0
    errors: 0
    snitt_ms: 3190
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 121
    ok: 111
    rate_limits: 10
    errors: 0
    snitt_ms: 915
  gemini:
    anrop: 45
    ok: 22
    rate_limits: 23
    errors: 0
    snitt_ms: 9487
---

# AI Provider Performance — 2026-09-01

## Hälsostatus

🟢 **95.4%** lyckade anrop senaste 24h · 815 anrop totalt
🟢 **96.2%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 121 anrop · 111 (91.7%) OK · 10 (8.3%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 622 | 619 (99.5%) | 0 (0%) | 3 | 1107 ms | 100% ok · 1340 ms |
| 🟢 `deepseek` | 3 | 3 (100%) | 0 (0%) | 0 | 3190 ms | 100% ok · 2670 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3690 ms |
| 🟢 `groq` | 121 | 111 (91.7%) | 10 (8.3%) | 0 | 915 ms | 100% ok · 720 ms |
| 🔴 `gemini` | 45 | 22 (48.9%) | 23 (51.1%) | 0 | 9487 ms | 100% ok · 990 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-09-01 08:02 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          99.6% ok   (771 anrop, 0 rl, 3 err)
  🟢 deepseek         100% ok   (3 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             92.7% ok   (137 anrop, 10 rl, 0 err)
  🟡 gemini           61.9% ok   (63 anrop, 24 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 22/45 ok (48.9%), 23 rate-limits, 0 errors

## Analys

**Senaste 24h:**
Mistral dominerade med 622 anrop (99,5% OK, 1,1 s svarstid), medan Groq upplevde 10 rate-limits (91,7% OK) och Gemini hade 48,9% OK (23 rate-limits). Deepseek och Cloudflare var sparsamt använda (3 och 0 anrop). Gemini är den mest problematiska leverantören, följt av Groq.

**Prioriterad rekommendation:** Prioritera Mistral för stabilitet och hastighet, och begränsa Gemini-användning tills dess prestanda förbättras.
