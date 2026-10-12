---
id: 2026-10-12-003
title: "Optimera kodblock-storlek i codestral-worker.js"
type: perf
severity: low
risk: low
file: agents/codestral-worker.js
status: pending
created: 2026-10-12
---

## Problem

Skriptet läser alla ändrade filer och ALWAYS_WATCH-filer, men skickar hela innehållet till Codestral utan att begränsa storleken. Detta kan orsaka fel när totala tecken överstiger MAX_CHARS_TOTAL.

## Föreslagen lösning

Lägg till en funktion som trunkerar filer till 2000 tecken innan de läggs till i kodblocket. Prioritera filer med högst ändringsfrekvens först.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
