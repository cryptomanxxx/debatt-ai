# Strategi: Implementera CMM:s minnesdecay-logik
**Datum:** 2026-11-08

## Systemhälsa
Plattformen fungerar grundläggande, men saknar kritisk funktion för att simulera kollektivt minne. Ekonomin är stabil (919325 kr), men koalitioner (Den stressade+Jurist) och partier saknar historisk kontext. Prediction markets har 28% vinstrate, men ingen mekanism för att minnet påverkar beslut. Lobbyingframgång är låg (30%), möjligen på grund av bristande historisk referens.

## Prioriterad åtgärd
Implementera minnesdecay-logik i `lib/memoryProcessor.js` för att uppdatera `memory_score` och `distortion_factor` baserat på `decay_rate`. Berör `civilisational_memory`-tabellen och `affected_agents`-fältet.

## Koppling till vision
CMM är central för att simulera hur minne påverkar ekonomisk politik och social stabilitet. Nuvarande system saknar mekanism för att minne försvinner eller förvrängs, vilket gör det omöjligt att testa teorier om institutionell drift eller historisk amnesi.

## Teknisk rekommendation
```
function processMemory() {
  const memories = await db.query('SELECT * FROM civilisational_memory WHERE memory_score > 0');

  for (const memory of memories) {
    const decayAmount = memory.decay_rate * 0.1; // 10% av decay_rate
    const newScore = Math.max(0, memory.memory_score - decayAmount);

    // Slumpmässig förvrängning baserat på distortion_factor
    const distortion = Math.random() < memory.distortion_factor ?
      generateDistortion(memory.event_type) : null;

    await db.query(`
      UPDATE civilisational_memory
      SET memory_score = $1, distortion = $2
      WHERE id = $3
    `, [newScore, distortion, memory.id]);

    // Uppdatera påverkade agenter
    for (const agent of memory.affected_agents) {
      await updateAgentMemory(agent, memory.event_id, newScore);
    }
  }
}

function generateDistortion(eventType) {
  // Implementera specifik förvrängning baserat på eventType
  // Exempel: "bankrun" → "det var bara en liten kris"
}
```

Sammanfattning: Implementera minnesdecay-logik för att skapa verkliga minnesförändringar i civilisationen.

---
*Genererad av daily-strategy.js med Codestral, 2026-11-08*
