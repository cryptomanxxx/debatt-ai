---
id: 2026-07-27-002
title: "Missing error handling"
type: bug
severity: medium
risk: low
file: nyheter.py
status: pending
created: 2026-07-27
---

## Problem

hamta_youtube_nyheter() fails silently when nyheter is undefined, causing potential data loss

## Föreslagen lösning

Add error handling with try-catch and logging for the undefined variable case. Pseudocode: try { nyheter = ... } catch (e) { logError(e); return [] }

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
