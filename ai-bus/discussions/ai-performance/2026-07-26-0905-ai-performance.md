---
date: 2026-07-26
type: ai-performance
overall_health_24h: 96.4
overall_health_7d: 97.6
total_calls_24h: 502
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["mistral", "github_models", "cloudflare", "groq", "sambanova", "cerebras", "gemini", "deepseek"]
config_uppdaterad: "2026-07-26 05:51 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 456
    ok: 456
    rate_limits: 0
    errors: 0
    snitt_ms: 1015
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
    anrop: 22
    ok: 22
    rate_limits: 0
    errors: 0
    snitt_ms: 2215
  sambanova:
    anrop: 19
    ok: 1
    rate_limits: 18
    errors: 0
    snitt_ms: 6335
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
  deepseek:
    anrop: 0
    ok: 0
    rate_limits: 0
    errors: 0
    snitt_ms: null
---

# AI Provider Performance — 2026-07-26

## Hälsostatus

🟢 **96.4%** lyckade anrop senaste 24h · 502 anrop totalt
🟢 **97.6%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 22 anrop · 22 (100%) OK · 0 (0%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop (24h) | OK | Rate-limits | Errors | Snitt-latens | Senaste benchmark |
|---|---|---|---|---|---|---|
| 🟢 `mistral` | 456 | 456 (100%) | 0 (0%) | 0 | 1015 ms | 100% ok · 1680 ms |
| ⚪ `github_models` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3130 ms |
| ⚪ `cloudflare` _(ej anropad)_ | – | – | – | – | – | 100% ok · 3420 ms |
| 🟢 `groq` | 22 | 22 (100%) | 0 (0%) | 0 | 2215 ms | 100% ok · 580 ms |
| 🔴 `sambanova` | 19 | 1 (5.3%) | 18 (94.7%) | 0 | 6335 ms | 100% ok · 1640 ms |
| ⚪ `cerebras` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `gemini` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |
| ⚪ `deepseek` _(ej anropad)_ | – | – | – | – | – | 0% ok · 0 ms |

## Nuvarande Fallback-ordning

`mistral → github_models → cloudflare → groq → sambanova → cerebras → gemini → deepseek`

*(Benchmark senast körde: 2026-07-26 05:51 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (913 anrop, 0 rl, 0 err)
  ⚪ github_models    ej anropad (7d)  ·  benchmark: 100% ok
  ⚪ cloudflare       ej anropad (7d)  ·  benchmark: 100% ok
  🟢 groq             100% ok   (42 anrop, 0 rl, 0 err)
  🔴 sambanova        31.4% ok   (35 anrop, 24 rl, 0 err)
  ⚪ cerebras         ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ gemini           ej anropad (7d)  ·  benchmark: 0% ok
  ⚪ deepseek         ej anropad (7d)  ·  benchmark: 0% ok
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 1/19 ok (5.3%), 18 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har plattformen hanterat 502 anrop med en hälsopoäng på 96,4 % (7‑dags‑genomsnitt 97,6 %). Mistral har dominerat med 456 anrop och 100 % framgång utan någon rate‑limit, medan Groq levererade 22 anrop på 2,2 s med samma 100 % framgång. Sambanova är den enda kritiska leverantören – endast 5,3 % av 19 anrop lyckades och 18 av dem träffade rate‑limit, vilket resulterade i genomsnitt 6,3 s svarstid. **Rekommendation:** behåll Mistral som primär provider, håll Groq som sekundär backup och flytta Sambanova längst ner i fallback‑kedjan eller ersätt den med en mer pålitlig leverantör.
