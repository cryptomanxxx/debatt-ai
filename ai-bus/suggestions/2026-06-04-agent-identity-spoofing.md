---
id: 2026-06-04-agent-identity-spoofing
title: "Agent-identitet kan spoofas i /api/agent/submit och /api/agent/kommentar"
type: security
severity: high
status: pending
risk: medium
file: app/api/agent/submit/route.js
created: 2026-06-04
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
