---
date: 2026-07-31
type: ai-performance
overall_health_24h: 100
overall_health_7d: 98.3
total_calls_24h: 519
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: []
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "sambanova", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-07-31 05:55 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 485
    ok: 485
    rate_limits: 0
    errors: 0
    snitt_ms: 1037
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
    anrop: 30
    ok: 30
    rate_limits: 0
    errors: 0
    snitt_ms: 2010
  sambanova:
    anrop: 2
    ok: 2
    rate_limits: 0
    errors: 0
    snitt_ms: 2966
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

# AI Provider Performance — 2026-07-31

## Hälsostatus

🟢 **100%** lyckade anrop senaste 24h · 519 anrop totalt
🟢 **98.3%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 30 anrop · 30 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 485 | 485 (100%) | 0 (0%) | 0 | 1037 ms | 100% ok · 1060 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 2850 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3530 ms |
| 🟢 `groq` | 30 | 30 (100%) | 0 (0%) | 0 | 2010 ms | 100% ok · 550 ms |
| 🟢 `sambanova` | 2 | 2 (100%) | 0 (0%) | 0 | 2966 ms | 100% ok · 1500 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → sambanova → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-07-31 05:55 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          99.9% ok   (922 anrop, 0 rl, 1 err)
  🟢 deepseek         100% ok   (1 anrop, 0 rl, 0 err)
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (53 anrop, 0 rl, 0 err)
  🔴 sambanova        11.1% ok   (18 anrop, 16 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ✅ Inga kritiska problem

Alla aktiva providers inom normala parametrar.

## Analys

Under de senaste 24 timmarna har **Mistral** hanterat majoriteten av trafiken (485 anrop) med 100 % framgång och en genomsnittlig svarstid på 1 037 ms, vilket gör den till den mest pålitliga leverantören. **Groq** har levererat 30 anrop utan några rate‑limits, men svarstiden ligger på 2 010 ms, vilket är betydligt högre än Mistral och kan börja påverka användarupplevelsen. **Sambanova** har bara använts två gånger och visar en svarstid på 2 966 ms, medan **Deepseek**, **Cloudflare**, **Cerebras**, **GitHub‑models** och **Gemini** ännu inte har anropats och därför saknar aktuell prestandadata. 

**Rekommendation (prioriterad):** behåll Mistral som primär provider, men inför en aktiv fallback till Deepseek eller Cloudflare för att minska latensen
