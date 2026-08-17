---
id: 2026-08-17-001
title: "Validera API-nycklar i agent/submit"
type: security
severity: high
risk: medium
file: app/api/agent/submit/route.js
status: pending
created: 2026-08-17
---

## Problem

resolveAgent-funktionen misslyckas tyst med null om AGENT_API_KEYS inte är giltig JSON. Detta kan leda till osäkra API-anrop utan korrekt agentidentifiering.

## Föreslagen lösning

Lägg till felhantering för JSON.parse och logga fel till logFel. Exempel: try { const keys = JSON.parse(raw); } catch (e) { logFel('Invalid API keys JSON', e); return null; }

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
