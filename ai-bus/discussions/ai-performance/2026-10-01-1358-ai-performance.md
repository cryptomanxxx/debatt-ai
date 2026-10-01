---
date: 2026-10-01
type: ai-performance
overall_health_24h: 94.8
overall_health_7d: 94.8
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["deepseek", "cloudflare", "groq", "mistral", "gemini"]
config_uppdaterad: "2026-10-01 09:29 UTC"
order_source: "provider_config"
providers_24h:
  deepseek:
    anrop: 865
    ok: 865
    rate_limits: 0
    errors: 0
    snitt_ms: 2728
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 32
    ok: 32
    rate_limits: 0
    errors: 0
    snitt_ms: 2703
  mistral:
    anrop: 10
    ok: 10
    rate_limits: 0
    errors: 0
    snitt_ms: 2987
  gemini:
    anrop: 69
    ok: 18
    rate_limits: 30
    errors: 21
    snitt_ms: 20786
---

# AI Provider Performance — 2026-10-01

## Hälsostatus

🟢 **94.8%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **94.8%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 32 anrop · 32 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `deepseek` | 865 | 865 (100%) | 0 (0%) | 0 | 2728 ms | 100% ok · 1770 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3920 ms |
| 🟢 `groq` | 32 | 32 (100%) | 0 (0%) | 0 | 2703 ms | 100% ok · 710 ms |
| 🟢 `mistral` | 10 | 10 (100%) | 0 (0%) | 0 | 2987 ms | 100% ok · 1620 ms |
| 🔴 `gemini` | 69 | 18 (26.1%) | 30 (43.5%) | 21 | 20786 ms | 100% ok · 1070 ms |

## Nuvarande Fallback-ordning

`deepseek → cloudflare → groq → mistral → gemini`

*(Benchmark senast körde: 2026-10-01 09:29 UTC)*

## 7-Dagars Trend

```
  🟢 deepseek         100% ok   (865 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (32 anrop, 0 rl, 0 err)
  🟢 mistral          100% ok   (10 anrop, 0 rl, 0 err)
  🔴 gemini           26.1% ok   (69 anrop, 30 rl, 21 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 18/69 ok (26.1%), 30 rate-limits, 21 errors

## Analys

Senaste 24h: deepseek bar nästan hela lasten (865 anrop, 100% ok, 2728 ms) medan groq (32 anrop) och mistral (10 anrop) levererade felfritt på låg volym; cloudflare anropades aldrig. Gemini är den tydliga problemleverantören med endast 26,1% ok, 30 rate-limits och 20,8 s svarstid på 69 anrop — den bör inte ligga kvar i fallback-kedjan i nuvarande skick. Notera också att Groqs 9 nycklar sannolikt delar TPD-kvot per konto, så redundansen är inte linjär. Prioriterad rekommendation: ta bort eller nedgradera gemini i fallback-ordningen omedelbart och verifiera Groq-kontokvoterna innan ni räknar med dem som kapacitetsreserv.
