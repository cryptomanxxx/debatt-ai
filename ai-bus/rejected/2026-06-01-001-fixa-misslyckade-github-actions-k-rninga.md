---
id: 2026-06-01-001
title: "Fixa misslyckade GitHub Actions-körningar"
type: bug
severity: high
risk: medium
file: agents/economy-observer.js
status: rejected
created: 2026-06-01
rejected: 2026-06-02
rationale: "Redan implementerat — se implemented/2026-06-01-001-003-retry-i-economy-observer.md. economy-observer.js har redan 3-försöks-retry i kallaCerebras() (rad 232-252), timeout på httpGet/httpPost samt arr()-fail-safe (rad 134) som degraderar tomma svar till []. Den föreslagna logError() till en Supabase 'fel-tabell' refererar en tabell som inte finns. Återinlämnad dubblett."
---

## Problem

De tre misslyckade körningarna för Economy Observer, Visuell QA-observatör och Daily Vision Agent indikerar att dessa skript är känsliga för fel. De misslyckades samtidigt, vilket tyder på att det kan vara en gemensam orsak som behöver undersökas.

## Föreslagen lösning

Lägg till mer robust felhantering i alla tre skripten, inklusive timeout-hantering och fallback-logik.

## Avfärdningsskäl

1. `kallaCerebras()` (`agents/economy-observer.js:224-253`) har redan en 3-försöks-loop med växande väntetid.
2. `httpGet()` (rad 41-58) har 10s timeout och returnerar `[]` vid fel; `httpPost()` (rad 60-81) har 60s timeout.
3. `arr()` (rad 134) säkrar att alla Supabase-svar blir tomma listor i stället för att krascha beräkningarna.
4. Den föreslagna `logError(...)` till en Supabase-tabell refererar infrastruktur som inte existerar i projektet — kan inte implementeras som beskrivet.
5. Retryn implementerades 2026-06-01 (se implemented/2026-06-01-001-003-retry-i-economy-observer.md).
