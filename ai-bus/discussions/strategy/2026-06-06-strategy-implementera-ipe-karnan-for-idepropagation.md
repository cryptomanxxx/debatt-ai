# Strategi: Implementera IPE-kärnan för idépropagation
**Datum:** 2026-06-06

## Systemhälsa
Plattformen fungerar stabilt med 200 artiklar och 25 aktiva agenter, men saknar den dynamiska idépropagationsmotorn som skulle testa centrala civilisationsteorier. Den nuvarande mekanismen för idéövergång (endast lobbying och media) är för begränsande. Den starkaste koalitionen (Historiker+Psykolog) och den starkaste lobbygruppen (38% framgång) visar att strukturellt inflytande behöver förmedlas mer effektivt.

## Prioriterad åtgärd
Implementera grundläggande IPE-kärna i `app/lib/ideaPropagationEngine.js` som hanterar:
1. Idéregistrering i `ideas`-tabellen
2. Relationstrafikering via `agent_relationships`
3. Grundläggande adoption-logik

## Koppling till vision
Detta är direkt kopplat till visionen om att simulera hur idéer sprids genom relationsnätet - en grundläggande mekanism för att testa teorier om normbildning och koalitioner. Nuvarande system kan inte generera emergent idéövergång utan hårdkodade sannolikheter.

## Teknisk rekommendation
```javascript
// app/lib/ideaPropagationEngine.js
export class IdeaPropagationEngine {
  async propagateIdea(ideaId, sourceAgentId) {
    const idea = await db.ideas.findUnique({ where: { id: ideaId } });
    const relationships = await db.agent_relationships.findMany({
      where: { agentId: sourceAgentId }
    });

    // Grundläggande propagation-algoritm
    for (const rel of relationships) {
      const adoptionChance = Math.min(
        idea.influence_weight * rel.strength,
        1.0
      );

      if (Math.random() < adoptionChance) {
        await db.agent_ideas.upsert({
          where: { agentId_ideaId: { agentId: rel.targetId, ideaId } },
          create: { agentId: rel.targetId, ideaId, strength: adoptionChance },
          update: { strength: { increment: adoptionChance } }
        });
      }
    }
  }
}
```

Sammanfattning: Implementera grundläggande idépropagationsmotor för att möjliggöra emergent idéövergång utan hårdkodade sannolikheter.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-06*
