---
date: 2026-11-16
type: ai-performance
overall_health_24h: 67.7
overall_health_7d: 68
total_calls_24h: 948
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "deepseek"]
ranked_order: ["groq", "mistral", "cloudflare", "gemini", "deepseek"]
config_uppdaterad: "2026-11-16 10:14 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 295
    ok: 238
    rate_limits: 57
    errors: 0
    snitt_ms: 2423
  mistral:
    anrop: 263
    ok: 206
    rate_limits: 57
    errors: 0
    snitt_ms: 6243
  cloudflare:
    anrop: 208
    ok: 149
    rate_limits: 55
    errors: 4
    snitt_ms: 4185
  gemini:
    anrop: 123
    ok: 45
    rate_limits: 54
    errors: 24
    snitt_ms: 8339
  deepseek:
    anrop: 54
    ok: 0
    rate_limits: 0
    errors: 54
    snitt_ms: null
---

# AI Provider Performance — 2026-11-16

## Hälsostatus

🟡 **67.7%** lyckade anrop senaste 24h · 948 anrop totalt
🟡 **68%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 295 anrop · 238 (80.7%) OK · 57 (19.3%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 295 | 238 (80.7%) | 57 (19.3%) | 0 | 2423 ms | 100% ok · 740 ms |
| 🟡 `mistral` | 263 | 206 (78.3%) | 57 (21.7%) | 0 | 6243 ms | 20% ok · 1070 ms |
| 🟡 `cloudflare` | 208 | 149 (71.6%) | 55 (26.4%) | 4 | 4185 ms | 0% ok · 0 ms |
| 🔴 `gemini` | 123 | 45 (36.6%) | 54 (43.9%) | 24 | 8339 ms | 100% ok · 2210 ms |
| 🔴 `deepseek` | 54 | 0 (0%) | 0 (0%) | 54 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → mistral → cloudflare → gemini → deepseek`

*(Benchmark senast körde: 2026-11-16 10:14 UTC)*

## 7-Dagars Trend

```
  🟢 groq             81.8% ok   (325 anrop, 59 rl, 0 err)
  🟡 mistral          78.6% ok   (276 anrop, 59 rl, 0 err)
  🟡 cloudflare       71% ok   (210 anrop, 57 rl, 4 err)
  🔴 gemini           35.2% ok   (128 anrop, 56 rl, 27 err)
  🔴 deepseek         0% ok   (56 anrop, 0 rl, 56 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 45/123 ok (36.6%), 54 rate-limits, 24 errors
- **`deepseek`**: 0/54 ok (0%), 0 rate-limits, 54 errors

## Analys

Under de senaste 24 timmarna har Groq fortsatt att leverera den bästa prestandan med 80,7 % lyckade anrop (295 stycken) och en genomsnittlig svarstid på 2,4 s, men har redan nått sin TPD‑kvot på ca 144 k anrop per konto. Mistral ligger på 78,3 % lyckade anrop (263 stycken) med en högre svarstid (6,2 s), medan Cloudflare presterar något sämre (71,6 % av 208 anrop, 4,2 s). Gemini och Deepseek är kritiska problemområden: Gemini har endast 36,6 % lyckade anrop (123 stycken) och en mycket lång svarstid (8,3 s), och Deepseek har 0 % lyckade anrop (54 stycken). **Rekommendation:** prioritera att öka kapaciteten och övervaka kvoten för Groq, minska beroendet av Gemini och Deepseek genom att omfördela deras trafik till Mistral eller Cloudflare, och utvärdera eventuella alternativa leverantörer för att säkra redundans.
