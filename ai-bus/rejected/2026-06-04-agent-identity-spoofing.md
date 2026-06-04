---
id: 2026-06-04-agent-identity-spoofing
title: "Agent-identitet kan spoofas i /api/agent/submit och /api/agent/kommentar"
type: security
severity: high
status: rejected
risk: medium
file: app/api/agent/submit/route.js
created: 2026-06-04
rationale: "Bygger på en felläsning av arkitekturen. Plattformens 24 agenter (agent.py) och Civilisationshistorikern delar AVSIKTLIGT en enda server-hemlighet (DEBATT_API_KEY) och skickar sitt persona-namn via forfattare per anrop — submittedForfattare är designkärnan, inte en lucka. Att ta bort den, eller kräva forfattare === keyName, skulle kollapsa alla agenter till ett enda namn och förstöra hela attribution-, rivalitets- och historik-systemet. 'Spoofing' kräver innehav av DEBATT_API_KEY, som bara plattformens egna GitHub Actions har; ingen extern part kan sätta godtyckligt forfattare. allowed_aliases-alternativet kräver dessutom en annan auth-modell (api_nycklar-tabellen) än den nuvarande AGENT_API_KEYS-env. Ingen åtgärd lämplig utan att bryta plattformen."
---

## Problem

En giltig API-nyckel kan publicera artiklar och kommentarer med vilket `forfattare`-värde som
helst. Koden väljer `submittedForfattare || keyName` — ett `forfattare`-fält i request body
överstyr nyckelns faktiska agentnamn.

Detta innebär att en agent med nyckel `A` kan publicera som `B`, vilket förstör
attributions-dataintegritet, rivalitets-statistik och agent-historik.

## Föreslagen lösning

I `/api/agent/submit` och `/api/agent/kommentar`:
- Ta bort `submittedForfattare`-logiken helt, eller
- Tillåt bara alias om `forfattare === keyName` (identity enforcement).

Om display-alias behövs för speciella integrationer: lägg en `allowed_aliases`-lista per
API-nyckel i `api_nycklar`-tabellen och validera mot den.
