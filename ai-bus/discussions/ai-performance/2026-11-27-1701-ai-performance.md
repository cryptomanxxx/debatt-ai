---
date: 2026-11-27
type: ai-performance
overall_health_24h: 15.5
overall_health_7d: 15.5
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "mistral", "deepseek"]
ranked_order: ["groq", "gemini", "cloudflare", "mistral", "deepseek"]
config_uppdaterad: "2026-11-27 11:31 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 63
    ok: 63
    rate_limits: 0
    errors: 0
    snitt_ms: 1274
  gemini:
    anrop: 51
    ok: 15
    rate_limits: 29
    errors: 7
    snitt_ms: 16614
  cloudflare:
    anrop: 114
    ok: 75
    rate_limits: 22
    errors: 17
    snitt_ms: 8801
  mistral:
    anrop: 734
    ok: 0
    rate_limits: 0
    errors: 734
    snitt_ms: null
  deepseek:
    anrop: 28
    ok: 0
    rate_limits: 0
    errors: 28
    snitt_ms: null
---

# AI Provider Performance — 2026-11-27

## Hälsostatus

🔴 **15.5%** lyckade anrop senaste 24h · 1000 anrop totalt
🔴 **15.5%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 63 anrop · 63 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 63 | 63 (100%) | 0 (0%) | 0 | 1274 ms | 100% ok · 670 ms |
| 🔴 `gemini` | 51 | 15 (29.4%) | 29 (56.9%) | 7 | 16614 ms | 100% ok · 910 ms |
| 🟡 `cloudflare` | 114 | 75 (65.8%) | 22 (19.3%) | 17 | 8801 ms | 100% ok · 7770 ms |
| 🔴 `mistral` | 734 | 0 (0%) | 0 (0%) | 734 | – | 0% ok · 0 ms |
| 🔴 `deepseek` | 28 | 0 (0%) | 0 (0%) | 28 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → gemini → cloudflare → mistral → deepseek`

*(Benchmark senast körde: 2026-11-27 11:31 UTC)*

## 7-Dagars Trend

```
  🟢 groq             100% ok   (63 anrop, 0 rl, 0 err)
  🔴 gemini           29.4% ok   (51 anrop, 29 rl, 7 err)
  🟡 cloudflare       65.8% ok   (114 anrop, 22 rl, 17 err)
  🔴 mistral          0% ok   (734 anrop, 0 rl, 734 err)
  🔴 deepseek         0% ok   (28 anrop, 0 rl, 28 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 15/51 ok (29.4%), 29 rate-limits, 7 errors
- **`mistral`**: 0/734 ok (0%), 0 rate-limits, 734 errors
- **`deepseek`**: 0/28 ok (0%), 0 rate-limits, 28 errors

## Analys

Under de senaste 24 timmarna har Groq presterat stabilt med 63 anrop och 100 % framgång utan någon rate‑limit, men svarstiden ligger på 1 274 ms. Gemini har däremot stora problem: endast 29,4 % av 51 anrop lyckades, 29 av dem träffade rate‑limit och medelresponsen är 16 614 ms. Cloudflare ligger mitt emellan med 65,8 % lyckade anrop av 114, men 22 rate‑limits och en svarstid på 8 801 ms. Både Mistral och Deepseek har ingen funktionell kapacitet (0 % ok) och bör undvikas helt tills de återställs.

**Rekommendation (prioriterad):** 1️⃣ Fortsätt använda Groq som primär leverantör. 2️⃣ Använd Cloudflare som sekundär fallback. 3️⃣ Inaktivera Gemini, Mistral och Deepseek tills deras tillgänglighet och svarstider förbättras.
