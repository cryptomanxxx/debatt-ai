---
date: 2026-11-21
type: ai-performance
overall_health_24h: 61.3
overall_health_7d: 66.8
total_calls_24h: 431
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "cloudflare", "deepseek"]
ranked_order: ["groq", "mistral", "gemini", "cloudflare", "deepseek"]
config_uppdaterad: "2026-11-21 10:19 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 70
    ok: 70
    rate_limits: 0
    errors: 0
    snitt_ms: 1386
  mistral:
    anrop: 158
    ok: 104
    rate_limits: 29
    errors: 25
    snitt_ms: 5667
  gemini:
    anrop: 84
    ok: 37
    rate_limits: 27
    errors: 20
    snitt_ms: 16973
  cloudflare:
    anrop: 81
    ok: 46
    rate_limits: 26
    errors: 9
    snitt_ms: 13474
  deepseek:
    anrop: 26
    ok: 0
    rate_limits: 0
    errors: 26
    snitt_ms: null
---

# AI Provider Performance — 2026-11-21

## Hälsostatus

🟡 **61.3%** lyckade anrop senaste 24h · 431 anrop totalt
🟡 **66.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 70 anrop · 70 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 70 | 70 (100%) | 0 (0%) | 0 | 1386 ms | 100% ok · 650 ms |
| 🟡 `mistral` | 158 | 104 (65.8%) | 29 (18.4%) | 25 | 5667 ms | 40% ok · 990 ms |
| 🔴 `gemini` | 84 | 37 (44%) | 27 (32.1%) | 20 | 16973 ms | 100% ok · 1080 ms |
| 🟡 `cloudflare` | 81 | 46 (56.8%) | 26 (32.1%) | 9 | 13474 ms | 0% ok · 0 ms |
| 🔴 `deepseek` | 26 | 0 (0%) | 0 (0%) | 26 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → mistral → gemini → cloudflare → deepseek`

*(Benchmark senast körde: 2026-11-21 10:19 UTC)*

## 7-Dagars Trend

```
  🟢 groq             100% ok   (200 anrop, 0 rl, 0 err)
  🟡 mistral          73.8% ok   (351 anrop, 67 rl, 25 err)
  🔴 gemini           48.4% ok   (188 anrop, 59 rl, 38 err)
  🟡 cloudflare       56.6% ok   (173 anrop, 57 rl, 18 err)
  🔴 deepseek         0% ok   (58 anrop, 0 rl, 58 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 37/84 ok (44%), 27 rate-limits, 20 errors
- **`cloudflare`**: 46/81 ok (56.8%), 26 rate-limits, 9 errors
- **`deepseek`**: 0/26 ok (0%), 0 rate-limits, 26 errors

## Analys

Under de senaste 24 timmarna har Groq presterat stabilt med 70 anrop och 100 % framgång utan några rate‑limits (genomsnittlig svarstid 1,386 ms). Mistral visar en nedgång med endast 65,8 % lyckade anrop och 29 rate‑limits, samtidigt som svarstiden har ökat till 5,667 ms. Gemini och Cloudflare är de mest problematiska leverantörerna – respektive 44 % och 56,8 % lyckade anrop med många rate‑limits och svarstider över 13 sekunder, medan Deepseek helt misslyckades (0 % ok). **Rekommendation:** prioritera Groq som primär provider, flytta så mycket trafik som möjligt från Gemini och Cloudflare till Mistral (med övervakning) och avveckla Deepseek tills dess prestanda förbättras.
