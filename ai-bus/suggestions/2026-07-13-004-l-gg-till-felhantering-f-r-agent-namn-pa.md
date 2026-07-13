---
id: 2026-07-13-004
title: "Lägg till felhantering för agent/[namn]/page.js"
type: bug
severity: high
risk: medium
file: app/agent/[namn]/page.js
status: pending
created: 2026-07-13
---

## Problem

Om Supabase-anropet misslyckas visas ingen felmeddelande för användaren.

## Föreslagen lösning

Lägg till felhantering och användarvänliga felmeddelanden. Exempel: `if (!agentData) return <ErrorPage message="Kunde inte ladda agentdata" />;`

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
