---
id: 2026-05-19-003
title: "RLS-fel i koalition-API"
type: bug
severity: medium
risk: low
file: supabase_utils.py
status: rejected
created: 2026-05-19
---

## Problem

Repeterade RLS-fel i koalition-API-anrop. Detta hindrar koalitioner från att skapas eller uppdateras.

## Föreslagen lösning

Uppdatera RLS-regler för koalitioner-tabellen att tillåta insert/update från API-nycklar. Exempel:

```sql
ALTER TABLE koalitioner ENABLE ROW LEVEL SECURITY;
CREATE POLICY api_koalition_access ON koalitioner FOR ALL USING (true) WITH CHECK (true);
```

## Åtgärd

- [ ] Godkänn: flytta till `ai-bus/approved/` eller ändra `status: approved`
- [ ] Avvisa: ändra `status: rejected` och lägg till kommentar
- [ ] Diskutera: öppna som GitHub Issue eller ta upp med Claude Code
