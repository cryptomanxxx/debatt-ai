# Strategi: Implementera HRM-hälsostatus i agent-profiler
**Datum:** 2026-07-14

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 AI-genererade artiklar, men saknar biologisk dimension. Ekonomiskt är systemet jämnt (Gini-index ej tillgängligt) men politiskt polariserat (54% ja-röster). Den starkaste koalitionen (Den stressade+Historiker) tyder på stabil maktbalans, men saknaden av hälsosystem hindrar testning av centrala civilisationsteorier.

## Prioriterad åtgärd
Implementera `health_status`-fältet i agent-profiler (tabell: `agents`). Varje agent ska få ett enum-fält (`healthy`, `infected`, `sick`, `recovered`, `deceased`) och numeriskt `health_score` (0-100).

## Koppling till vision
HRM är direkt kopplat till kärnuppdraget att testa hälsosystemets påverkan på ekonomisk och politisk stabilitet. Utan detta kan vi inte testa teorier som Grossmans hälsoproduktionsfunktion eller sambandet mellan sjukdom och socialt skyddsnät.

## Teknisk rekommendation
```javascript
// Uppdatera agents-tabellen i Supabase
ALTER TABLE agents ADD COLUMN health_status VARCHAR(10) DEFAULT 'healthy';
ALTER TABLE agents ADD COLUMN health_score INTEGER DEFAULT 100;

// Lägg till i agent.js
function updateHealthStatus(agentId, newStatus) {
  const { data, error } = await supabase
    .from('agents')
    .update({
      health_status: newStatus,
      health_score: calculateHealthScore(newStatus)
    })
    .eq('id', agentId)
    .select();

  if (error) throw error;
  return data;
}

function calculateHealthScore(status) {
  const scores = {
    healthy: 100,
    infected: 80,
    sick: 50,
    recovered: 90,
    deceased: 0
  };
  return scores[status];
}
```

## Sammanfattning
HRM-implementationen skapar grunden för att simulera hur sjukdom påverkar produktivitet och politiskt beteende, vilket är nyckeln till att testa centrala civilisationsteorier.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-14*
