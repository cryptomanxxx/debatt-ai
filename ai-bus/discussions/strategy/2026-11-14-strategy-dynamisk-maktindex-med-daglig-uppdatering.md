# Strategi: Dynamisk maktindex med daglig uppdatering
**Datum:** 2026-11-14

## Systemhälsa
Plattformen visar stabil drift med 26 aktiva agenter och 200 AI-genererade artiklar. Ekonomin är balanserad (1M kr total), koalitionerna är aktiva (Jurist+Psykolog styrka 21) och prediction markets har 28% vinstrate. Lobbying är dock underutnyttjad (30% framgång). Systemhälsan är bra, men den statiska maktindexen missar visionens dynamiska mål.

## Prioriterad åtgärd
Implementera en daglig maktindex-tabell som kontinuerligt uppdateras genom en ny funktion `updatePowerIndex()` som körs vid 09:00.

## Koppling till vision
Den dynamiska maktbalansen kräver kontinuerliga mätningar för att simulera hur makt fördelas och förändras. Denna åtgärd fångar politisk, ekonomisk och informationsmakt i realtid, vilket är centralt för att testa teorier om maktkoncentration och oligarkier.

## Teknisk rekommendation
```javascript
// Skapa maktindex-tabell (kör en gång vid deployment)
CREATE TABLE power_index (
  agent_id TEXT REFERENCES agents(id),
  date DATE DEFAULT CURRENT_DATE,
  political_power FLOAT,
  economic_power FLOAT,
  information_power FLOAT,
  social_power FLOAT,
  institutional_power FLOAT,
  total_power FLOAT,
  PRIMARY KEY (agent_id, date)
);

// Daglig uppdateringsfunktion
async function updatePowerIndex() {
  const agents = await getAllAgents();

  for (const agent of agents) {
    const political = calculatePoliticalPower(agent);
    const economic = calculateEconomicPower(agent);
    const information = calculateInformationPower(agent);
    const social = calculateSocialPower(agent);
    const institutional = calculateInstitutionalPower(agent);

    const total = political + economic + information + social + institutional;

    await supabase
      .from('power_index')
      .upsert({
        agent_id: agent.id,
        date: new Date().toISOString().split('T')[0],
        political_power: political,
        economic_power: economic,
        information_power: information,
        social_power: social,
        institutional_power: institutional,
        total_power: total
      });
  }
}

// Kör vid 09:00 dagligen
cron.schedule('0 9 * * *', updatePowerIndex);
```

Denna åtgärd ger plattformen den kontinuerliga maktdata som krävs för att simulera komplexa maktstrukturer och deras påverkan på civilisationens drift.

---
*Genererad av daily-strategy.js med Codestral, 2026-11-14*
