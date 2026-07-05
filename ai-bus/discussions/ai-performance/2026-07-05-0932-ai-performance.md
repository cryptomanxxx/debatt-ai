---
date: 2026-07-05
type: ai-performance
overall_health_24h: 95.7
overall_health_7d: 97
total_calls_24h: 686
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["mistral", "deepseek", "github_models", "cloudflare", "groq", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-07-05 06:31 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 614
    ok: 614
    rate_limits: 0
    errors: 0
    snitt_ms: 1219
  deepseek:
    anrop: 2
    ok: 2
    rate_limits: 0
    errors: 0
    snitt_ms: 2170
  github_models:
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
    anrop: 29
    ok: 29
    rate_limits: 0
    errors: 0
    snitt_ms: 2600
  sambanova:
    anrop: 33
    ok: 4
    rate_limits: 29
    errors: 0
    snitt_ms: 14639
  cerebras:
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

# AI Provider Performance — 2026-07-05

## Hälsostatus

🟢 **95.7%** lyckade anrop senaste 24h · 686 anrop totalt
🟢 **97%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 29 anrop · 29 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 614 | 614 (100%) | 0 (0%) | 0 | 1219 ms | 100% ok · 1160 ms |
| 🟢 `deepseek` | 2 | 2 (100%) | 0 (0%) | 0 | 2170 ms | 100% ok · 2600 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3010 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3290 ms |
| 🟢 `groq` | 29 | 29 (100%) | 0 (0%) | 0 | 2600 ms | 80% ok · 3360 ms |
| 🔴 `sambanova` | 33 | 4 (12.1%) | 29 (87.9%) | 0 | 14639 ms | 0% ok · 0 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → cloudflare → groq → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-07-05 06:31 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (865 anrop, 0 rl, 0 err)
  🟢 deepseek         100% ok   (2 anrop, 0 rl, 0 err)
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (50 anrop, 0 rl, 0 err)
  🟡 sambanova        57.7% ok   (71 anrop, 30 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 4/33 ok (12.1%), 29 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har plattformen hanterat 686 anrop med en hälsopoäng på 95,7 % (97 % på 7 dagar). Mistral har dominerat med 614 anrop och 100 % lyckade svar (med en genomsnittlig svarstid på 1,2 s), medan Deepseek och Groq också presterade stabilt (100 % utan rate‑limits, men svarstider på 2,2 s respektive 2,6 s). Sambanova är den enda leverantören som avviker negativt – endast 12,1 % av 33 anrop lyckades och 29 av dem möttes av rate‑limits med en genomsnittlig svarstid på 14,6 s, vilket placerar den i problemkategorin (>30 % fel eller <50 % lyckade). 

**Rekommendation (prioriterad):** behåll Mistral som primär leverantör, följt av Deepseek och Groq som sekundära alternativ; minska eller temporärt inaktivera Sambanova i fallback‑kedjan tills dess kvot‑ och prestandapro
