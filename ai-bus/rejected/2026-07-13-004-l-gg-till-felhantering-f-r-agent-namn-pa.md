---
id: 2026-07-13-004
title: "Lägg till felhantering för agent/[namn]/page.js"
type: bug
severity: high
risk: medium
file: app/agent/[namn]/page.js
status: rejected
created: 2026-07-13
rationale: "Felhantering finns redan och är redundant att lägga till. Sidan importerar och anropar notFound() — saknas agentprofilen (if (!profil) notFound()) visas Next.js standard-404-sida, vilket är precis det användarvänliga felmeddelandet förslaget efterlyser. Alla ~18 datahämtningsfunktioner (getAgentArtiklar, getAgentStats, getAgentPlanbok m.fl.) kontrollerar redan res.ok och fail-openar till [] / null / 0, så ett misslyckat Supabase-anrop kraschar aldrig sidan. Den föreslagna <ErrorPage>-komponenten existerar inte i kodbasen, och att införa den vore att duplicera notFound()-mönstret som redan används."
---

## Problem

Om Supabase-anropet misslyckas visas ingen felmeddelande för användaren.

## Föreslagen lösning

Lägg till felhantering och användarvänliga felmeddelanden. Exempel: `if (!agentData) return <ErrorPage message="Kunde inte ladda agentdata" />;`

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
