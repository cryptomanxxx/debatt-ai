---
date: 2026-11-25
type: ai-performance
overall_health_24h: 41.1
overall_health_7d: 48.9
total_calls_24h: 763
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["mistral", "gemini", "deepseek"]
ranked_order: ["groq", "mistral", "gemini", "cloudflare", "deepseek"]
config_uppdaterad: "2026-11-25 11:48 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 116
    ok: 113
    rate_limits: 3
    errors: 0
    snitt_ms: 1165
  mistral:
    anrop: 382
    ok: 91
    rate_limits: 24
    errors: 267
    snitt_ms: 5696
  gemini:
    anrop: 81
    ok: 30
    rate_limits: 34
    errors: 17
    snitt_ms: 10250
  cloudflare:
    anrop: 144
    ok: 78
    rate_limits: 38
    errors: 28
    snitt_ms: 5408
  deepseek:
    anrop: 37
    ok: 0
    rate_limits: 0
    errors: 37
    snitt_ms: null
---

# AI Provider Performance — 2026-11-25

## Hälsostatus

🔴 **41.1%** lyckade anrop senaste 24h · 763 anrop totalt
🔴 **48.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 116 anrop · 113 (97.4%) OK · 3 (2.6%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 116 | 113 (97.4%) | 3 (2.6%) | 0 | 1165 ms | 100% ok · 670 ms |
| 🔴 `mistral` | 382 | 91 (23.8%) | 24 (6.3%) | 267 | 5696 ms | 0% ok · 0 ms |
| 🔴 `gemini` | 81 | 30 (37%) | 34 (42%) | 17 | 10250 ms | 70% ok · 1410 ms |
| 🟡 `cloudflare` | 144 | 78 (54.2%) | 38 (26.4%) | 28 | 5408 ms | 0% ok · 0 ms |
| 🔴 `deepseek` | 37 | 0 (0%) | 0 (0%) | 37 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → mistral → gemini → cloudflare → deepseek`

*(Benchmark senast körde: 2026-11-25 11:48 UTC)*

## 7-Dagars Trend

```
  🟢 groq             98.3% ok   (180 anrop, 3 rl, 0 err)
  🔴 mistral          32.4% ok   (448 anrop, 36 rl, 267 err)
  🔴 gemini           41% ok   (117 anrop, 40 rl, 29 err)
  🟡 cloudflare       57.3% ok   (206 anrop, 54 rl, 34 err)
  🔴 deepseek         0% ok   (46 anrop, 0 rl, 46 err)
```

## ⚠️ Problemleverantörer

- **`mistral`**: 91/382 ok (23.8%), 24 rate-limits, 267 errors
- **`gemini`**: 30/81 ok (37%), 34 rate-limits, 17 errors
- **`deepseek`**: 0/37 ok (0%), 0 rate-limits, 37 errors

## Analys

Under de senaste 24 timmarna har Groq fortsatt att leverera stabil prestanda med 97 % lyckade anrop (116 st) och en genomsnittlig svarstid på 1,2 s, medan Mistral och Gemini har drabbats av kraftiga problem – endast 24 % respektive 37 % av deras anrop lyckades och svarstiderna har skjutit upp till 5,7 s respektive 10,2 s. Cloudflare ligger mitt emellan med 54 % lyckade anrop (144 st) och en svarstid på 5,4 s, men Deepseek är helt otillgängligt (0 % ok). På grund av de återkommande rate‑limit‑händelserna och den låga tillgängligheten bör vi omedelbart prioritera att skifta trafik från Mistral och Gemini till Groq, och samtidigt börja utvärdera ett alternativt backup‑provider‑par (t.ex. en sekundär Groq‑nyckel eller en ny leverantör) för att minska beroendet av de problematiska tjänsterna.
