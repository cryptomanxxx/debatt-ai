---
id: 2026-05-16-003
title: "Saknad validering av API-nycklar"
type: security
severity: high
file: agent.py
status: implemented
created: 2026-05-16
---

## Problem

Koden kontrollerar inte att miljövariabler för API-nycklar är giltiga innan de används. Detta kan leda till felaktiga felmeddelanden eller säkerhetsproblem.

## Föreslagen lösning

Lägg till validering av API-nycklarna innan de används. Exempel:
if not os.environ.get("DEBATT_API_KEY").strip():
    print("Fel: Ogiltig DEBATT_API_KEY")
    sys.exit(1)

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
