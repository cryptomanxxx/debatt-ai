---
date: 2026-06-17
type: ai-performance
overall_health_24h: 95.5
overall_health_7d: 91
total_calls_24h: 1000
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["groq"]
ranked_order: ["groq", "sambanova", "mistral", "deepseek", "github_models", "cloudflare", "cerebras", "gemini"]
config_uppdaterad: "2026-06-17 08:21 UTC"
providers_24h:
  mistral:
    anrop: 807
    ok: 807
    rate_limits: 0
    errors: 0
    snitt_ms: 1091
  groq:
    anrop: 118
    ok: 73
    rate_limits: 43
    errors: 2
    snitt_ms: 691
  deepseek:
    anrop: 75
    ok: 75
    rate_limits: 0
    errors: 0
    snitt_ms: 2917
---

# AI Provider Performance — 2026-06-17

## Hälsostatus

🟢 **95.5%** lyckade anrop senaste 24h · 1000 anrop totalt
🟢 **91%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 118 anrop · 73 (61.9%) OK · 43 (36.4%) rate-limits · 2 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `mistral` | 807 | 807 (100%) | 0 (0%) | 0 | 1091 ms |
| 🟡 `groq` | 118 | 73 (61.9%) | 43 (36.4%) | 2 | 691 ms |
| 🟢 `deepseek` | 75 | 75 (100%) | 0 (0%) | 0 | 2917 ms |

## Nuvarande Fallback-ordning

`groq → sambanova → mistral → deepseek → github_models → cloudflare → cerebras → gemini`

*(Benchmark senast körde: 2026-06-17 08:21 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (463 anrop, 0 rl, 0 err)
  🟡 groq             78.6% ok   (243 anrop, 48 rl, 4 err)
  🟢 deepseek         100% ok   (212 anrop, 0 rl, 0 err)
  🔴 github_models    13.6% ok   (44 anrop, 0 rl, 38 err)
  🟢 sambanova        100% ok   (35 anrop, 0 rl, 0 err)
  🟢 codestral        100% ok   (3 anrop, 0 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`groq`**: 73/118 ok (61.9%), 43 rate-limits, 2 errors

## Analys

Under de senaste 24 timmarna har Groq visat betydande problem: av 118 anrop var endast 61,9 % framgångsrika och 43 anrop (≈36 %) träffade rate‑limit‑gränsen, vilket placerar Groq i problemkategorin (>30 % rl eller <50 % ok). Mistral presterade stabilt med 807 anrop, 100 % utan rate‑limits och en genomsnittlig svarstid på 1 091 ms, medan DeepSeek också levererade 100 % framgång men med en högre latens på 2 917 ms. Hälsopoängen för hela systemet ligger på 95,5 % (24 h) och 91 % (7 d), men den låga andelen lyckade anrop från Groq drar ner den totala pålitligheten. **Rekommendation:** prioritera Mistral som primär leverantör, flytta så mycket trafik som möjligt från Groq till Mistral (eller till DeepSeek om latens kan tolereras), och håll Gro
