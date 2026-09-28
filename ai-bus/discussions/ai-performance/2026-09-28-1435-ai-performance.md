---
date: 2026-09-28
type: ai-performance
overall_health_24h: 94.5
overall_health_7d: 94.5
total_calls_24h: 979
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["deepseek", "cloudflare", "groq", "gemini", "mistral"]
config_uppdaterad: "2026-09-28 09:01 UTC"
order_source: "provider_config"
providers_24h:
  deepseek:
    anrop: 864
    ok: 864
    rate_limits: 0
    errors: 0
    snitt_ms: 2904
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 12
    ok: 12
    rate_limits: 0
    errors: 0
    snitt_ms: 9619
  gemini:
    anrop: 74
    ok: 22
    rate_limits: 34
    errors: 18
    snitt_ms: 12725
  mistral:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-09-28

## Hälsostatus

🟢 **94.5%** lyckade anrop senaste 24h · 979 anrop totalt
🟢 **94.5%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 12 anrop · 12 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `deepseek` | 864 | 864 (100%) | 0 (0%) | 0 | 2904 ms | 100% ok · 1890 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 6770 ms |
| 🟢 `groq` | 12 | 12 (100%) | 0 (0%) | 0 | 9619 ms | 100% ok · 610 ms |
| 🔴 `gemini` | 74 | 22 (29.7%) | 34 (45.9%) | 18 | 12725 ms | 100% ok · 1040 ms |
| ⚪ `mistral` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`deepseek → cloudflare → groq → gemini → mistral`

*(Benchmark senast körde: 2026-09-28 09:01 UTC)*

## 7-Dagars Trend

```
  🟢 deepseek         100% ok   (878 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (13 anrop, 0 rl, 0 err)
  🔴 gemini           30.3% ok   (76 anrop, 35 rl, 18 err)
  ⚪ mistral          ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`gemini`**: 22/74 ok (29.7%), 34 rate-limits, 18 errors

## Analys

Senaste 24h har plattformen 94,5% hälsopoäng på 979 anrop, där deepseek dominerar med 864 anrop och 100% ok på 2904 ms — men ligger först i fallback-kedjan och bär i praktiken hela lasten. Groq svarar 100% ok men bara på 12 anrop med 9619 ms latens, och TPD-kvoten (~144k) gäller sannolikt per Groq-konto, så de 9 nycklarna ger ingen garanterad linjär kapacitetsökning. Gemini är den enda problemleverantören med 29,7% ok, 34 rate-limits och 12725 ms på 74 anrop, medan cloudflare och mistral står oanvända (benchmark 100% respektive 0% ok). Prioriterad rekommendation: flytta gemini efter groq i fallback-ordningen och aktivera cloudflare som tidig buffert innan groq, så att deepseek avlastas och rate-limit-kaskader undviks.
