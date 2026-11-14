---
date: 2026-11-14
type: ai-performance
overall_health_24h: 62.8
overall_health_7d: 65.9
total_calls_24h: 849
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "deepseek"]
ranked_order: ["groq", "mistral", "cloudflare", "gemini", "deepseek"]
config_uppdaterad: "2026-11-14 09:33 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 244
    ok: 195
    rate_limits: 49
    errors: 0
    snitt_ms: 2407
  mistral:
    anrop: 223
    ok: 172
    rate_limits: 51
    errors: 0
    snitt_ms: 5964
  cloudflare:
    anrop: 208
    ok: 117
    rate_limits: 38
    errors: 53
    snitt_ms: 4710
  gemini:
    anrop: 104
    ok: 32
    rate_limits: 44
    errors: 28
    snitt_ms: 8892
  deepseek:
    anrop: 43
    ok: 0
    rate_limits: 0
    errors: 43
    snitt_ms: null
---

# AI Provider Performance — 2026-11-14

## Hälsostatus

🟡 **62.8%** lyckade anrop senaste 24h · 849 anrop totalt
🟡 **65.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 244 anrop · 195 (79.9%) OK · 49 (20.1%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `groq` | 244 | 195 (79.9%) | 49 (20.1%) | 0 | 2407 ms | 100% ok · 720 ms |
| 🟡 `mistral` | 223 | 172 (77.1%) | 51 (22.9%) | 0 | 5964 ms | 20% ok · 1020 ms |
| 🟡 `cloudflare` | 208 | 117 (56.3%) | 38 (18.3%) | 53 | 4710 ms | 0% ok · 0 ms |
| 🔴 `gemini` | 104 | 32 (30.8%) | 44 (42.3%) | 28 | 8892 ms | 70% ok · 1270 ms |
| 🔴 `deepseek` | 43 | 0 (0%) | 0 (0%) | 43 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → mistral → cloudflare → gemini → deepseek`

*(Benchmark senast körde: 2026-11-14 09:33 UTC)*

## 7-Dagars Trend

```
  🟡 groq             79.9% ok   (268 anrop, 54 rl, 0 err)
  🟡 mistral          77.1% ok   (253 anrop, 58 rl, 0 err)
  🟡 cloudflare       67.2% ok   (287 anrop, 38 rl, 56 err)
  🔴 gemini           31% ok   (113 anrop, 50 rl, 28 err)
  🔴 deepseek         0% ok   (46 anrop, 0 rl, 46 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 32/104 ok (30.8%), 44 rate-limits, 28 errors
- **`deepseek`**: 0/43 ok (0%), 0 rate-limits, 43 errors

## Analys

Under de senaste 24 timmarna har **Groq** fortsatt att leverera den bästa prestandan med 79,9 % lyckade anrop (244 stycken) och en genomsnittlig svarstid på 2,4 s, men har redan nått sin TPD‑kvot (≈144 k) och visar tecken på ökad rate‑limit (49). **Mistral** ligger på 77,1 % lyckade anrop (223) med en svarstid på 5,9 s och har också börjat trängas (51 rate‑limits). **Cloudflare** presterar sämre med endast 56,3 % lyckade anrop (208) och en svarstid på 4,7 s. De två problemleverantörerna **Gemini** (30,8 % lyckade, 8,9 s) och **Deepseek** (0 % lyckade) är betydligt under förväntningarna och bör undvikas.

**Rekommendation (prioriterad):** Prioritera Groq‑nycklarna och, om kvoten börjar bli en flaskhals, skala upp med fler Groq‑nycklar eller övergå till Mistral som sekundär fallback; undvik Gemini och Deepseek tills deras tillgänglighet förbättras.
