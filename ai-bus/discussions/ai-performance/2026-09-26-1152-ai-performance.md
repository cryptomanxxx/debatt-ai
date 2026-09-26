---
date: 2026-09-26
type: ai-performance
overall_health_24h: 99.9
overall_health_7d: 99.9
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["deepseek", "gemini", "cloudflare", "groq", "mistral"]
config_uppdaterad: "2026-09-26 08:03 UTC"
order_source: "provider_config"
providers_24h:
  deepseek:
    anrop: 938
    ok: 938
    rate_limits: 0
    errors: 0
    snitt_ms: 3063
  gemini:
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
    anrop: 31
    ok: 31
    rate_limits: 0
    errors: 0
    snitt_ms: 2304
  mistral:
    anrop: 1
    ok: 0
    rate_limits: 0
    errors: 1
    snitt_ms: null
---

# AI Provider Performance — 2026-09-26

## Hälsostatus

🟢 **99.9%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **99.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 31 anrop · 31 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `deepseek` | 938 | 938 (100%) | 0 (0%) | 0 | 3063 ms | 100% ok · 1830 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2030 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4210 ms |
| 🟢 `groq` | 31 | 31 (100%) | 0 (0%) | 0 | 2304 ms | 100% ok · 610 ms |
| 🔴 `mistral` | 1 | 0 (0%) | 0 (0%) | 1 | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`deepseek → gemini → cloudflare → groq → mistral`

*(Benchmark senast körde: 2026-09-26 08:03 UTC)*

## 7-Dagars Trend

```
  🟢 deepseek         100% ok   (938 anrop, 0 rl, 0 err)
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (31 anrop, 0 rl, 0 err)
  🔴 mistral          0% ok   (1 anrop, 0 rl, 1 err)
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Senaste 24h: deepseek bar nästan hela lasten (938/1000 anrop, 100% ok, 3063 ms) medan groq levererade 31 anrop med 100% ok och lägre latens (2304 ms). Gemini och cloudflare stod helt oanvända trots benchmarkad 100% ok, och mistral hade 1 anrop med 0% ok — ett enskilt fel som bör följas upp. Inga rate-limits och inga problemleverantörer enligt trösklarna, men deepseeks dominans (~94% av trafiken) är en tydlig single point of failure. **Prioriterad rekommendation: verifiera mistral-felet och tvinga fram trafik till gemini/cloudflare via fallback-testning så att deepseek-beroendet minskar innan en verklig incident inträffar.**
