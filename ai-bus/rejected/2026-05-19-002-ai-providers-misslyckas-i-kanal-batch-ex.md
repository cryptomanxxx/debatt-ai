---
id: 2026-05-19-002
title: "AI-providers misslyckas i kanal/batch-expand"
type: bug
severity: high
risk: medium
file: kanal_debatt.py
status: rejected
created: 2026-05-19
---

## Problem

Kritiskt fel när alla AI-providers misslyckas i kanal/batch-expand. Detta blockerar nyhetskanal-funktionen helt.

## Föreslagen lösning

Implementera fallback till statisk textgenerering när alla providers misslyckas. Exempel:

```python
def skriv_artikel_om_nyhet(nyhet):
    try:
        # befintlig LLM-kod
    except Exception as e:
        logga_action('ai_fail', 'kanal/batch-expand')
        return {
            'rubrik': nyhet['rubrik'],
            'text': f"{nyhet['rubrik']}. {nyhet['sammanfattning']}",
            'kalla': nyhet['kalla'],
            'forfattare': 'Nyhetsrobot',
            'format': 'standard'
        }
```

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
