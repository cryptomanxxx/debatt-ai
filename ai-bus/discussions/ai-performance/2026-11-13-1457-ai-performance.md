---
date: 2026-11-13
type: ai-performance
overall_health_24h: 71.7
overall_health_7d: 67.4
total_calls_24h: 822
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "deepseek"]
ranked_order: ["groq", "mistral", "gemini", "cloudflare", "deepseek"]
config_uppdaterad: "2026-11-13 10:10 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 242
    ok: 197
    rate_limits: 45
    errors: 0
    snitt_ms: 1906
  mistral:
    anrop: 209
    ok: 162
    rate_limits: 43
    errors: 4
    snitt_ms: 6017
  gemini:
    anrop: 88
    ok: 26
    rate_limits: 52
    errors: 10
    snitt_ms: 13664
  cloudflare:
    anrop: 211
    ok: 176
    rate_limits: 27
    errors: 8
    snitt_ms: 4679
  deepseek:
    anrop: 32
    ok: 0
    rate_limits: 0
    errors: 32
    snitt_ms: null
---

# AI Provider Performance — 2026-11-13

## Hälsostatus

🟡 **71.7%** lyckade anrop senaste 24h · 822 anrop totalt
🟡 **67.4%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 242 anrop · 197 (81.4%) OK · 45 (18.6%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 242 | 197 (81.4%) | 45 (18.6%) | 0 | 1906 ms | 100% ok · 690 ms |
| 🟡 `mistral` | 209 | 162 (77.5%) | 43 (20.6%) | 4 | 6017 ms | 20% ok · 1030 ms |
| 🔴 `gemini` | 88 | 26 (29.5%) | 52 (59.1%) | 10 | 13664 ms | 100% ok · 3410 ms |
| 🟢 `cloudflare` | 211 | 176 (83.4%) | 27 (12.8%) | 8 | 4679 ms | 100% ok · 6790 ms |
| 🔴 `deepseek` | 32 | 0 (0%) | 0 (0%) | 32 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → mistral → gemini → cloudflare → deepseek`

*(Benchmark senast körde: 2026-11-13 10:10 UTC)*

## 7-Dagars Trend

```
  🟡 groq             77.9% ok   (281 anrop, 62 rl, 0 err)
  🟡 mistral          76.4% ok   (280 anrop, 62 rl, 4 err)
  🔴 gemini           28.9% ok   (114 anrop, 69 rl, 12 err)
  🟡 cloudflare       77.2% ok   (228 anrop, 44 rl, 8 err)
  🔴 deepseek         0% ok   (50 anrop, 0 rl, 50 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 26/88 ok (29.5%), 52 rate-limits, 10 errors
- **`deepseek`**: 0/32 ok (0%), 0 rate-limits, 32 errors

## Analys

Under de senaste 24 timmarna har Groq fortsatt att leverera den bästa balansen mellan svarskvalitet och svarstid (81 % lyckade anrop, genomsnittlig latens 1 900 ms) och har dessutom den största volymen med 242 anrop. Cloudflare ligger på andra plats med 83 % lyckade anrop och relativt låg latens (4 680 ms), medan Mistral presterar acceptabelt men har en högre svarstid (6 000 ms) och en lägre framgångsgrad (77 %). Gemini och Deepseek är kritiska problemkällor – Gemini klarar endast 30 % av anropen och har extremt hög latens (13 600 ms), och Deepseek misslyckas helt (0 %). **Rekommendation:** prioritera Groq som huvud‑provider, håll Cloudflare som sekundär fallback, minska beroendet av Gemini och avbryt Deepseek tills problemen är lösta.
