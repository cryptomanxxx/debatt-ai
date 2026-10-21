---
date: 2026-10-21
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-10-21 08:07 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 961
    ok: 961
    rate_limits: 0
    errors: 0
    snitt_ms: 3692
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
    snitt_ms: 1916
  gemini:
    anrop: 2
    ok: 2
    rate_limits: 0
    errors: 0
    snitt_ms: 4179
---

# AI Provider Performance — 2026-10-21

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 24 anrop · 24 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 961 | 961 (100%) | 0 (0%) | 0 | 3692 ms | 100% ok · 1420 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2170 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3640 ms |
| 🟢 `groq` | 24 | 24 (100%) | 0 (0%) | 0 | 1916 ms | 100% ok · 750 ms |
| 🟢 `gemini` | 2 | 2 (100%) | 0 (0%) | 0 | 4179 ms | 50% ok · 28100 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-10-21 08:07 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (961 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (24 anrop, 0 rl, 0 err)
  🟢 gemini           100% ok   (2 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

**AI-providerprestanda senaste 24h:**
Mistral och Groq dominerade med 100% tillgänglighet och noll rate-limits, medan DeepSeek och Cloudflare inte användes. Mistral svarade snabbt (medel 3692 ms), Groq var snabbast (1916 ms), och Gemini hade hög latens (4179 ms). Ingen provider hade över 30% fel eller under 50% tillgänglighet.

**Prioriterad rekommendation:** Fokusera på Mistral och Groq för låg latens och hög pålitlighet, med reserv till DeepSeek om behov.
