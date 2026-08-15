---
date: 2026-08-15
type: ai-performance
overall_health_24h: 100
overall_health_7d: 100
total_calls_24h: 598
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "sambanova", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-15 03:29 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 564
    ok: 564
    rate_limits: 0
    errors: 0
    snitt_ms: 1091
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
    anrop: 26
    ok: 26
    rate_limits: 0
    errors: 0
    snitt_ms: 2313
  sambanova:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  cerebras:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  github_models:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
  gemini:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-08-15

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 598 anrop totalt
🟢 **100%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 26 anrop · 26 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 564 | 564 (100%) | 0 (0%) | 0 | 1091 ms | 100% ok · 1010 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2790 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3040 ms |
| 🟢 `groq` | 26 | 26 (100%) | 0 (0%) | 0 | 2313 ms | 100% ok · 650 ms |
| ⚪ `sambanova` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → sambanova → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-15 03:29 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (924 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (62 anrop, 0 rl, 0 err)
  ⚪ sambanova        ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har **Mistral** hanterat majoriteten av trafiken (564 anrop) med 100 % framgång och en genomsnittlig svarstid på 1 091 ms, vilket visar på stabil prestanda utan några rate‑limits. **Groq** har endast använts för 26 anrop, men svarstiden var betydligt högre (2 313 ms), även om den också levererade 100 % lyckade svar. Inga andra leverantörer har anropats och har därför ingen aktuell belastning eller felprocent.  

**Rekommendation (i prioriteringsordning):** behåll Mistral som primär leverantör, håll Groq som sekundär fallback men övervaka dess latens, och aktivera Deepseek i fallback‑kedjan för att minska beroendet av Groq‑latens.
