---
id: 2026-06-15-002
title: "Förbättra felhantering i PR-review"
type: bug
severity: high
risk: high
file: agents/autofix-review.js
status: rejected
created: 2026-06-15
rejected: 2026-07-01
rationale: "Missbeskriver filen. autofix-review.js hanterar INTE diffar — den läser inline-reviewkommentarer och per-fil-innehåll (rad 100-132), det finns ingen '28k tecken-diff'. LLM-anropet har redan try/catch med felutskrift till /tmp och process.exit(1) (rad 174-184), och fixes valideras med Array.isArray + content.includes före replace (rad 199-216). 'Dynamisk diff-storleksjustering' och 'exponentiell backoff' adresserar problem som inte finns i denna fil. risk:high utan konkret, verifierbar brist."
---

## Problem

autofix-review.js misslyckas ofta när det försöker analysera stora PR-diffar (över 28k tecken) och saknar robust felhantering för GitHub API-fel. Detta leder till avbrutna körningar och missade fixes.

## Föreslagen lösning

Lägg till dynamisk diff-storleksjustering baserat på LLM:s kapacitet. Implementera retry-logik med exponeriell backoff för GitHub API-anrop. Lägg till detaljerade felrapportering till GitHub Actions.

## Avfärdningsskäl

1. **Filen hanterar inga diffar:** `autofix-review.js` läser inline-reviewkommentarer (`ghApi(/pulls/.../comments)`, rad 100) och grupperar dem per fil, sedan hela filinnehållet (rad 128). Det finns ingen diff-hämtning och därmed ingen "28k tecken-diff" att storleksjustera.
2. **Felhantering finns redan:** LLM-anropet är inlindat i try/catch som skriver felet till `/tmp/autofix_output.txt` och avslutar rent (rad 174-184). Yttersta `main().catch` fångar allt övrigt (rad 225).
3. **Svarsvalidering finns:** Fixes valideras (`Array.isArray`, fält-check, `content.includes(fix.old)`) innan de appliceras (rad 199-216).
4. **risk:high utan konkret brist:** Förslaget beskriver hypotetiska problem för fel fil.
