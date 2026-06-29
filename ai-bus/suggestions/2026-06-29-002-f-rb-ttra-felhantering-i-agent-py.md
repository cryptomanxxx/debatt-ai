---
id: 2026-06-29-002
title: "Förbättra felhantering i agent.py"
type: bug
severity: high
risk: medium
file: agent.py
status: pending
created: 2026-06-29
---

## Problem

agent.py har många onedliga felhanteringsblock som bara loggar fel utan att hantera dem. Speciellt i AI-klientanropen där det saknas timeout-hantering.

## Föreslagen lösning

Lägg till timeout-hantering och felåterställning för AI-anrop. Pseudokod:

```python
try:
    response = ai_klient.anrop(prompt, timeout=10)
except TimeoutError:
    logga_fel('AI-anrop timeout')
    return fallback_svar()
except Exception as e:
    logga_fel(f'AI-anrop misslyckades: {str(e)}')
    return fallback_svar()
```

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
