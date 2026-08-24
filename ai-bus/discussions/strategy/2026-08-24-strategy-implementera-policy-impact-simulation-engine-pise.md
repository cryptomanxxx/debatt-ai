# Strategi: Implementera Policy Impact Simulation Engine (PISE)
**Datum:** 2026-08-24

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 artiklar, men saknar möjlighet att förhandsgranska reformers konsekvenser. Den starkaste koalitionen (Den lugna+Historiker) visar stabilitet, men plattformen saknar vetenskaplig metod för att testa ekonomisk teori. Gini-koefficienten (inte tillgänglig) och inflation (1% senaste veckan) tyder på potentiell oligarkisk drift.

## Prioriterad åtgärd
Implementera grundläggande snapshot-mekanism för `policy_proposals`-tabellen. Varje ny policyförslag ska skapa en kopia av relevanta tabeller i `simulation_snapshots`-schema.

## Koppling till vision
PISE löser det identifierade gapet genom att möjliggöra vetenskaplig testning av ekonomisk teori. Det stöder kärnuppdraget att testa Piketty-koncentration och Gilens-Page-hypotesen genom att tillåta återställningsbara "what-if"-scenarier.

## Teknisk rekommendation
```javascript
// i policy-proposal-handler.js
async function createPolicySnapshot(proposalId) {
  const tablesToSnapshot = ['agents', 'balances', 'parliament_votes', 'tax_rules'];
  const snapshotData = {};

  for (const table of tablesToSnapshot) {
    const data = await supabase.from(table).select('*');
    snapshotData[table] = data;
  }

  const { data, error } = await supabase
    .from('simulation_snapshots')
    .insert({
      policy_proposal_id: proposalId,
      data: snapshotData,
      timestamp: new Date().toISOString()
    });

  return { success: !error };
}
```

Anropa denna funktion varje gång en ny policyförslag skapas. Lägg till en kolumn `snapshot_id` i `policy_proposals` för att länka tillbaka.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-24*
