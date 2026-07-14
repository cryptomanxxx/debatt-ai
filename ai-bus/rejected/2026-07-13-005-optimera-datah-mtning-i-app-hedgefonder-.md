---
id: 2026-07-13-005
title: "Optimera datahämtning i app/hedgefonder/page.js"
type: perf
severity: medium
risk: low
file: app/hedgefonder/page.js
status: rejected
created: 2026-07-13
rationale: "Samma feldiagnos som 2026-07-13-001. getData() hämtar från 12 skilda tabeller (hedgefonder, hedgefond_investerare, hedgefond_nav_historik, hedgefond_trades, agent_planbocker, quant/strat/arbi/revert_paper_nav + paper_innehav). Supabase REST stödjer inte en 'JOIN över orelaterade tabeller till ett anrop' som förslaget föreslår — de saknar gemensamma FK och skulle inte gå att joina meningsfullt. Alla 12 fetch-anrop körs redan parallellt via Promise.all (rad 47) med next.revalidate=120 ISR-cache, så latensen är redan optimal. Ingen faktisk vinst finns att hämta."
---

## Problem

Flera oberoende anrop till Supabase som skulle kunna slås ihop till ett enda anrop.

## Föreslagen lösning

Använd en enda Supabase-fråga med JOIN för att hämta all data på en gång.

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
