# Strategi: Implementera demografisk livscykel för agentpopulationen
**Datum:** 2026-08-03

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 AI-genererade artiklar, men saknar demografisk dynamik som hindrar studier av intergenerationella fenomen. Ekonomiskt är systemet relativt jämnt (Gini-koefficient ej tillgänglig), men maktkoncentrationen är oroväckande med Börskassan som rikaste agenten. Koalitioner och riksdagsröster visar stabilitet, men den tidlösa agentpopulationen begränsar möjligheterna att testa teorier om åldersrelaterad maktfördelning.

## Prioriterad åtgärd
Implementera Generations-Motorn (G-Engine) genom att lägga till åldershantering och födelse/dödslogik i agentdatan.

## Koppling till vision
Den visionära dokumentet identifierar bristen på demografisk dynamik som ett centralt gap. G-Engine kommer:
1. Skapa realistisk åldersfördelning som påverkar beslutsfattande
2. Enablera studier av livscykelhypotesen och intergenerationella maktförhållanden
3. Ge grund för teoritester om befolkningsutveckling och arvsekonomi

## Teknisk rekommendation
```javascript
// 1. Lägg till demografiska fält i agent-tabellen
ALTER TABLE agents ADD COLUMN age INT DEFAULT 0;
ALTER TABLE agents ADD COLUMN deceased_at TIMESTAMP;
ALTER TABLE agents ADD COLUMN parent_id UUID REFERENCES agents(id);

// 2. Skapa demografisk tick-process (körs varje vecka)
function runDemographicTick() {
  // Uppdatera ålder
  await supabase
    .from('agents')
    .update({ age: sql`age + 1` })
    .neq('deceased_at', null);

  // Beräkna dödlighet
  const agents = await supabase.from('agents').select('*');
  for (const agent of agents) {
    const mortalityProb = calculateMortality(agent.age, agent.health_index);
    if (Math.random() < mortalityProb) {
      await supabase
        .from('agents')
        .update({ deceased_at: new Date() })
        .eq('id', agent.id);
    }
  }

  // Generera födslar
  const fertileAgents = agents.filter(a => isFertile(a.age, a.wealth));
  for (const parent of fertileAgents) {
    const fertilityProb = calculateFertility(parent.age, parent.wealth);
    if (Math.random() < fertilityProb) {
      await createChildAgent(parent.id);
    }
  }
}

// 3. Skapa ny agent (barn)
async function createChildAgent(parentId) {
  const parent = await supabase
    .from('agents')
    .select('*')
    .eq('id', parentId)
    .single();

  const child = {
    age: 0,
    parent_id: parentId,
    // Arvsmässiga egenskaper från förälder
    ideology: parent.ideology,
    // Slumpmässiga variationer
    personality: generateChildPersonality(parent.personality),
    // Standardvärden för barn
    wealth: 1000 // Grundinkomst för barn
  };

  await supabase.from('agents').insert(child);
}
```

---
*Genererad av daily-strategy.js med Codestral, 2026-08-03*
