---
id: 2026-07-06-002
title: "Förbättra felhantering i agent.py"
type: bug
severity: high
risk: high
file: agent.py
status: pending
created: 2026-07-06
---

## Problem

agent.py har många onedliga felhanteringsblock som maskerar verkliga problem. Speciellt problematiskt när agenter försöker skapa tokens eller delta i ICO:er.

## Föreslagen lösning

Implementera en centraliserad felhanteringsmekanism för agent-aktiviteter. Pseudokod:

```python
class AgentError(Exception):
    def __init__(self, agent_id, activity, error):
        self.agent_id = agent_id
        self.activity = activity
        self.error = error
        log_error(self)

# Exempel på användning
try:
    create_token(agent)
except AgentError as e:
    handle_agent_error(e)
```

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
