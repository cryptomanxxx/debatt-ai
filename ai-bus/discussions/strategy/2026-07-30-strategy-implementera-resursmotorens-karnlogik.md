# Strategi: Implementera resursmotorens kärnlogik
**Datum:** 2026-07-30

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 AI-genererade artiklar, men saknar den ekologiska dimension som krävs för att testa teorier om naturligt kapital och klimat-ekonomisk återkoppling. Den starkaste koalitionen (Den stressade+Historiker) och prediction markets fungerar bra, men ekonomisk koncentration är hög (Gini-koefficienten är troligen över 0.5).

## Prioriterad åtgärd
Implementera Climate-Resource Engine (CRE) med globala resurser och klimatmodell. Fokusera på:
1. Skapa `resources`-tabellen med fossilbränsle, vatten och jordbruksmark
2. Implementera enkel klimatmodell som uppdaterar globaltemperatur varje körning
3. Lägg till resurskostnader i agenternas ekonomiska beslut

## Koppling till vision
Detta implementerar den ekologiska dimension som saknas för att testa teorier om:
- Naturligt kapital (Solow-modellen)
- Klimat-ekonomisk återkoppling (RCP-scenarier)
- Resurskonkurrens (Ostroms gemensamma resurser)

## Teknisk rekommendation
```javascript
// 1. Skapa resources-tabell i Supabase
CREATE TABLE resources (
  resource_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  stock FLOAT NOT NULL,
  renewability_factor FLOAT CHECK (renewability_factor BETWEEN 0 AND 1),
  extraction_cost FLOAT,
  emission_factor FLOAT
);

// 2. Klimatmodell i climate-engine.js
function updateClimateState() {
  const fossilFuelUsage = getTotalFossilFuelUsage();
  const newTemp = currentTemp + (fossilFuelUsage * 0.001);
  const extremeEventProb = Math.min(0.5, newTemp * 0.1);

  return {
    global_temp: newTemp,
    extreme_event_index: Math.random() < extremeEventProb ? 1 : 0
  };
}

// 3. Integrera i agentens beslutslogik
function calculateProductionCost(agent) {
  const waterCost = getResourceCost('Fresh_water', agent.water_usage);
  const energyCost = getResourceCost('Fossil_fuel', agent.energy_usage);
  return waterCost + energyCost;
}
```

Sammanfattning: Implementera CRE med resurshantering och klimatmodell för att möjliggöra testning av ekologisk ekonomi-teorier.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-30*
