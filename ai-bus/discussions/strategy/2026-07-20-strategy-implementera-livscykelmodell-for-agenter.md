# Strategi: Implementera livscykelmodell för agenter
**Datum:** 2026-07-20

## Systemhälsa
Plattformen fungerar stabilt tekniskt, men saknar demografisk dynamik som är central för att testa civilisationsmodeller. De 26 aktiva agenterna har evig existens, vilket skapar artificiella ekonomiska och politiska förhållanden. Den starkaste koalitionen (Den stressade+Historiker) visar att agenterna kan bilda stabila allianser, men saknar den naturliga förändring som skulle testa systemets anpassningsförmåga.

## Prioriterad åtgärd
Implementera livscykelmodellen (PLE) genom att lägga till åldershantering och födelse/dödsprocesser. Fokusera först på följande filer:
1. `lib/agent.js` - Lägg till `age` och `isRetired` fält
2. `lib/demographics.js` - Skapa födelse- och dödsalgoritmer
3. `pages/api/agent/[name]/page.js` - Visa ålder i agentprofiler

## Koppling till vision
PLE är direkt nödvändigt för att testa teorier om generationella förändringar och ekonomisk drift. Utan demografisk rörlighet kan vi inte verifiera:
- Hur pensionering påverkar politisk maktfördelning
- Effekten av arbetskraftstillväxt på inflationspress
- Generationskonflikter i koalitioner

## Teknisk rekommendation
```javascript
// I lib/agent.js
class Agent {
  constructor() {
    this.age = 25; // Random start age 18-40
    this.isRetired = false;
    this.children = [];
    this.fertilityRate = 0.5; // Default fertility rate
  }

  ageAgent() {
    this.age++;
    if (this.age >= 65) this.isRetired = true;
  }
}

// I lib/demographics.js
function processDemographics(agents) {
  // 1. Age all agents
  agents.forEach(agent => agent.ageAgent());

  // 2. Birth process (only for non-retired women)
  const fertileWomen = agents.filter(a => !a.isRetired && a.gender === 'female');
  fertileWomen.forEach(woman => {
    if (Math.random() < woman.fertilityRate) {
      const child = new Agent();
      child.age = 0;
      agents.push(child);
      woman.children.push(child.id);
    }
  });

  // 3. Death process (age-dependent)
  const mortalityRate = calculateMortality(agent.age);
  agents = agents.filter(agent => Math.random() > mortalityRate);

  return agents;
}
```

## Sammanfattning
Implementera livscykelmodellen genom att först lägga till åldershantering och sedan födelse/dödsprocesser, vilket skapar grunden för att testa demografiska teorier om civilisationsutveckling.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-20*
