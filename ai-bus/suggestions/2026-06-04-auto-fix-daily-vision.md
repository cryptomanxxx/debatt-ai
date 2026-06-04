---
id: 2026-06-04-auto-fix-daily-vision
title: "Daily Vision Agent kraschar vid Cerebras 429 — saknar retry och fallback"
type: bug
severity: medium
risk: low
file: agents/vision-agent.js
status: suggestion
created: 2026-06-04
---

## Problem

GitHub Actions-workflowen **Daily Vision Agent** (`daily-vision.yml`) misslyckades 2026-06-04 med exit code 1.

Felloggen visar att kraschen inte beror på ett kodfel utan på extern infrastruktur:

```
Cerebras misslyckades: Cerebras API 429: {"message":"We're experiencing high traffic
right now! Please try again soon.","type":"too_many_requests_error","param":"queue",
"code":"queue_exceeded"}
##[error]Process completed with exit code 1.
```

**Rotorsak:** Cerebras-API:et var tillfälligt överbelastat (`queue_exceeded`, HTTP 429). Detta är ett övergående externt fel — inget i koden är trasigt.

**Förvärrande designsvaghet:** `agents/vision-agent.js` anropar Cerebras *exakt en gång* i `callCerebras()` (rad 246–264) och vid första fel avbryts hela körningen direkt (`process.exit(1)`, rad 303–308). Det finns:
- **ingen retry/backoff** — ett enstaka transient 429 dödar körningen
- **ingen fallback-provider** — trots att CLAUDE.md dokumenterar en provider-fallback-kedja (Groq → Gemini → … → GitHub Models) och systerskriptet `daily-strategy.js` använder Codestral

Eftersom workflowen är idempotent (hoppar över om dagens fil redan finns) blir nettoeffekten att hela dagens vision uteblir när Cerebras har en trafiktopp.

## Föreslagen lösning

Gör `vision-agent.js` motståndskraftigt mot övergående provider-fel. Två steg, i prioritetsordning:

1. **Retry med exponentiell backoff på 429/5xx** (minimal, låg risk)
   - I `callCerebras()`: vid `status === 429` eller `status >= 500`, vänta och försök igen 2–3 gånger (t.ex. 5s, 15s, 30s) innan fel kastas. Detta löser den vanligaste varianten — en kortvarig trafiktopp.

2. **Fallback till Groq (och ev. Gemini)** (rekommenderas, något större ändring)
   - Lägg till en `callGroq(prompt)`-funktion som speglar `callCerebras()` (Groq finns redan som `GROQ_API_KEY` och används i hela plattformen).
   - I `main()`: om Cerebras misslyckas efter retries, anropa Groq i stället för att `process.exit(1)`. Uppdatera signatur-raden (`*Genererad av vision-agent.js med Cerebras…*`) så den speglar vilken modell som faktiskt användes.
   - Säkerställ att `GROQ_API_KEY` är tillgänglig i `daily-vision.yml` (lägg till i `env:` om den saknas).

Detta matchar plattformens redan dokumenterade fallback-arkitektur och gör att en enskild leverantörs trafiktopp inte längre tar ner den dagliga visionen.

**Ingen kodändring gjordes automatiskt** — felet är externt och fixen innebär ett designval (retry-policy + vilken fallback-leverantör som ska användas) som bör granskas av projektägaren innan implementering.
