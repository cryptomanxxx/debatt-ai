---
date: 2026-09-25
type: ai-performance
overall_health_24h: 94.9
overall_health_7d: 94.9
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["gemini"]
ranked_order: ["deepseek", "cloudflare", "groq", "gemini", "mistral"]
config_uppdaterad: "2026-09-25 08:14 UTC"
order_source: "provider_config"
providers_24h:
  deepseek:
    anrop: 864
    ok: 864
    rate_limits: 0
    errors: 0
    snitt_ms: 3162
  cloudflare:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  groq:
    anrop: 26
    ok: 26
    rate_limits: 0
    errors: 0
    snitt_ms: 4957
  gemini:
    anrop: 56
    ok: 8
    rate_limits: 36
    errors: 12
    snitt_ms: 16815
  mistral:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-09-25

## Hälsostatus

🟢 **94.9%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **94.9%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 26 anrop · 26 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `deepseek` | 864 | 864 (100%) | 0 (0%) | 0 | 3162 ms | 100% ok · 1650 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 4030 ms |
| 🟢 `groq` | 26 | 26 (100%) | 0 (0%) | 0 | 4957 ms | 100% ok · 710 ms |
| 🔴 `gemini` | 56 | 8 (14.3%) | 36 (64.3%) | 12 | 16815 ms | 100% ok · 870 ms |
| ⚪ `mistral` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`deepseek → cloudflare → groq → gemini → mistral`

*(Benchmark senast körde: 2026-09-25 08:14 UTC)*

## 7-Dagars Trend

```
  🟢 deepseek         100% ok   (864 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (26 anrop, 0 rl, 0 err)
  🔴 gemini           14.3% ok   (56 anrop, 36 rl, 12 err)
  ⚪ mistral          ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`gemini`**: 8/56 ok (14.3%), 36 rate-limits, 12 errors

## Analys

Senaste 24h: deepseek bar systemet med 864 anrop, 100% ok och 3162 ms svarstid, medan groq körde 26 anrop felfritt men långsamt (4957 ms). Gemini är den tydliga problemleverantören: 56 anrop, endast 14,3% ok, 36 rate-limits och 16,8 s svarstid — vilket drar ner helhetshälsan trots att cloudflare och mistral inte anropats alls (mistral benchmarkar 0% ok). Notera också att Groqs 9 nycklar sannolikt delar TPD-kvot per konto, så kapaciteten skalar inte linjärt. **Rekommendation: ta bort eller demota gemini i fallback-kedjan omedelbart (och behåll mistral utanför tills benchmark förbättrats), samt verifiera Groqs kontobaserade kvoter innan ni räknar med den som redundant kapacitet.**
