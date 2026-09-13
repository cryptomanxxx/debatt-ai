---
date: 2026-09-13
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 920
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-09-13 07:44 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 893
    ok: 893
    rate_limits: 0
    errors: 0
    snitt_ms: 3286
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
    anrop: 24
    ok: 24
    rate_limits: 0
    errors: 0
    snitt_ms: 2219
  gemini:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-09-13

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 920 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 24 anrop · 24 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 893 | 893 (100%) | 0 (0%) | 0 | 3286 ms | 100% ok · 1450 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2050 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4660 ms |
| 🟢 `groq` | 24 | 24 (100%) | 0 (0%) | 0 | 2219 ms | 100% ok · 670 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 100% ok · 11390 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-09-13 07:44 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (965 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (31 anrop, 0 rl, 0 err)
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 100% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**AI-providerprestanda senaste 24h:**
Mistral och Groq levererade 100% felfria svar med snabba svarstider (3286 ms respektive 2219 ms), medan DeepSeek, Cloudflare och Gemini inte användes. Groq:s 24 anrop varade under TPD-kvotgränsen, men kapacitetsökning är inte garanterad per nyckel. Fallback-ordningen fungerade som planerat utan problemleverantörer.

**Prioriterad rekommendation:**
Prioritera Mistral för stabilitet och Groq för låg latens, men övervaka TPD-kvoten per konto. Aktivera DeepSeek och Cloudflare för redundans om Groq:s kapacitet blir begränsande.
