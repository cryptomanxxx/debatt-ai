---
id: 2026-06-15-004
title: "Förbättra felhantering i Codestral-worker"
type: bug
severity: medium
risk: medium
file: agents/codestral-worker.js
status: rejected
created: 2026-06-15
rejected: 2026-07-01
rationale: "Redan implementerat. codestral-worker.js har 3-försöks-retry med backoff runt analyzeWithCodestral (rad 83-96), try/catch runt varje Supabase- och GitHub-anrop (sb() rad 156-161, fetchBuildFailures rad 194-219) samt MAX_CHARS_TOTAL-cap på kodblocket (rad 23, 135). Att GRADVIS ÖKA MAX_FILES/MAX_CHARS vid misslyckande är dessutom bakvänt — stora payloads är just det som orsakar fel, så man vill minska, inte öka."
---

## Problem

codestral-worker.js saknar robust felhantering för Codestral API-fel och misslyckas ofta när det försöker analysera stora kodbaser. Detta leder till avbrutna körningar och missade förslag.

## Föreslagen lösning

Lägg till detaljerad felhantering för Codestral API-anrop med retry-logik. Implementera en gradvis ökning av MAX_FILES och MAX_CHARS_TOTAL vid misslyckanden.

## Avfärdningsskäl

1. **Retry finns redan:** `analyzeWithCodestral` körs i en 3-försöks-loop med linjär backoff (rad 83-96), och avslutar rent om alla misslyckas.
2. **Felhantering finns redan:** `sb()` (rad 156-161) och `fetchBuildFailures` (rad 194-219) fångar alla fel och returnerar tomma listor; runtime- och build-data är helt valfria (rad 54-68).
3. **Storleksökning är bakvänt:** Att öka `MAX_FILES`/`MAX_CHARS_TOTAL` vid fel förvärrar problemet — stora payloads är själva felkällan. Nuvarande `MAX_CHARS_TOTAL=40000`-cap (rad 135) är rätt riktning.
