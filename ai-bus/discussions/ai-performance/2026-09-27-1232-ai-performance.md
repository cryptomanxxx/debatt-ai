---
date: 2026-09-27
type: ai-performance
overall_health_24h: 98.1
overall_health_7d: 98.1
total_calls_24h: 999
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["gemini", "deepseek", "cloudflare", "groq", "mistral"]
config_uppdaterad: "2026-09-27 08:37 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 27
    ok: 10
    rate_limits: 2
    errors: 15
    snitt_ms: 18635
  deepseek:
    anrop: 906
    ok: 906
    rate_limits: 0
    errors: 0
    snitt_ms: 2724
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 28
    ok: 28
    rate_limits: 0
    errors: 0
    snitt_ms: 2483
  mistral:
    anrop: 1
    ok: 0
    rate_limits: 0
    errors: 1
    snitt_ms: null
---

# AI Provider Performance — 2026-09-27

## Hälsostatus

🟢 **98.1%** lyckade anrop senaste 24h · 999 anrop totalt
🟢 **98.1%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 28 anrop · 28 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🔴 `gemini` | 27 | 10 (37%) | 2 (7.4%) | 15 | 18635 ms | 100% ok · 990 ms |
| 🟢 `deepseek` | 906 | 906 (100%) | 0 (0%) | 0 | 2724 ms | 100% ok · 1660 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4120 ms |
| 🟢 `groq` | 28 | 28 (100%) | 0 (0%) | 0 | 2483 ms | 100% ok · 670 ms |
| 🔴 `mistral` | 1 | 0 (0%) | 0 (0%) | 1 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`gemini → deepseek → cloudflare → groq → mistral`

*(Benchmark senast körde: 2026-09-27 08:37 UTC)*

## 7-Dagars Trend

```
  🔴 gemini           37% ok   (27 anrop, 2 rl, 15 err)
  🟢 deepseek         100% ok   (907 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (28 anrop, 0 rl, 0 err)
  🔴 mistral          0% ok   (1 anrop, 0 rl, 1 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 10/27 ok (37%), 2 rate-limits, 15 errors

## Analys

Senaste 24h: DeepSeek bär i praktiken hela plattformen med 906 anrop, 100% ok och 2,7s svarstid, medan Groq (28 anrop, 100% ok, 2,5s) och Cloudflare (0 anrop, benchmark 100%) är stabila men underutnyttjade. Gemini är den tydliga problemleverantören: 27 anrop, endast 37% ok, 2 rate-limits och 18,6s svarstid — långt över övriga. Mistral ligger på 0% ok men med bara 1 anrop är underlaget för tunt för att dra slutsatser. Rekommendation: prioritera att flytta Geminis trafik till DeepSeek/Groq och undersök om Geminis rate-limits beror på kvot- eller nyckelkonfiguration innan den återaktiveras i fallback-kedjan.
