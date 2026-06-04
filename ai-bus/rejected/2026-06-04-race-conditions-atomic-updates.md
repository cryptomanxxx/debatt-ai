---
id: 2026-06-04-race-conditions-atomic-updates
title: "Race conditions i röst/räknar-endpoints — läs-modifiera-skriv utan atomicitet"
type: bug
severity: high
status: rejected
risk: medium
file: app/api/koalition/route.js
created: 2026-06-04
rationale: "Race-condition-analysen är korrekt (getCount→setCount är icke-atomiskt), men den föreslagna fixen kan inte tillämpas säkert autonomt. Den kräver att Postgres-RPC:er (t.ex. increment_foljare) deployas i Supabase FÖRST — den här pipelinen kan inte köra SQL mot Supabase. Om route-koden ändras till att anropa /rpc/increment_foljare innan funktionen finns returnerar PostgREST 404 och koalition POST/DELETE går sönder i produktion. Förslaget är dessutom inte fokuserat: det spänner över flera endpoints (koalition.foljare, platform_stamning, argument_roster) = flera filer + flera SQL-funktioner. Faktisk påverkan är låg: berörda räknare är besökar-följarräknare skyddade av IP-rate-limit (10/timme), och en tappad inkrement är kosmetisk, inte datakorruption. Rekommendation: projektägaren skapar och kör en SQL-migration som definierar de atomiska increment-RPC:erna i Supabase, och DÄREFTER kan route-anropen växlas över i en separat, koordinerad ändring."
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
