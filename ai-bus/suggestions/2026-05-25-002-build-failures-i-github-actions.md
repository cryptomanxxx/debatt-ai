---
id: 2026-05-25-002
title: "Build failures i GitHub Actions"
type: bug
severity: medium
risk: low
file: agents/codestral-pr-review.js
status: pending
created: 2026-05-25
---

## Problem

Tre misslyckade körningar av Codestral PR Review och Daily Vision Agent under veckan. Problemet verkar vara relaterat till Codestral PR Review, som misslyckas med statuskod 422 (Unprocessable Entity).

## Föreslagen lösning

Lägg till felhantering för statuskod 422 i Codestral PR Review. Till exempel logga felet och fortsätta med nästa fil i diffen. Pseudokod: if status === 422: console.warn(`422 för ${fil.filename} — fortsätter med nästa fil`); continue

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
