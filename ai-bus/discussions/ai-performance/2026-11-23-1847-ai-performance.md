---
date: 2026-11-23
type: ai-performance
overall_health_24h: 70
overall_health_7d: 67.2
total_calls_24h: 440
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["deepseek"]
ranked_order: ["groq", "cloudflare", "mistral", "gemini", "deepseek"]
config_uppdaterad: "2026-11-23 11:24 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 83
    ok: 83
    rate_limits: 0
    errors: 0
    snitt_ms: 1209
  cloudflare:
    anrop: 171
    ok: 108
    rate_limits: 26
    errors: 37
    snitt_ms: 3917
  mistral:
    anrop: 102
    ok: 83
    rate_limits: 19
    errors: 0
    snitt_ms: 5459
  gemini:
    anrop: 64
    ok: 32
    rate_limits: 15
    errors: 17
    snitt_ms: 17922
  deepseek:
    anrop: 17
    ok: 0
    rate_limits: 0
    errors: 17
    snitt_ms: null
---

# AI Provider Performance — 2026-11-23

## Hälsostatus

🟡 **70%** lyckade anrop senaste 24h · 440 anrop totalt
🟡 **67.2%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 83 anrop · 83 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 83 | 83 (100%) | 0 (0%) | 0 | 1209 ms | 100% ok · 640 ms |
| 🟡 `cloudflare` | 171 | 108 (63.2%) | 26 (15.2%) | 37 | 3917 ms | 100% ok · 2950 ms |
| 🟢 `mistral` | 102 | 83 (81.4%) | 19 (18.6%) | 0 | 5459 ms | 30% ok · 1000 ms |
| 🟡 `gemini` | 64 | 32 (50%) | 15 (23.4%) | 17 | 17922 ms | 100% ok · 1300 ms |
| 🔴 `deepseek` | 17 | 0 (0%) | 0 (0%) | 17 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → cloudflare → mistral → gemini → deepseek`

*(Benchmark senast körde: 2026-11-23 11:24 UTC)*

## 7-Dagars Trend

```
  🟢 groq             100% ok   (147 anrop, 0 rl, 0 err)
  🟡 cloudflare       63.2% ok   (375 anrop, 56 rl, 82 err)
  🟡 mistral          79.3% ok   (266 anrop, 55 rl, 0 err)
  🔴 gemini           46.5% ok   (155 anrop, 45 rl, 38 err)
  🔴 deepseek         0% ok   (49 anrop, 0 rl, 49 err)
```

## ⚠️ Problemleverantörer

- **`deepseek`**: 0/17 ok (0%), 0 rate-limits, 17 errors

## Analys

Under de senaste 24 timmarna har Groq levererat stabil prestanda med 83 anrop och 100 % lyckade svar inom i genomsnitt 1,2 s. Cloudflare och Mistral visar tecken på belastning: Cloudflare har bara 63 % lyckade anrop (26 rate‑limits) och en svarstid på ca 3,9 s, medan Mistral ligger på 81 % lyckade anrop (19 rate‑limits) med 5,5 s. Gemini är kritisk med endast 50 % lyckade anrop och mycket hög latens (≈18 s), och Deepseek är helt otillgänglig (0 % lyckade). **Rekommendation:** prioritera Groq som huvudleverantör, flytta så mycket trafik som möjligt från Cloudflare och Gemini till Groq eller Mistral, och håll Deepseek som sista fallback tills problemet är löst.
