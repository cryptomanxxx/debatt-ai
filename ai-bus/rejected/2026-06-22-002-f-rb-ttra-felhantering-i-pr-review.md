---
id: 2026-06-22-002
title: "Förbättra felhantering i PR-review"
type: bug
severity: high
risk: medium
file: agents/autofix-review.js
status: rejected
created: 2026-06-22
rejected: 2026-07-01
rationale: "Vagt och utan konkret brist. autofix-review.js har redan try/catch runt LLM-anropet (rad 174-184), yttersta main().catch (rad 225), och validerar svar med regex-extraktion + Array.isArray + fält-check + content.includes(fix.old) före varje replace (rad 191-216). 'JSON-schema-validering' och 'fallback-logik för oväntade svar' är luddiga tillägg som Codestral-promptens egna regler förbjuder ('inga luddiga förbättra felhantering'). Dubblett av 2026-06-15-002."
---

## Problem

autofix-review.js har flera felhanteringsluckor som kan leda till odefinierat beteende när GitHub API returnerar oväntade svar.

## Föreslagen lösning

Lägg till mer robust felhantering för GitHub API-anrop. Lägg till validering av API-svar och implementera fallback-logik för oväntade svar. Pseudokod: 1. Lägg till try-catch för alla GitHub API-anrop 2. Validera API-svar med JSON-schema 3. Implementera fallback-logik för oväntade svar 4. Lägg till detaljerade felmeddelanden för felsökning

## Avfärdningsskäl

1. **Ospecificerade "luckor":** Förslaget pekar inte ut någon konkret rad eller felväg. Codestral-promptens egna regler förbjuder luddiga "förbättra felhantering"-förslag.
2. **Validering finns redan:** LLM-svaret parsas defensivt (regex + `JSON.parse` i try/catch, rad 191-197), fixes valideras per objekt och `content.includes(fix.old)` kontrolleras före `replace` (rad 199-216).
3. **API-fel hanteras:** `ghApi` returnerar `[]`/rå-sträng vid parse-fel; `main` kollar `Array.isArray(comments)` (rad 101). Yttersta `main().catch` skriver fel till `/tmp` och avslutar rent.
