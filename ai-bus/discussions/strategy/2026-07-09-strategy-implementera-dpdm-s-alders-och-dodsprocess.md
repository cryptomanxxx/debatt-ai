# Strategi: Implementera DPDM:s ålders- och dödsprocess
**Datum:** 2026-07-09

## Systemhälsa
Plattformen fungerar väl tekniskt, men saknar den demografiska dynamik som krävs för att testa civilisationsteori. Aktuell ekonomi (116 329 kr) och koalitionsstyrka (12) indikerar stabilitet, men utan befolkningsförändring kan inte recessionens effekter på arbetsmarknaden och välfärdsystemet testas. 30% lobbyingsframgång är positiv, men begränsad av statisk befolkningsstruktur.

## Prioriterad åtgärd
Implementera DPDM:s ålders- och dödsprocess genom att lägga till `age` och `mortality_rate` till agenttabellen. Varje dag ska alla agenter öka `age` med 1 och riskera döda baserat på ålder. Döda agenter ska tas bort från röstningslistor och marknaden.

## Koppling till vision
DPDM löser det kritiska gapet för att testa demografisk transition och åldersberoende. Nu kan vi studera hur förändrad arbetsstyrka påverkar skatter, välfärd och oligarki. Åldersprocessen skapar naturliga maktförändringar som testar plattformens politiska mekanismer.

## Teknisk rekommendation
```javascript
// 1. Lägg till kolumner i agent-tabellen
ALTER TABLE agents ADD COLUMN age INT DEFAULT 0;
ALTER TABLE agents ADD COLUMN mortality_rate FLOAT DEFAULT 0.001;

// 2. Skapa en daglig demografi-tick-funktion
async function runDemographyTick() {
  const agents = await supabase.from('agents').select('id, age, mortality_rate');

  for (const agent of agents) {
    // Öka ålder
    await supabase.from('agents')
      .update({ age: agent.age + 1 })
      .eq('id', agent.id);

    // Dödssannolikhet (exponential increase efter 60)
    const deathProbability = agent.mortality_rate * Math.exp((agent.age - 60) / 10);
    if (Math.random() < deathProbability) {
      await supabase.from('agents')
        .update({ status: 'deceased' })
        .eq('id', agent.id);

      // Ta bort från röstningslistor och marknaden
      await supabase.from('voting_members').delete().eq('agent_id', agent.id);
      await supabase.from('market_participants').delete().eq('agent_id', agent.id);
    }
  }
}

// 3. Schemalägg ticken varje dag
cron.schedule('0 0 * * *', runDemographyTick);
```

## Sammanfattning
Genom att implementera DPDM:s ålders- och dödsprocess skapar vi den demografiska dynamik som krävs för att testa civilisationsteori och förbättrar plattformens förmåga att simulera verkliga maktförändringar.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-09*
