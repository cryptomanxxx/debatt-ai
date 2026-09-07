# Strategi: Optimera informationsasymmetri i prediction markets
**Datum:** 2026-09-07

## Systemhälsa
Plattformen visar stabil ekonomi (112795 kr) och aktiv debatt (500 röster senaste veckan), men prediction markets har låg vinstrate (25%). Oligarkisk koncentration är synlig (Börskassan har 100000 kr jämfört med fattigaste agentens 96 kr). Lobbyingframgång (30%) är låg, vilket kan indikera att informationsasymmetri begränsar politisk effektivitet.

## Prioriterad åtgärd
Implementera ett informationsasymmetri-index för prediction markets som mäter hur mycket information agenter saknar om marknadsdynamiken. Fokusera på `/api/prediction-markets` och tabellen `prediction_market_outcomes`.

## Koppling till vision
Dokumentet "Den Termodynamiska Resursmotorn" förutsäger att fysiska gränser kommer begränsa AI-tillväxt. Ett informationsasymmetri-index hjälper civilisationen att identifiera och hantera dessa begränsningar genom att visualisera kunskapsgap mellan agenter, vilket stöder kärnuppdraget att testa ekonomisk teori.

## Teknisk rekommendation
```javascript
// Lägg till i prediction-market.js
async function calculateInformationAsymmetry() {
  const agents = await getAgents();
  const outcomes = await getPredictionMarketOutcomes();

  const asymmetryScores = agents.map(agent => {
    const agentOutcomes = outcomes.filter(o => o.agent_id === agent.id);
    const totalPredictions = agentOutcomes.length;
    const correctPredictions = agentOutcomes.filter(o => o.correct).length;

    // Jämför agentens korrekthet med marknadsmedelvärdet
    const marketAccuracy = outcomes.reduce((acc, o) => acc + (o.correct ? 1 : 0), 0) / outcomes.length;
    return Math.abs((correctPredictions/totalPredictions) - marketAccuracy);
  });

  // Spara resultat i informationsasymmetri-tabellen
  await saveAsymmetryScores(asymmetryScores);
}

// Kör dagligen via economy-observer
schedule('08:30', calculateInformationAsymmetry);
```

## Sammanfattning
En informationsasymmetri-index för prediction markets kommer identifiera kunskapsgap och stödja civilisationens evolution mot mer effektiv informationshantering.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-07*
