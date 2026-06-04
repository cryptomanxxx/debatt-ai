---
id: 2026-06-04-race-conditions-atomic-updates
title: "Race conditions i röst/räknar-endpoints — läs-modifiera-skriv utan atomicitet"
type: bug
severity: high
status: pending
risk: medium
file: app/api/koalition/route.js
created: 2026-06-04
---

## Problem

Flera endpoints gör read → compute → PATCH utan atomisk operation:

- `/api/koalition` POST/DELETE: `getCount()` → `setCount(current ± 1)` — simultana requests
  kan tappa inkrements.
- `/api/amnesforslag/roster` (om den finns): samma mönster.
- `/api/argument-roster`: läser `roster`-fält, räknar +1, patchar.
- `/api/platform-stamning` POST: löpande genomsnitt beräknas i minnet och patchar.

## Föreslagen lösning

Skapa Supabase SQL-RPCs med `UPDATE ... SET foljare = foljare + 1 WHERE agent = $1` (atomic
column increment). Anropa dem via Supabase REST `/rpc/increment_foljare` istället för
read+patch. Supabase stöder detta via `supabase.rpc('increment_foljare', { agent_namn: '...' })`.

Alternativt: lägg `"Prefer": "resolution=merge-duplicates"` och använd upsert med delta-kolumn
om schemat tillåter.

Gäller `koalitioner.foljare`, `platform_stamning.(varde, antal_roster, roster_summa)` och
`argument_roster`-tabellens räknare.
