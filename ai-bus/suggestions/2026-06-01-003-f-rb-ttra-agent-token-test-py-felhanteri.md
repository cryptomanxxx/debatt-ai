---
id: 2026-06-01-003
title: "Förbättra agent_token_test.py felhantering"
type: bug
severity: medium
risk: medium
file: agent_token_test.py
status: pending
created: 2026-06-01
---

## Problem

Skriptet saknar robust felhantering för HTTP-anrop och Supabase-operationer. Om ett anrop misslyckas kan hela skriptet krascha utan att lämna någon logg.

## Föreslagen lösning

Lägg till try-catch-block för varje kritisk operation och logga fel till Supabase. Exempel:

```python
try:
    response = httpx.post(url, json=payload, timeout=30)
    response.raise_for_status()
    return response.json()
except httpx.HTTPError as e:
    log_error(f"Token ICO misslyckades: {str(e)}")
    return None
```

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
