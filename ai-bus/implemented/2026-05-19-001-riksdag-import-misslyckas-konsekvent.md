---
id: 2026-05-19-001
title: "Riksdag Import misslyckas konsekvent"
type: bug
severity: high
risk: medium
file: agent.py
status: implemented
created: 2026-05-19
---

## Problem

Riksdag Import misslyckas fem gånger på rad i GitHub Actions. Detta orsakar att uppdateringar av riksdagsdata saknas, vilket påverkar debattämnen och opinionsdata.

## Föreslagen lösning

Lägg till felhantering och retry-logik i uppdatera_riksdagen_utfall() med specifik hantering för RLS-fel. Exempel:

```python
def uppdatera_riksdagen_utfall():
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # befintlig kod
            return True
        except Exception as e:
            if 'row-level security' in str(e):
                logga_action('rls_fail', 'riksdag_import')
                time.sleep(5)
                continue
            raise
    return False
```

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
