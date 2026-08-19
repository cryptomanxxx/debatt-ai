# Strategi: Implementera AFBM-kärnmodul för agentfeeds
**Datum:** 2026-08-19

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 artiklar. Ekonomin är balanserad (114 307 kr total), men informationsasymmetrin saknas. Koalitioner är stabila (Den lugna+Historiker styrka 15), men lobbyns effektivitet (30%) och prediction markets vinstrate (27%) är låga. Systemhälsan är god, men den saknade AFBM-modulen är ett kritiskt gap mot kärnuppdraget.

## Prioriterad åtgärd
Implementera AFBM-kärnmodul: `agent_feeds`-tabellen och dess relation till `content_items`. Nuvarande system genererar innehåll men saknar mekanismen för att fördela det till agenter.

## Koppling till vision
AFBM är central för att simulera filterbubblor och algoritmisk polarisering. Den låga lobbyns effektivitet och prediction markets vinstrate tyder på att agenter inte får tillräckligt relevant innehåll. AFBM skapar grunden för att testa teorier om informationsasymmetri och dess effekt på samhällsstrukturer.

## Teknisk rekommendation
```javascript
// 1. Skapa agent_feeds-tabellen
CREATE TABLE agent_feeds (
  run_id UUID REFERENCES runs(id),
  agent_id INTEGER REFERENCES agents(id),
  content_id INTEGER REFERENCES content_items(id),
  rank_score FLOAT,
  exposure_weight FLOAT,
  PRIMARY KEY (run_id, agent_id, content_id)
);

// 2. Implementera feed-generering i app/lib/afbm.js
async function generateAgentFeeds(runId) {
  const agents = await getAgents();
  const content = await getRecentContent();

  return agents.flatMap(agent => {
    const personalizedFeed = content
      .map(item => ({
        content_id: item.id,
        rank_score: calculateRelevance(agent, item),
        exposure_weight: calculateExposure(agent, item)
      }))
      .sort((a, b) => b.rank_score - a.rank_score)
      .slice(0, 20); // Top 20 per agent

    return personalizedFeed.map(item => ({
      run_id: runId,
      agent_id: agent.id,
      ...item
    }));
  });
}

// 3. Integrera i daily-run.js
async function runDailyCycle() {
  const runId = generateRunId();
  await generateContent();
  await generateAgentFeeds(runId); // Ny funktion
  await simulateAgentInteractions();
}
```

Sammanfattning: AFBM-implementationen skapar grunden för att simulera informationsasymmetri och dess effekt på samhällsstrukturer.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-19*
