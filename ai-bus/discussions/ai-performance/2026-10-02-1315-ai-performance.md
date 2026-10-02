---
date: 2026-10-02
type: ai-performance
overall_health_24h: 100
overall_health_7d: 99.6
total_calls_24h: 703
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["deepseek", "mistral", "cloudflare", "groq", "gemini"]
config_uppdaterad: "2026-10-02 09:05 UTC"
order_source: "provider_config"
providers_24h:
  deepseek:
    anrop: 669
    ok: 669
    rate_limits: 0
    errors: 0
    snitt_ms: 3724
  mistral:
    anrop: 12
    ok: 12
    rate_limits: 0
    errors: 0
    snitt_ms: 4361
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 11
    ok: 11
    rate_limits: 0
    errors: 0
    snitt_ms: 1883
  gemini:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-10-02

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 703 anrop totalt
🟢 **99.6%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 11 anrop · 11 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `deepseek` | 669 | 669 (100%) | 0 (0%) | 0 | 3724 ms | 100% ok · 1770 ms |
| 🟢 `mistral` | 12 | 12 (100%) | 0 (0%) | 0 | 4361 ms | 100% ok · 1810 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4900 ms |
| 🟢 `groq` | 11 | 11 (100%) | 0 (0%) | 0 | 1883 ms | 100% ok · 680 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 90% ok · 1030 ms |

## Nuvarande Fallback-ordning

`deepseek → mistral → cloudflare → groq → gemini`

*(Benchmark senast körde: 2026-10-02 09:05 UTC)*

## 7-Dagars Trend

```
  🟢 deepseek         100% ok   (937 anrop, 0 rl, 0 err)
  🟢 mistral          100% ok   (18 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (24 anrop, 0 rl, 0 err)
  🔴 gemini           0% ok   (4 anrop, 2 rl, 2 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Senaste 24h visar debatt-ai.se på stabil drift med 100% hälsopoäng och 703 anrop, där deepseek dominerar med 669 anrop (100% ok, 3724 ms) medan groq och mistral står för endast 11 respektive 12 anrop med full framgång. Inga rate-limits har observerats hos någon provider, och cloudflare samt gemini har inte anropats alls under perioden. Groq levererar klart snabbast svarstid (1883 ms) men utnyttjas minimalt, och notera att de 9 Groq-nycklarna sannolikt delar TPD-kvot per konto snarare än per nyckel. Prioriterad rekommendation: öka andelen trafik till groq för att avlasta deepseek och sänka genomsnittlig latens, men verifiera först Groq-kontostrukturen så att TPD-kvoten inte slår i taket vid skalning.
