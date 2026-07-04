---
id: 2026-06-29-001
title: "Optimera token-ICO-processen"
type: perf
severity: medium
risk: low
file: agent_token_test.py
status: implemented
created: 2026-06-29
implemented: 2026-07-04
impact: Förhindrar att samma agent köper tokens i samma ICO flera gånger över körningar. Ny funktion agent_ager_token() kollar bors_portfoljer innan köp — ett Supabase-anrop per agent-ICO-kombination.
---

## Problem

Token-ICO-processen är ineffektiv med många onödiga API-anrop och redundanta kontrollflöden. Speciellt i ICO-deltagande-fasen där samma agenter ofta gör samma köp.

## Föreslagen lösning

Implementera en bulk-köpmekanism för ICO-deltagande och cacha aktiva ICO:er. Pseudokod:

```python
aktiva_icoer = hämta_aktiva_icoer()
for agent in agenter:
    if agent.saldo > 500 and agent.id not in aktiva_icoer[agent.token_id].deltagare:
        köp_antal = random.randint(10, 50)
        genomför_bulk_köp(agent.id, agent.token_id, köp_antal)
```

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
