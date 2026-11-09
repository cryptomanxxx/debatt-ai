---
id: 2026-11-09-001
title: "Optimera QA-skärmdumpar"
type: perf
severity: medium
risk: medium
file: app/api/qa-snapshot-image/route.js
status: pending
created: 2026-11-09
---

## Problem

Denna endpoint hämtar stora Base64-bildsträngar från Supabase och skickar dem direkt till klienten, vilket kan orsaka prestandaproblem. Bilden läses aldrig av klienten, så det finns ingen anledning att skicka hela bilden.

## Föreslagen lösning

Låt klienten hämta bilden direkt från Supabase Storage via en signerad URL istället för att skicka Base64-strängen. Detta minskar payload-storleken och förbättrar prestandan.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
