# Strategi: Implementera CO₂-utsläppsrapportering för alla agenter
**Datum:** 2026-08-04

## Systemhälsa
Plattformen fungerar väl ekonomiskt och politiskt, men saknar helt ekologiskt lager som skulle testa teorier om klimatpolitik. De 26 aktiva agenterna producerar och handlar utan utsläppskostnader, vilket gör det omöjligt att observera hur civilisationen skulle reagera på klimatstress. Den starkaste koalitionen (Den stressade+Historiker) har styrka 14, men saknar mekanismer för att hantera potentiella klimatkatastrofer. Prediction markets har 32% vinstrata, men saknar klimatrelevant data.

## Prioriterad åtgärd
Implementera ett system för att spåra varje agents CO₂-utsläpp varje vecka. Skapa en tabell `agent_emissions` som loggar utsläpp per agent per vecka, och uppdatera `climate_state` varje vecka med globala CO₂-stockar och temperaturanomalier.

## Koppling till vision
Detta är direkt kopplat till EIC-M visionen om att införliva ekologisk ekonomi i simuleringen. Utsläppsdata kommer testa teorier om tragedin om de gemensamma resurserna och institutionell anpassning, vilket är centralt för k��rnuppdraget att testa ekonomisk civilisationsteori.

## Teknisk rekommendation
```javascript
// 1. Skapa emissions-tabell
CREATE TABLE agent_emissions (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id),
  week INTEGER,
  co2_kg FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

// 2. Lägg till utsläppslogik i agent-handlingar
function calculateEmissions(agentId, activity) {
  const co2PerUnit = {
    'production': 0.5, // kg CO₂ per enhet
    'trade': 0.1,
    'lobbying': 0.05
  };

  const emissions = activity.units * co2PerUnit[activity.type];

  await supabase
    .from('agent_emissions')
    .insert({
      agent_id: agentId,
      week: getCurrentWeek(),
      co2_kg: emissions
    });

  return emissions;
}

// 3. Uppdatera klimatstatus varje vecka
async function updateClimateState() {
  const totalEmissions = await supabase
    .from('agent_emissions')
    .select('co2_kg')
    .eq('week', getCurrentWeek())
    .then(res => res.data.reduce((sum, row) => sum + row.co2_kg, 0));

  const currentState = await supabase
    .from('climate_state')
    .select('*')
    .order('week', { ascending: false })
    .limit(1)
    .single();

  const newCo2 = currentState.co2_stock_ppm + (totalEmissions * 0.0000044);
  const newTemp = currentState.temp_anomaly_c + (totalEmissions * 0.00000001);

  await supabase
    .from('climate_state')
    .insert({
      week: getCurrentWeek() + 1,
      co2_stock_ppm: newCo2,
      temp_anomaly_c: newTemp,
      disaster_severity: calculateDisasterRisk(newCo2, newTemp)
    });
}
```

**Sammanfattning:** Implementera CO₂-spårning för att skapa grunden för klimatpolitik-testning, vilket är direkt relevant för EIC-M visionen och kärnuppdraget att testa ekonomisk civilisationsteori.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-04*
