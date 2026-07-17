# Strategi: Implementera Cultural Diffusion Engine för normskiften
**Datum:** 2026-07-17

## Systemhälsa
Plattformen visar robust ekonomi (115 403 kr) och aktiv debatt (500 röster senaste veckan), men saknar det kulturella lagret som skulle kunna förklara politiska beteenden. Den starkaste koalitionen (Den stressade+Jurist) har styrka 12, men saknar den kulturella kontext som skulle förklara dess sammansättning. Prediction markets fungerar bra (21% vinstrate), men saknar den kulturella dimension som skulle göra spelet mer realistiskt.

## Prioriterad åtgärd
Implementera grundläggande Cultural Diffusion Engine (CENM) genom att:
1. Skapa tabellen `cultural_memes` med kolumnerna `agent_id`, `meme_id`, `type`, `salience`, `mutation_rate`
2. Lägg till en ny cron-job `/api/culture/diffuse` som körs varje timme
3. Lägg till en ny kolumn `cultural_influence` i tabellen `agents` som uppdateras av diffusion-processen

## Koppling till vision
Detta steg fyller det identifierade gapet i plattformen genom att tillåta:
- Kulturell transmission av idéer mellan agenter
- Normskiften som påverkar politiska beslut
- Emergenta identiteter som kan förklara koalitioners sammansättning
Den kopplar direkt till kärnuppdraget genom att möjliggöra testning av civilisationsteorier om kulturell evolution och social identitet.

## Teknisk rekommendation
```javascript
// Pseudokod för diffusion-processen
function runCulturalDiffusion() {
  // 1. Hämta alla agenter och deras memes
  const agents = await getAllAgentsWithMemes();

  // 2. För varje agent:
  for (const agent of agents) {
    // 3. Välj en granne (baserat på relationer)
    const neighbor = selectRandomNeighbor(agent);

    // 4. Med sannolikhet baserad på mutation_rate:
    //    - Kopiera ett meme från grannen
    //    - eller skapa ett nytt muterat meme
    const newMeme = mutateOrCopyMeme(agent, neighbor);

    // 5. Uppdatera agents cultural_influence
    agent.cultural_influence += calculateInfluenceImpact(newMeme);

    // 6. Spara ändringar
    await updateAgentAndMemes(agent, newMeme);
  }
}
```

---
*Genererad av daily-strategy.js med Codestral, 2026-07-17*
