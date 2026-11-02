---
date: 2026-10-19
type: ai-performance
overall_health_24h: 96.5
overall_health_7d: 98.4
total_calls_24h: 464
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["gemini", "mistral", "deepseek", "cloudflare", "groq"]
config_uppdaterad: "2026-10-19 08:09 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 26
    ok: 10
    rate_limits: 3
    errors: 13
    snitt_ms: 7761
  mistral:
    anrop: 433
    ok: 433
    rate_limits: 0
    errors: 0
    snitt_ms: 5952
  deepseek:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-10-19

## Hälsostatus

🟢 **96.5%** lyckade anrop senaste 24h · 464 anrop totalt
🟢 **98.4%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 0 anrop · 0 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🔴 `gemini` | 26 | 10 (38.5%) | 3 (11.5%) | 13 | 7761 ms | 100% ok · 1020 ms |
| 🟢 `mistral` | 433 | 433 (100%) | 0 (0%) | 0 | 5952 ms | 100% ok · 1250 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 1990 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3640 ms |
| ⚪ `groq` _(ej anropad)_ | – | – | – | – | – | 100% ok · 750 ms |

## Nuvarande Fallback-ordning

`gemini → mistral → deepseek → cloudflare → groq`

*(Benchmark senast körde: 2026-10-19 08:09 UTC)*

## 7-Dagars Trend

```
  🔴 gemini           38.5% ok   (26 anrop, 3 rl, 13 err)
  🟢 mistral          100% ok   (938 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (23 anrop, 0 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`gemini`**: 10/26 ok (38.5%), 3 rate-limits, 13 errors

## Analys

**AI-providerprestanda senaste 24h:**
Gemini hade 26 anrop med 38,5% lyckade svar (3 rate-limits), medan Mistral klarade 433 anrop utan fel. Deepseek, Cloudflare och Groq användes ej, men Mistral dominerade med 100% tillgänglighet. Groqs TPD-kvot (144k tokens) är kontospecifik, inte nyckelspecifik. **Prioritera Mistral för pålitlighet, överväg Groq för snabbhet om kvot tillåter.**

*(Hälsopoäng: 96,5% | Anrop: 464)*
