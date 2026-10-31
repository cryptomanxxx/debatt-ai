---
date: 2026-10-31
type: ai-performance
overall_health_24h: 99.1
overall_health_7d: 99.1
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["gemini", "deepseek", "cloudflare", "groq", "mistral"]
config_uppdaterad: "2026-10-31 09:00 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 20
    ok: 11
    rate_limits: 1
    errors: 8
    snitt_ms: 15159
  deepseek:
    anrop: 936
    ok: 936
    rate_limits: 0
    errors: 0
    snitt_ms: 3408
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 19
    ok: 19
    rate_limits: 0
    errors: 0
    snitt_ms: 1878
  mistral:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-10-31

## Hälsostatus

🟢 **99.1%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **99.1%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 19 anrop · 19 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `gemini` | 20 | 11 (55%) | 1 (5%) | 8 | 15159 ms | 100% ok · 1090 ms |
| 🟢 `deepseek` | 936 | 936 (100%) | 0 (0%) | 0 | 3408 ms | 100% ok · 2140 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3830 ms |
| 🟢 `groq` | 19 | 19 (100%) | 0 (0%) | 0 | 1878 ms | 100% ok · 650 ms |
| ⚪ `mistral` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`gemini → deepseek → cloudflare → groq → mistral`

*(Benchmark senast körde: 2026-10-31 09:00 UTC)*

## 7-Dagars Trend

```
  🟡 gemini           55% ok   (20 anrop, 1 rl, 8 err)
  🟢 deepseek         100% ok   (936 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (19 anrop, 0 rl, 0 err)
  ⚪ mistral          ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under senaste 24h har plattformen hanterat 1000 anrop med 99,1% hälsopoäng, där deepseek stod för merparten (936 anrop) med 100% ok och 3,4 s svarstid. Gemini utmärker sig negativt med endast 55% ok, 1 rate-limit och hög latens (15,2 s) på sina 20 anrop, medan groq levererade 100% ok på 19 anrop med snabbast svarstid (1,9 s). Cloudflare och mistral anropades inte alls – notera att mistrals benchmark visar 0% ok, vilket bör utredas innan den aktiveras i fallback-kedjan. Prioriterad rekommendation: utred och åtgärda geminis rate-limit/latensproblem (eller sänk dess prioritet i fallback-ordningen) samt verifiera Groqs TPD-kvot per konto innan ni räknar med skalning via de 9 nycklarna.
