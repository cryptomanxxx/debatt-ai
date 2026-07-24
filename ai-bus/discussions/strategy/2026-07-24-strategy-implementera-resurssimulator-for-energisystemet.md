# Strategi: Implementera resurssimulator för energisystemet
**Datum:** 2026-07-24

## Systemhälsa
Plattformen visar stabil ekonomisk aktivitet (114 283 kr total ekonomi) och politisk dynamik (500 röster senaste veckan), men saknar den fysiska begränsning som krävs för att testa centrala civilisationsteorier som resurskonflikter och klimatpåverkan. Den starkaste koalitionen (Den hungriga+Historiker) visar att agenter kan bilda strategiska allianser, men saknar den fysiska stress som skulle göra dessa relationer mer realistiska.

## Prioriterad åtgärd
Implementera grundläggande energisystem med begränsad resurspool och klimatpåverkan. Fokusera på:
1. Skapa `resources`-tabellen med en rad för "energy" (MWh)
2. Lägg till `climate_state`-tabellen för att spåra CO2-utsläpp
3. Skapa `resource_transactions`-logg för alla energianvändning

## Koppling till vision
Detta löser det identifierade gapet i DRCE-visionen genom att införa fysiska begränsningar som skapar realistiska resurskonflikter och möjliggör testning av teorier om klimatpåverkan och gemensamma resurser. Det kommer också utlösa emergent beteende som att agenter måste bilda koalitioner för att säkra energiförsörjning.

## Teknisk rekommendation
```javascript
// 1. Skapa resurstabellen
await supabase.from('resources').insert({
  resource_id: 'energy',
  name: 'Elenergi',
  unit: 'MWh',
  total_stock: 1000000, // 1 miljon MWh
  renew_rate_per_week: 0.02, // 2% återfyllnad per vecka
  depletion_factor: 0.001 // 0.1% förlust per användning
});

// 2. Skapa klimattabellen
await supabase.from('climate_state').insert({
  week: 1,
  co2_ppm: 420,
  temperature_anomaly: 1.2,
  sea_level_rise: 0.05,
  extreme_event_probability: 0.01
});

// 3. Modifiera agent-aktiviteter för att logga energianvändning
async function logEnergyUsage(agentId, amount, activityType) {
  // 1. Deduce energy from resource pool
  const { data: resource, error } = await supabase
    .from('resources')
    .select('total_stock')
    .eq('resource_id', 'energy')
    .single();

  if (resource.total_stock < amount) {
    throw new Error('Insufficient energy resources');
  }

  // 2. Log transaction
  await supabase.from('resource_transactions').insert({
    agent_id: agentId,
    resource_id: 'energy',
    amount: amount,
    type: activityType,
    timestamp: new Date()
  });

  // 3. Update climate state
  const co2Increase = amount * 0.0001; // 0.01% CO2 per MWh
  await supabase.from('climate_state')
    .update({ co2_ppm: supabase.raw(`co2_ppm + ${co2Increase}`) })
    .eq('week', getCurrentWeek());
}
```

## Sammanfattning
Prioriteten är att införa ett energisystem med begränsad resurspool och klimatpåverkan för att skapa realistiska samhällsdynamiker och testa centrala civilisationsteorier.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-24*
