---
date: 2026-11-20
type: ai-performance
overall_health_24h: 64.4
overall_health_7d: 65.1
total_calls_24h: 420
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini", "deepseek"]
ranked_order: ["groq", "mistral", "gemini", "cloudflare", "deepseek"]
config_uppdaterad: "2026-11-20 10:39 UTC"
order_source: "provider_config"
providers_24h:
  groq:
    anrop: 73
    ok: 73
    rate_limits: 0
    errors: 0
    snitt_ms: 1242
  mistral:
    anrop: 156
    ok: 105
    rate_limits: 26
    errors: 25
    snitt_ms: 5038
  gemini:
    anrop: 68
    ok: 31
    rate_limits: 25
    errors: 12
    snitt_ms: 15058
  cloudflare:
    anrop: 84
    ok: 52
    rate_limits: 23
    errors: 9
    snitt_ms: 6650
  deepseek:
    anrop: 24
    ok: 0
    rate_limits: 0
    errors: 24
    snitt_ms: null
---

# AI Provider Performance — 2026-11-20

## Hälsostatus

🟡 **64.4%** lyckade anrop senaste 24h · 420 anrop totalt
🟡 **65.1%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 73 anrop · 73 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `groq` | 73 | 73 (100%) | 0 (0%) | 0 | 1242 ms | 100% ok · 660 ms |
| 🟡 `mistral` | 156 | 105 (67.3%) | 26 (16.7%) | 25 | 5038 ms | 20% ok · 960 ms |
| 🔴 `gemini` | 68 | 31 (45.6%) | 25 (36.8%) | 12 | 15058 ms | 100% ok · 2930 ms |
| 🟡 `cloudflare` | 84 | 52 (61.9%) | 23 (27.4%) | 9 | 6650 ms | 0% ok · 0 ms |
| 🔴 `deepseek` | 24 | 0 (0%) | 0 (0%) | 24 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`groq → mistral → gemini → cloudflare → deepseek`

*(Benchmark senast körde: 2026-11-20 10:39 UTC)*

## 7-Dagars Trend

```
  🟢 groq             100% ok   (208 anrop, 0 rl, 0 err)
  🟡 mistral          74% ok   (365 anrop, 70 rl, 25 err)
  🔴 gemini           47.9% ok   (188 anrop, 59 rl, 39 err)
  🔴 cloudflare       42.6% ok   (141 anrop, 60 rl, 21 err)
  🔴 deepseek         0% ok   (63 anrop, 0 rl, 63 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 31/68 ok (45.6%), 25 rate-limits, 12 errors
- **`deepseek`**: 0/24 ok (0%), 0 rate-limits, 24 errors

## Analys

Under de senaste 24 timmarna har Groq levererat stabil prestanda med 73 anrop och 100 % framgång utan någon rate‑limit, men svarstiden är relativt hög (≈1,2 s). Mistral visar en blandad bild: 156 anrop, men bara 67 % lyckade och 26 rate‑limits, vilket ger en genomsnittlig svarstid på ca 5 s. Gemini och DeepSeek är kritiska problemområden – Gemini har endast 45 % lyckade anrop och 25 rate‑limits med en mycket lång svarstid (≈15 s), medan DeepSeek inte levererat någon lyckad förfrågan alls. Rekommendationen är att prioritera omedelbart att öka kapaciteten för Groq (t.ex. fler nycklar) och minska beroendet av Gemini och DeepSeek, samt att övervaka Mistral för att eventuellt byta till en backup‑provider om rate‑limit‑situationen förvärras.
