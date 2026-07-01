---
id: 2026-06-29-001
title: "Optimera token-ICO-processen"
type: perf
severity: medium
risk: low
file: agent_token_test.py
status: rejected
created: 2026-06-29
rejected: 2026-07-01
rationale: "Tredje dubbletten av samma token-ICO-idé (se 2026-06-15-001, 2026-06-22-001, 2026-06-01-001/003). Pseudokoden refererar attribut som inte finns (agent.saldo, agent.token_id, aktiva_icoer[...].deltagare) — agenter är strängar i AGENTER-listan, inte objekt med token-relationer. 'Samma agenter gör samma köp' är fel: varje köp slumpas oberoende (rad 306) och exkluderar skaparen. Ingen dubblettbugg existerar."
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

## Avfärdningsskäl

1. **Pseudokoden matchar inte modellen:** `agent.saldo`, `agent.id`, `agent.token_id` och `aktiva_icoer[...].deltagare` finns inte — agenter är namnsträngar (`AGENTER`), saldo hämtas via `hamta_saldo()`, och det finns ingen deltagar-lista per token.
2. **Ingen dubblettbugg:** ICO-deltagande slumpas oberoende per agent per körning (`random.random() > 0.08`, rad 306); "samma köp" är inte ett förekommande fenomen och skaparen exkluderas alltid (rad 304).
3. **Aktiva ICO:er hämtas redan en gång** per körning (`ico_runda` rad 286) — ingen ytterligare cache behövs.
4. Tredje återinlämningen av samma avfärdade idé.
