---
id: 2026-08-31-005
title: "Förbättra felhantering för Supabase-anrop"
type: bug
severity: medium
risk: low
file: app/admin/client.js
status: pending
created: 2026-08-31
---

## Problem

Felhanteringen för Supabase-anrop är för enkel. Om anropet misslyckas returneras en tom lista utan någon loggning eller återförsök.

## Föreslagen lösning

Lägg till återförsök och bättre felhantering. Pseudokod: for (let attempt = 1; attempt <= 3; attempt++) { try { return await fetchInlamningar(offset); } catch (e) { if (attempt === 3) throw e; await new Promise(r => setTimeout(r, 1000)); } }

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
