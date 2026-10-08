---
date: 2026-10-08
type: ai-performance
overall_health_24h: 99
overall_health_7d: 99
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["gemini", "mistral", "deepseek", "cloudflare", "groq"]
config_uppdaterad: "2026-10-08 09:35 UTC"
order_source: "provider_config"
providers_24h:
  gemini:
    anrop: 24
    ok: 14
    rate_limits: 3
    errors: 7
    snitt_ms: 8562
  mistral:
    anrop: 947
    ok: 947
    rate_limits: 0
    errors: 0
    snitt_ms: 3410
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
    anrop: 18
    ok: 18
    rate_limits: 0
    errors: 0
    snitt_ms: 1892
---

# AI Provider Performance — 2026-10-08

## Hälsostatus

🟢 **99%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **99%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 18 anrop · 18 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟡 `gemini` | 24 | 14 (58.3%) | 3 (12.5%) | 7 | 8562 ms | 100% ok · 950 ms |
| 🟢 `mistral` | 947 | 947 (100%) | 0 (0%) | 0 | 3410 ms | 100% ok · 1650 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 1670 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4180 ms |
| 🟢 `groq` | 18 | 18 (100%) | 0 (0%) | 0 | 1892 ms | 100% ok · 700 ms |

## Nuvarande Fallback-ordning

`gemini → mistral → deepseek → cloudflare → groq`

*(Benchmark senast körde: 2026-10-08 09:35 UTC)*

## 7-Dagars Trend

```
  🟡 gemini           58.3% ok   (24 anrop, 3 rl, 7 err)
  🟢 mistral          100% ok   (947 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (18 anrop, 0 rl, 0 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under det senaste dygnet har plattformen uppvisat en mycket stabil total hälsopoäng på 99% över 1000 anrop, där **Mistral** har dragit det absolut tyngsta lasset med 947 anrop och en imponerande felmarginal på 0%. **Gemini** har däremot underpresterat i rollen som primär provider med enbart 58,3% lyckade anrop och en hög genomsnittlig svarstid på 8562 ms, medan **Groq** har levererat med 100% framgång och snabbast svarstid (1892 ms) på sina 18 anrop. Då vår analys visar att Groqs TPD-kvot (tokens per dag) sannolikt är begränsad per konto snarare än per nyckel, kan vi inte förlita oss på linjär kapacitetsökning trots våra 9 konfigurerade nycklar. 

**Prioriterad rekommendation:** Justera fallback-ordningen så att den stabila och snabba **Mistral** sätts som primär provider (först i kedjan), och flytta ner den tröga och felbenägna **Gemini** till en lägre prioritet under Groq.
