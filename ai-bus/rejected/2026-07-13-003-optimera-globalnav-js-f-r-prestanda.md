---
id: 2026-07-13-003
title: "Optimera GlobalNav.js för prestanda"
type: perf
severity: medium
risk: low
file: app/GlobalNav.js
status: rejected
created: 2026-07-13
rationale: "Bygger på en feldiagnos. GlobalNav.js hämtar ingen navigationsdata — TOPP och GRUPPER är statiska const-arrayer i modulen, och enda useEffect hanterar klick-utanför för dropdowns. Det finns alltså ingen 'navigationsdata' att klient-cacha. Dynamisk import av navkomponenter vore direkt kontraproduktivt: navraden ligger alltid ovanför vikningen och behövs på varje sida — att lazy-loada den skulle ge layouthopp och sämre upplevd prestanda, inte bättre. De två delkomponenter som faktiskt hämtar data (NavArkivLink/NavHistorikLink) är redan separata klientkomponenter."
---

## Problem

Navigationsstrukturen är mycket komplex och renderas på varje sida, vilket kan påverka prestanda.

## Föreslagen lösning

Implementera dynamisk import för navigationskomponenter och lägg till klient-side caching av navigationsdata.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
