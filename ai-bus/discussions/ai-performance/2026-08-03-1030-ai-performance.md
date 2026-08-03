---
date: 2026-08-03
type: ai-performance
overall_health_24h: 99.8
overall_health_7d: 98.3
total_calls_24h: 593
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["mistral", "deepseek", "cloudflare", "groq", "sambanova", "cerebras", "github_models", "gemini"]
config_uppdaterad: "2026-08-03 06:02 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 565
    ok: 565
    rate_limits: 0
    errors: 0
    snitt_ms: 964
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
    anrop: 20
    ok: 20
    rate_limits: 0
    errors: 0
    snitt_ms: 2342
  sambanova:
    anrop: 3
    ok: 2
    rate_limits: 1
    errors: 0
    snitt_ms: 5220
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

# AI Provider Performance — 2026-08-03

## Hälsostatus

🟢 **99.8%** lyckade anrop senaste 24h · 593 anrop totalt
🟢 **98.3%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 20 anrop · 20 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 565 | 565 (100%) | 0 (0%) | 0 | 964 ms | 100% ok · 1210 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3090 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3690 ms |
| 🟢 `groq` | 20 | 20 (100%) | 0 (0%) | 0 | 2342 ms | 100% ok · 640 ms |
| 🟡 `sambanova` | 3 | 2 (66.7%) | 1 (33.3%) | 0 | 5220 ms | 100% ok · 1110 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → cloudflare → groq → sambanova → cerebras → github_models → gemini`

*(Benchmark senast körde: 2026-08-03 06:02 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (923 anrop, 0 rl, 0 err)
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (49 anrop, 0 rl, 0 err)
  🔴 sambanova        10.5% ok   (19 anrop, 17 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 2/3 ok (66.7%), 1 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har plattformen haft en hälsopoäng på 99,8 % och totalt 593 anrop, varav 565 (95 %) kördes via Mistral med fullständig framgång och en genomsnittlig svarstid på 964 ms. Groq levererade 20 anrop utan några rate‑limits men med en relativt hög svarstid på 2 342 ms, medan Sambanova visade tydliga problem: endast 2 av 3 anrop lyckades (66,7 %) och en rate‑limit inträffade med en medellatens på 5 220 ms. De övriga leverantörerna (DeepSeek, Cloudflare, Cerebras, GitHub‑models och Gemini) har inte anropats under perioden, men deras benchmark‑status indikerar full funktion. **Rekommendation:** prioritera att tillfälligt inaktivera Sambanova i fallback‑kedjan och ersätt den med en extra Groq‑nyckel (eller en ny konfigurerad ny
