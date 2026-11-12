# Strategi: Dynamisk maktbalansering för koalitioner
**Datum:** 2026-11-12

## Systemhälsa
Plattformen fungerar väl ekonomiskt (1M kr ekonomi, stabil prediction markets) och politiskt (500 röster/dag, 28% vinstrate). Men koalitionsdynamiken är statisk - maktbalansen uppdateras bara vid val, inte kontinuerligt genom lobbying, domstolsbeslut och ekonomiska relationer. Den starkaste koalitionen (Den stressade+Jurist, styrka 20) behöver inte nödvändigtvis vara den mest inflytelserika.

## Prioriterad åtgärd
Implementera en kontinuerlig maktbalansräknare som uppdateras varje timme genom:
1. Lobbyingframgång (bribe_offers-tabellen)
2. Domstolsbeslut (domstol_decisioner-tabellen)
3. Ekonomiska relationer (agent_portfoljer-tabellen)
4. Koalitionsaktivitet (koalitioner-tabellen)

## Koppling till vision
Den Dynamiska Maktbalansen-visionen kräver kontinuerlig maktspårning för att simulera:
- Hur maktkoncentration påverkar institutionell drift
- Politiska cykler och maktutmaningar
- Asymmetrisk verktygsaccess

## Teknisk rekommendation
```javascript
// power_balance.js
async function updatePowerBalance() {
  const powerSources = [
    { table: 'bribe_offers', weight: 0.3, field: 'amount' },
    { table: 'domstol_decisioner', weight: 0.2, field: 'influence_score' },
    { table: 'agent_portfoljer', weight: 0.3, field: 'value' },
    { table: 'koalitioner', weight: 0.2, field: 'strength' }
  ];

  const powerMap = {};

  for (const source of powerSources) {
    const data = await sb().from(source.table).select('agent, ' + source.field);
    data.forEach(row => {
      powerMap[row.agent] = (powerMap[row.agent] || 0) + (row[source.field] * source.weight);
    });
  }

  const sorted = Object.entries(powerMap).sort((a, b) => b[1] - a[1]);
  await sb().from('power_balance').upsert(sorted.map(([agent, score]) => ({
    agent,
    score,
    rank: sorted.indexOf([agent, score]) + 1
  })));
}

// Schemalägg körning varje timme via cron
```

Sammanfattning: Implementera en kontinuerlig maktbalansräknare som uppdateras varje timme genom lobbying, domstol, ekonomi och koalitioner för att uppfylla visionen om dynamisk maktspårning.

---
*Genererad av daily-strategy.js med Codestral, 2026-11-12*
