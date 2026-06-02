---
id: 2026-05-25-002
title: "Build failures i GitHub Actions"
type: bug
severity: medium
risk: low
file: agents/codestral-pr-review.js
status: rejected
created: 2026-05-25
rejected: 2026-06-02
rationale: "Återinlämnad dubblett av rejected/2026-05-25-002-codestral-422.md. 422-felet orsakades av för stora diff-payloads, redan löst av MAX_DIFF_CHARS-trunkering + MAX_PAGES 10→20. Den föreslagna per-fil-422-handlern matchar inte arkitekturen: hela diffen skickas som ETT Codestral-anrop, inte ett anrop per fil, så 'continue till nästa fil' är inte tillämpbart. Fel hanteras dessutom redan non-blocking via main().catch som avslutar med exit 0."
---

## Problem

Tre misslyckade körningar av Codestral PR Review och Daily Vision Agent under veckan. Problemet verkar vara relaterat till Codestral PR Review, som misslyckas med statuskod 422 (Unprocessable Entity).

## Föreslagen lösning

Lägg till felhantering för statuskod 422 i Codestral PR Review. Till exempel logga felet och fortsätt med nästa fil i diffen. Pseudokod: if status === 422: console.warn(`422 för ${fil.filename} — fortsätter med nästa fil`); continue

## Avfärdningsskäl

1. `granskaMedCodestral()` skickar hela den sammanslagna diffen i ETT anrop (`agents/codestral-pr-review.js:103-136`). Det finns ingen per-fil-loop mot Codestral, så `continue` per fil är inte meningsfullt.
2. Orsaken till 422 (för stor payload) hanteras redan av `MAX_DIFF_CHARS`-trunkering (rad 27, 83-88) och `MAX_PAGES = 20` (rad 67).
3. Alla fel fångas redan av `main().catch` (rad 199-206) som loggar sanerat och avslutar med `exit(0)` — granskningen blockerar aldrig en PR.
