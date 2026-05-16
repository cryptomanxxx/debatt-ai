---
id: 2026-05-16-004
title: "Saknad felhantering för filoperationer"
type: bug
severity: medium
file: agents/codestral-worker.js
status: rejected
created: 2026-05-16
---

## Problem

getChangedFiles() saknar felhantering. Om git-kommandot misslyckas kommer arbetaren att krascha.

## Föreslagen lösning

Lägg till try-catch för getChangedFiles() och logga felmeddelande. Exempel:

try {
  const changedFiles = getChangedFiles();
} catch (error) {
  console.error("Fel vid hämtning av ändrade filer:", error);
}

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
