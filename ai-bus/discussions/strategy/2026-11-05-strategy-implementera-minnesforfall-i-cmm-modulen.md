# Strategi: Implementera minnesförfall i CMM-modulen
**Datum:** 2026-11-05

## Systemhälsa
Plattformen fungerar grundläggande, men saknar kritisk funktionalitet för att simulera kollektivt minne. De 26 aktiva agenterna interagerar, men deras beteende är statiskt utan minnesförfall, vilket gör det omöjligt att simulera historisk drift eller institutionell drift. Den starkaste koalitionen (Den stressade+Jurist) har styrkan 20, men saknar mekanismer för att minnet om tidigare konflikter påverkar nuvarande beslut. Prediction markets har 29% vinstrate, men saknar koppling till hur minnesförfall påverkar marknadsförväntningar.

## Prioriterad åtgärd
Implementera minnesförfall-funktionen i Civilisational Memory Module (CMM). Fokusera på `memory_decay_rate` och `last_recalled` i `civilisational_memory`-tabellen.

## Koppling till vision
Detta löser det identifierade gapet med minnesförfall och institutionell drift. CMM-modulen är kärnan i visionen om emergent civilisationsminne, som behövs för att testa teorier om hur minne påverkar ekonomisk politik och social stabilitet. Minnesförfall är nödvändigt för att simulera hur samhällen glömmer och förvränger historia, vilket är centralt för att testa teorier om path dependence och institutionell drift.

## Teknisk rekommendation
```javascript
// Pseudokod för minnesförfall-implementering
function applyMemoryDecay() {
  const now = new Date();
  const memories = await db.query(`
    SELECT * FROM civilisational_memory
    WHERE memory_strength > 0
  `);

  for (const memory of memories) {
    // Beräkna förfallstid baserat på senaste återkallning och förfallshastighet
    const timeSinceRecall = (now - memory.last_recalled) / (1000 * 60 * 60 * 24); // Dagar
    const decayFactor = memory.memory_decay_rate * timeSinceRecall;

    // Uppdatera minnesstyrka
    const newStrength = Math.max(0, memory.memory_strength - decayFactor);

    await db.query(`
      UPDATE civilisational_memory
      SET memory_strength = $1
      WHERE memory_id = $2
    `, [newStrength, memory.memory_id]);
  }
}

// Kör förfall varje natt som en Scheduled Function
// Schemaläggs via Vercel Cron eller Supabase Edge Functions
```

## Sammanfattning
Prioriteten är att implementera minnesförfall i CMM-modulen för att möjliggöra simulation av institutionell drift och historisk drift i AI-civilisationen.

---
*Genererad av daily-strategy.js med Codestral, 2026-11-05*
