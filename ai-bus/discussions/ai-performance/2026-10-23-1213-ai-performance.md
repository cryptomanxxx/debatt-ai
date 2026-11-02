---
date: 2026-10-23
type: ai-performance
overall_health_24h: 69.6
overall_health_7d: 69.6
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["gemini", "deepseek", "cloudflare", "groq", "mistral"]
config_uppdaterad: "2026-10-23 07:59 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 22
    ok: 11
    rate_limits: 3
    errors: 8
    snitt_ms: 9894
  deepseek:
    anrop: 337
    ok: 337
    rate_limits: 0
    errors: 0
    snitt_ms: 5568
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 14
    ok: 14
    rate_limits: 0
    errors: 0
    snitt_ms: 1742
  mistral:
    anrop: 615
    ok: 326
    rate_limits: 0
    errors: 289
    snitt_ms: 3798
---

# AI Provider Performance — 2026-10-23

## Hälsostatus

🟡 **69.6%** lyckade anrop senaste 24h · 1000 anrop totalt
🟡 **69.6%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 14 anrop · 14 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `gemini` | 22 | 11 (50%) | 3 (13.6%) | 8 | 9894 ms | 100% ok · 980 ms |
| 🟢 `deepseek` | 337 | 337 (100%) | 0 (0%) | 0 | 5568 ms | 100% ok · 2250 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3280 ms |
| 🟢 `groq` | 14 | 14 (100%) | 0 (0%) | 0 | 1742 ms | 100% ok · 740 ms |
| 🟡 `mistral` | 615 | 326 (53%) | 0 (0%) | 289 | 3798 ms | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`gemini → deepseek → cloudflare → groq → mistral`

*(Benchmark senast körde: 2026-10-23 07:59 UTC)*

## 7-Dagars Trend

```
  🟡 gemini           50% ok   (22 anrop, 3 rl, 8 err)
  🟢 deepseek         100% ok   (337 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (14 anrop, 0 rl, 0 err)
  🟡 mistral          53% ok   (615 anrop, 0 rl, 289 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under det senaste dygnet har DeepSeek visat på bäst stabil prestanda med 100 % lyckade anrop över 337 requests, medan Groq var snabbast (1 742 ms) men nyttjades snålt. Gemini har haft påtagliga problem med 50 % felsvarsfrekvens och hög latens (9 894 ms), samtidigt som Mistral – som tog emot majoriteten av trafiken (615 anrop) – presterade svagt med endast 53 % lyckade anrop. Då Cloudflare inte anropades alls trots ett felfritt benchmark, har den nuvarande fallback-kedjan skapat en osund belastning på de lägre leden.

**Prioriterad rekommendation:** Justera fallback-ordningen och placera DeepSeek och Groq först i kedjan, samt undersök varför Cloudflare förbigås, för att avlasta Mistral och höja plattformens totala hälsopoäng från nuvarande 69,6 %.
