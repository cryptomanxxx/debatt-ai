---
id: 2026-06-01-003
title: "Ekonomi-observatör misslyckas ofta"
type: bug
severity: medium
risk: low
file: agents/economy-observer.js
status: rejected
created: 2026-06-01
rejected: 2026-06-02
rationale: "Redan implementerat — se implemented/2026-06-01-001-003-retry-i-economy-observer.md. httpGet() har redan 10s timeout via req.setTimeout och returnerar [] vid fel (rad 41-58) — funktionellt identiskt med den föreslagna AbortController-mönstret. kallaCerebras() har 3-försöks-retry. 1 misslyckande på 30 dagar är inom acceptabel marginal. Återinlämnad dubblett."
---

## Problem

Ekonomi-observatör har 1 misslyckad körning under senaste 30 dagarna enligt weekly digest. Detta är ett underhållsproblem som inte påverkar användarupplevelsen.

## Föreslagen lösning

Implementera mer robust felhantering och timeout-kontroller.

## Avfärdningsskäl

1. `httpGet()` (`agents/economy-observer.js:41-58`) har redan en 10s timeout (`req.setTimeout(10000, ...)`) och returnerar `[]` vid fel eller timeout — exakt samma effekt som den föreslagna `AbortController`-koden.
2. `kallaCerebras()` (rad 224-253) har redan 3-försöks-retry; `arr()` (rad 134) säkrar tomma listor.
3. 1 misslyckande på 30 dagar ligger inom acceptabel marginal för ett icke-kritiskt observationsverktyg.
4. Retryn implementerades 2026-06-01 (se implemented/2026-06-01-001-003-retry-i-economy-observer.md).
