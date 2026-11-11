# Strategi: Dynamisk maktbalansmodul för kontinuerlig övervakning
**Datum:** 2026-11-11

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 artiklar, men saknar kontinuerlig maktövervakning. Den statiska maktindexen uppdateras bara vid val, vilket missar den dynamiska maktdriften. Ekonomiskt sett dominerar Börskassan (100140 kr) medan Statskassa (162 kr) är nästan bankrutt. Koalitionen Den stressade+Jurist styr med styrka 20, men deras maktrelationer är inte kontinuerligt dokumenterade. Prediction markets har 28% vinst, men lobbyns effekt (30%) är svår att mäta.

## Prioriterad åtgärd
Implementera en kontinuerlig maktbalansmodul som uppdateras varje timme i `maktbalans-engine.js`. Den ska:
1. Beräkna en dynamisk maktindex för varje agent (0-100) baserat på:
   - Politisk makt (riksdagsmandat × 0.5 + lobbyinflytande × 0.3 + domstolsbeslut × 0.2)
   - Ekonomisk makt (förmögenhet × 0.4 + börsandel × 0.3 + lånestatus × 0.3)
   - Informationsmakt (verktygsaccess × 0.5 + informationsspridning × 0.5)
2. Skapa en relationsgraf som visualiserar maktflöden mellan agenter
3. Generera en daglig maktrapport som identifierar maktkoncentration och oligarkier

## Koppling till vision
Denna åtgärd implementerar kärnvisionen om "Den Dynamiska Maktbalansen" genom att:
- Fånga kontinuerliga maktförändringar som tidigare saknades
- Gör det möjligt att simulera hur maktfördelning påverkar institutionell drift
- Ger data för att testa teorier om oligarki och politisk cykler
- Skapar grunden för att analysera hur informationsmakt korrelerar med politisk makt

## Teknisk rekommendation
```javascript
// Pseudokod för maktbalans-engine.js
function calculatePowerIndex(agentId) {
  const politicalPower = (agent.riksdagsmandat * 0.5) +
                         (agent.lobbyinflytande * 0.3) +
                         (agent.domstolsbeslut * 0.2);

  const economicPower = (agent.förmögenhet * 0.4) +
                        (agent.börsandel * 0.3) +
                        (agent.lånestatus * 0.3);

  const infoPower = (agent.verktygsaccess * 0.5) +
                    (agent.informationsspridning * 0.5);

  return (politicalPower + economicPower + infoPower) / 3;
}

function generatePowerReport() {
  const agents = getAllAgents();
  const powerData = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    powerIndex: calculatePowerIndex(agent.id),
    relations: getAgentRelations(agent.id)
  }));

  const oligarchyScore = calculateOligarchyScore(powerData);
  const powerFlowGraph = createPowerFlowGraph(powerData);

  return {
    date: new Date(),
    powerDistribution: powerData,
    oligarchyScore,
    powerFlowGraph,
    topAgents: getTopAgents(powerData, 5)
  };
}

// Schemalägg körning varje timme
setInterval(() => {
  const report = generatePowerReport();
  saveToDatabase(report);
  updatePowerVisualization(report.powerFlowGraph);
}, 3600000);
```

---
*Genererad av daily-strategy.js med Codestral, 2026-11-11*
