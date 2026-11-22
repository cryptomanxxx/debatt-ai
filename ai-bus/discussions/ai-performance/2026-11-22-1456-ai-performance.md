---
date: 2026-11-22
type: ai-performance
overall_health_24h: 67.7
overall_health_7d: 66.4
total_calls_24h: 486
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "deepseek"]
ranked_order: ["groq", "cloudflare", "mistral", "gemini", "deepseek"]
config_uppdaterad: "2026-11-22 10:25 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 63
    ok: 63
    rate_limits: 0
    errors: 0
    snitt_ms: 1273
  cloudflare:
    anrop: 194
    ok: 129
    rate_limits: 20
    errors: 45
    snitt_ms: 3922
  mistral:
    anrop: 127
    ok: 100
    rate_limits: 27
    errors: 0
    snitt_ms: 5136
  gemini:
    anrop: 72
    ok: 33
    rate_limits: 22
    errors: 17
    snitt_ms: 18550
  deepseek:
    anrop: 24
    ok: 0
    rate_limits: 0
    errors: 24
    snitt_ms: null
---

# AI Provider Performance — 2026-11-22

## Hälsostatus

🟡 **67.7%** lyckade anrop senaste 24h · 486 anrop totalt
🟡 **66.4%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 63 anrop · 63 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 63 | 63 (100%) | 0 (0%) | 0 | 1273 ms | 100% ok · 640 ms |
| 🟡 `cloudflare` | 194 | 129 (66.5%) | 20 (10.3%) | 45 | 3922 ms | 100% ok · 3360 ms |
| 🟡 `mistral` | 127 | 100 (78.7%) | 27 (21.3%) | 0 | 5136 ms | 20% ok · 990 ms |
| 🔴 `gemini` | 72 | 33 (45.8%) | 22 (30.6%) | 17 | 18550 ms | 90% ok · 1830 ms |
| 🔴 `deepseek` | 24 | 0 (0%) | 0 (0%) | 24 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → cloudflare → mistral → gemini → deepseek`

*(Benchmark senast körde: 2026-11-22 10:25 UTC)*

## 7-Dagars Trend

```
  🟢 groq             100% ok   (178 anrop, 0 rl, 0 err)
  🟡 cloudflare       62.9% ok   (278 anrop, 49 rl, 54 err)
  🟡 mistral          72.8% ok   (309 anrop, 59 rl, 25 err)
  🔴 gemini           45.1% ok   (164 anrop, 53 rl, 37 err)
  🔴 deepseek         0% ok   (53 anrop, 0 rl, 53 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 33/72 ok (45.8%), 22 rate-limits, 17 errors
- **`deepseek`**: 0/24 ok (0%), 0 rate-limits, 24 errors

## Analys

Under de senaste 24 timmarna har Groq levererat stabil prestanda med 63 anrop och 100 % lyckade svar utan någon rate‑limit, men svarstiden är relativt hög (≈1,3 s). Cloudflare och Mistral visar betydande problem: Cloudflare har bara 66,5 % lyckade anrop och 20 rate‑limits (≈3,9 s svarstid), medan Mistral ligger på 78,7 % lyckade anrop med 27 rate‑limits (≈5,1 s). Gemini är kritisk med endast 45,8 % lyckade anrop och 22 rate‑limits samt mycket lång svarstid (≈18,5 s), och Deepseek har helt misslyckats (0 % lyckade anrop). **Rekommendation:** prioritera Groq som primär leverantör, flytta Cloudflare‑ och Mistral‑trafik till Groq så långt kvoten tillåter, och avaktivera Gemini samt Deepseek tills deras problem är lösta.
