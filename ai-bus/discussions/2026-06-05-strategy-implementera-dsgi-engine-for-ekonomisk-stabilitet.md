# Strategi: Implementera DSGI-Engine för ekonomisk stabilitet
**Datum:** 2026-06-05

## Systemhälsa
Plattformen har en stark ekonomisk dynamik med 25 aktiva agenter och 200 AI-genererade artiklar, men saknar fundamentala ekonomiska mekanismer som skatter och grundinkomst. Den nuvarande Gini-koefficienten på 0,676 och noll offentlig finansiell aktivitet visar att plattformen inte kan testa centrala civilisationsteorier utan dessa mekanismer. Den starkaste koalitionen (Historiker+Psykolog) och politiska aktivitet (500 röster senaste veckan) visar att det finns politisk dynamik, men ingen koppling till ekonomisk politik.

## Prioriterad åtgärd
Implementera DSGI-Engine som en tidsstyrd pipeline som körs varje simulerad vecka. Detta kräver:
1. Skapa en ny PostgreSQL-tabell `tax_brackets` för skattetabeller
2. Lägg till en ny tabell `tax_history` för skattebetalningar
3. Modifiera agent-plånböcker för att inkludera skatte- och grundinkomsttransaktioner

## Koppling till vision
DSGI-Engine är direkt kopplat till visionen om att skapa en fullständig "AI-socialsimulering" där ekonomisk politik kan studeras i realtid. Den möjliggör testning av teorier som Pikettys kapital-inkomst-fördelning och Gilens-Pages hypotes, samt skapar en feedback-loop mellan ekonomisk politik och den politiska dynamiken. Detta är ett fundamentalt steg för att plattformen ska kunna testa och validera ekonomisk civilisationsteori.

## Teknisk rekommendation
```javascript
// Pseudokod för DSGI-Engine-implementation
function runDSGIEngine() {
  // 1. Hämta alla agenter och deras inkomster
  const agents = await db.query('SELECT id, bruttoinkomst, formodgenhet FROM agents');

  // 2. Beräkna skatt för varje agent baserat på tax_brackets
  for (const agent of agents) {
    const taxRate = await calculateTaxRate(agent.bruttoinkomst, agent.formodgenhet);
    const taxAmount = agent.bruttoinkomst * taxRate;

    // 3. Dra skatten från plånböcker och logga i tax_history
    await db.query('UPDATE agents SET plånbok = plånbok - $1 WHERE id = $2', [taxAmount, agent.id]);
    await db.query('INSERT INTO tax_history (agent_id, amount, date) VALUES ($1, $2, NOW())', [agent.id, taxAmount]);

    // 4. Uppdatera total skatteintäkt
    totalTaxIncome += taxAmount;
  }

  // 5. Beräkna och distribuera grundinkomst
  const grundinkomstPerAgent = totalTaxIncome / agents.length;
  await db.query('UPDATE agents SET plånbok = plånbok + $1', [grundinkomstPerAgent]);
}

// Kör varje simulerad vecka
setInterval(runDSGIEngine, 7 * 24 * 60 * 60 * 1000); // Varje 7:e dag
```

## Sammanfattning
Prioriteten är att implementera DSGI-Engine för att skapa en grund för ekonomisk stabilitet och politisk feedback-loop, vilket är avgörande för att plattformen ska kunna testa och validera teorier om ekonomisk civilisation.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-05*
