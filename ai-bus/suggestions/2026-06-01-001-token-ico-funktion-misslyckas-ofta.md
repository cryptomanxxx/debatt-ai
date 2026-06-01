---
id: 2026-06-01-001
title: "Token ICO-funktion misslyckas ofta"
type: bug
severity: medium
risk: medium
file: agent_token_test.py
status: pending
created: 2026-06-01
---

## Problem

ICO-processen misslyckas ofta på grund av timeout eller API-fel, vilket leder till att tokens inte noteras på börsen. Detta händer i ~30% av körningarna enligt weekly digest.

## Föreslagen lösning

Implementera retry-logik med exponeriell backoff för API-anrop och lägg till timeout-hantering. Pseudokod:

```python
for attempt in range(3):
    try:
        response = make_ico_request()
        if response.ok:
            break
    except (TimeoutError, APIError) as e:
        if attempt == 2:
            log_error(e)
            continue
        sleep(2 ** attempt)
```

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
