---
date: 2026-09-30
type: ai-performance
overall_health_24h: 99.1
overall_health_7d: 99.1
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["gemini", "deepseek", "cloudflare", "groq", "mistral"]
config_uppdaterad: "2026-09-30 09:04 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 23
    ok: 14
    rate_limits: 2
    errors: 7
    snitt_ms: 20681
  deepseek:
    anrop: 914
    ok: 914
    rate_limits: 0
    errors: 0
    snitt_ms: 2906
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 30
    ok: 30
    rate_limits: 0
    errors: 0
    snitt_ms: 2483
  mistral:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-09-30

## Hälsostatus

🟢 **99.1%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **99.1%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 30 anrop · 30 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `gemini` | 23 | 14 (60.9%) | 2 (8.7%) | 7 | 20681 ms | 100% ok · 990 ms |
| 🟢 `deepseek` | 914 | 914 (100%) | 0 (0%) | 0 | 2906 ms | 100% ok · 1780 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4200 ms |
| 🟢 `groq` | 30 | 30 (100%) | 0 (0%) | 0 | 2483 ms | 100% ok · 740 ms |
| ⚪ `mistral` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`gemini → deepseek → cloudflare → groq → mistral`

*(Benchmark senast körde: 2026-09-30 09:04 UTC)*

## 7-Dagars Trend

```
  🟡 gemini           60.9% ok   (23 anrop, 2 rl, 7 err)
  🟢 deepseek         100% ok   (914 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (30 anrop, 0 rl, 0 err)
  ⚪ mistral          ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Senaste 24h: deepseek bar nästan hela lasten (914 anrop, 100% ok, 2,9 s) och fungerade som stabil primärväg efter att gemini tappat — gemini ligger på 60,9% ok med 2 rate-limits och 20,7 s svarstid, vilket gör den till den enda verkliga problemkällan. Groq levererade 100% ok på 30 anrop (2,5 s) men TPD-kvoten på ~144k per konto innebär att de 9 nycklarna inte ger linjär kapacitetsökning. Cloudflare och mistral är oanvända i produktion; cloudflare har 100% ok i benchmark medan mistral ligger på 0% och bör betraktas som opålitlig. Prioriterad rekommendation: flytta gemini ur primärpositionen i fallback-kedjan (sätt deepseek först, groq som snabb sekundär) och verifiera Groq-kontostrukturen så att nycklarna faktiskt motsvarar separata konton.
