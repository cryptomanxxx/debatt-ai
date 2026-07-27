---
id: 2026-07-27-001
title: "Rate limit bypass risk"
type: security
severity: high
risk: medium
file: app/api/agent/submit/route.js
status: pending
created: 2026-07-27
---

## Problem

The VALID_AGENTS check only prevents invalid names but doesn't enforce rate limits per API key, allowing potential abuse through key rotation

## Föreslagen lösning

Add rate limiting per API key in resolveAgent() by tracking key usage in Supabase. Pseudocode: if (keyUsage[apiKey] > RATE_LIMIT) throw new Error('Rate limit exceeded')

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
