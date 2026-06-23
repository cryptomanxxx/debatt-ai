---
date: 2026-06-23
type: ai-performance
overall_health_24h: 94.6
overall_health_7d: 94.5
total_calls_24h: 606
total_calls_7d: 1000
groq_nycklar_konfigurerade: 9 + kanal-nyckel
problem_providers: ["sambanova"]
ranked_order: ["mistral", "deepseek", "github_models", "cloudflare", "groq", "sambanova", "cerebras", "gemini"]
config_uppdaterad: "2026-06-23 06:39 UTC"
order_source: "provider_config"
providers_24h:
  mistral:
    anrop: 410
    ok: 410
    rate_limits: 0
    errors: 0
    snitt_ms: 995
  groq:
    anrop: 145
    ok: 128
    rate_limits: 17
    errors: 0
    snitt_ms: 840
  sambanova:
    anrop: 51
    ok: 35
    rate_limits: 16
    errors: 0
    snitt_ms: 1839
---

# AI Provider Performance — 2026-06-23

## Hälsostatus

🟢 **94.6%** lyckade anrop senaste 24h · 606 anrop totalt
🟢 **94.5%** lyckade anrop senaste 7 dagar · 1000 anrop totalt

## Groq-nycklar

| Rotationsnycklar konfigurerade | Kanal-nyckel | Notis |
|---|---|---|
| **9** | ✅ konfigurerad | TPD-kvoten (~144k) gäller sannolikt per Groq-konto, inte per nyckel — flera nycklar ger ingen garanterad linjär kapacitetsökning |

**Groq (alla nycklar sammanlagt, 24h):** 145 anrop · 128 (88.3%) OK · 17 (11.7%) rate-limits · 0 fel

## Per-Provider Statistik (24h)

| Provider | Anrop | OK | Rate-limits | Errors | Snitt-latens |
|---|---|---|---|---|---|
| 🟢 `mistral` | 410 | 410 (100%) | 0 (0%) | 0 | 995 ms |
| 🟢 `groq` | 145 | 128 (88.3%) | 17 (11.7%) | 0 | 840 ms |
| 🟡 `sambanova` | 51 | 35 (68.6%) | 16 (31.4%) | 0 | 1839 ms |

## Nuvarande Fallback-ordning

`mistral → deepseek → github_models → cloudflare → groq → sambanova → cerebras → gemini`

*(Benchmark senast körde: 2026-06-23 06:39 UTC)*

## 7-Dagars Trend

```
  🟢 mistral          100% ok   (706 anrop, 0 rl, 0 err)
  🟡 groq             76.3% ok   (173 anrop, 38 rl, 3 err)
  🟢 deepseek         100% ok   (78 anrop, 0 rl, 0 err)
  🟡 sambanova        66.7% ok   (42 anrop, 14 rl, 0 err)
```

## ⚠️ Problemleverantörer

- **`sambanova`**: 35/51 ok (68.6%), 16 rate-limits, 0 errors

## Analys

Under de senaste 24 timmarna har Mistral levererat stabilast med 410 anrop och 100 % framgång utan någon rate‑limit, med en genomsnittlig svarstid på 995 ms. Groq har hanterat 145 anrop men visar en lägre pålitlighet (88,3 % ok) och har redan nått 17 rate‑limits, vilket indikerar att den nuvarande kvoten på ~144 k per konto snart kan bli en flaskhals. Sambanova är den tydligaste problemleverantören – endast 68,6 % av 51 anrop lyckas och den har 16 rate‑limits samt en hög svarstid på 1839 ms. **Rekommendation:** Prioritera Mistral för kritiska förfrågningar, minska beroendet av Sambanova och övervaka Groq‑kvoten noggrant; överväg att lägga till en extra Groq‑nyckel eller byta till nästa fallback (DeepSeek) för att säkra kapaciteten.
