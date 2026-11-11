---
date: 2026-11-11
type: ai-performance
overall_health_24h: 68.1
overall_health_7d: 65.8
total_calls_24h: 882
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "cloudflare", "deepseek"]
ranked_order: ["groq", "mistral", "gemini", "cloudflare", "deepseek"]
config_uppdaterad: "2026-11-11 09:56 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 289
    ok: 241
    rate_limits: 48
    errors: 0
    snitt_ms: 2820
  mistral:
    anrop: 256
    ok: 200
    rate_limits: 56
    errors: 0
    snitt_ms: 7299
  gemini:
    anrop: 125
    ok: 64
    rate_limits: 52
    errors: 9
    snitt_ms: 4386
  cloudflare:
    anrop: 137
    ok: 75
    rate_limits: 43
    errors: 19
    snitt_ms: 7115
  deepseek:
    anrop: 45
    ok: 0
    rate_limits: 0
    errors: 45
    snitt_ms: null
---

# AI Provider Performance — 2026-11-11

## Hälsostatus

🟡 **68.1%** lyckade anrop senaste 24h · 882 anrop totalt
🟡 **65.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 289 anrop · 241 (83.4%) OK · 48 (16.6%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 289 | 241 (83.4%) | 48 (16.6%) | 0 | 2820 ms | 100% ok · 710 ms |
| 🟡 `mistral` | 256 | 200 (78.1%) | 56 (21.9%) | 0 | 7299 ms | 20% ok · 1120 ms |
| 🟡 `gemini` | 125 | 64 (51.2%) | 52 (41.6%) | 9 | 4386 ms | 100% ok · 3620 ms |
| 🟡 `cloudflare` | 137 | 75 (54.7%) | 43 (31.4%) | 19 | 7115 ms | 0% ok · 0 ms |
| 🔴 `deepseek` | 45 | 0 (0%) | 0 (0%) | 45 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → mistral → gemini → cloudflare → deepseek`

*(Benchmark senast körde: 2026-11-11 09:56 UTC)*

## 7-Dagars Trend

```
  🟢 groq             81% ok   (311 anrop, 59 rl, 0 err)
  🟡 mistral          77.2% ok   (303 anrop, 69 rl, 0 err)
  🔴 gemini           49% ok   (143 anrop, 64 rl, 9 err)
  🟡 cloudflare       51% ok   (147 anrop, 53 rl, 19 err)
  🔴 deepseek         0% ok   (55 anrop, 0 rl, 55 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 64/125 ok (51.2%), 52 rate-limits, 9 errors
- **`cloudflare`**: 75/137 ok (54.7%), 43 rate-limits, 19 errors
- **`deepseek`**: 0/45 ok (0%), 0 rate-limits, 45 errors

## Analys

Under de senaste 24 timmarna har Groq fortsatt att leverera bäst resultat med 83 % lyckade anrop (289 stycken) och relativt låg latens (≈2,8 s), men har redan nått 48 rate‑limits, vilket indikerar att TPD‑kvoten på ca 144 k per konto snart kan bli en flaskhals. Mistral ligger på 78 % framgång (256 anrop) men har högre svarstid (≈7,3 s) och 56 rate‑limits, så den bör hållas som sekundär fallback. Gemini (51 % ok) och Cloudflare (55 % ok) presterar under 60 % och har dessutom betydande rate‑limits, medan Deepseek är helt otillgänglig (0 % ok). **Prioriterad rekommendation:** förstärk Groq‑kapaciteten genom att lägga till fler nycklar och övervaka kvotanvändning, håll Mistral som backup, och avaktivera Gemini samt Cloudflare tills deras stabilitet förbättras; Deepseek bör tillfälligt tas bort från fallback‑kedjan.
