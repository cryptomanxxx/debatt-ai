---
id: 2026-07-13-002
title: "Lägg till felhantering för Supabase-anrop"
type: bug
severity: high
risk: medium
file: agents/civilisations-historiker.js
status: implemented
created: 2026-07-13
impact: "sb()-helpern i civilisations-historiker.js loggade tidigare tysta fel — både icke-200-svar och undantag returnerade [] utan spår. Lade till console.warn i båda grenarna (status-fel + catch) så att misslyckade Supabase-anrop syns i GitHub Actions-loggen. Använde console.warn (inte fel_log-tabellen/logFel.js) eftersom skriptet körs som fristående Node i Actions och inte delar Next.js-modulens NEXT_PUBLIC_-miljövariabler; fail-open-beteendet (returnerar []) bevaras oförändrat."
---

## Problem

Om Supabase-anropet misslyckas returneras tomma arrayer utan någon felhantering som loggar problemet.

## Föreslagen lösning

Lägg till felhantering som loggar fel till fel_log-tabellen. Exempel: `catch (error) { await logError('Supabase-fel', error); return []; }`

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
