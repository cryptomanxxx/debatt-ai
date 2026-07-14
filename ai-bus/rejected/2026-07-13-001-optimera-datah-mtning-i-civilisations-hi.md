---
id: 2026-07-13-001
title: "Optimera datahämtning i civilisations-historiker.js"
type: perf
severity: medium
risk: low
file: agents/civilisations-historiker.js
status: rejected
created: 2026-07-13
rationale: "Förslaget är faktiskt felaktigt. hämtaCivilisationsData() hämtar från 14 OLIKA tabeller (civilisations_minne, domstol_domar, kris_events, riksdagsval, politiska_partier, agent_planbocker, agent_koalitioner, lobbying_log, agent_roster_lag, bors_affarer, artiklar, strat/quant/revert_paper_nav). Supabase REST kan inte slå ihop frågor mot skilda tabeller till ett anrop, och den föreslagna exempel-frågan pekar på en 'händelser'-tabell som inte existerar. Anropen körs dessutom redan parallellt via Promise.all (rad 101), så latensen är redan minimerad — det finns ingen faktisk prestandavinst att hämta."
---

## Problem

Funktionen hämtaCivilisationsData() gör flera oberoende anrop till Supabase som skulle kunna slås ihop till ett enda anrop med komplexa filter.

## Föreslagen lösning

Använd en enda Supabase-fråga med komplexa filter istället för flera separata anrop. Exempel: `SELECT * FROM händelser WHERE typ IN ('artikel', 'debatt') AND skapad > '2026-07-01' ORDER BY skapad DESC`

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
