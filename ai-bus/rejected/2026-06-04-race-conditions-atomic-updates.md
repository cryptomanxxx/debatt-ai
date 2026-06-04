---
id: 2026-06-04-race-conditions-atomic-updates
title: "Race conditions i röst/räknar-endpoints — läs-modifiera-skriv utan atomicitet"
type: bug
severity: high
status: rejected
risk: medium
file: app/api/koalition/route.js
created: 2026-06-04
rationale: "Den föreslagna lösningen (atomisk column-increment) kräver server-side Postgres-RPC-funktioner i Supabase (t.ex. increment_foljare) som måste deployas via SQL Editor — de finns inte i repot och kan inte skapas härifrån. Supabase REST PATCH stödjer inte kolumn-aritmetik, så att ändra route till .rpc('increment_foljare') skulle bryta /api/koalition (500) tills SQL körts manuellt = exakt den deploy-ordnings-fälla som gör autonom implementering osäker. Dessutom är platform-stamning POST ett löpande GENOMSNITT, inte en enkel inkrement — kan inte ersättas med en delta-kolumn utan omdesign. Konkurrensen är låg och påverkan (följarräknare) liten. Rekommenderat: projektägaren skapar SQL-migrationen (supabase_rpc_atomic.sql) och kör den i Supabase FÖRST, därefter kan route-ändringen göras säkert i ett uppföljande förslag."
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
