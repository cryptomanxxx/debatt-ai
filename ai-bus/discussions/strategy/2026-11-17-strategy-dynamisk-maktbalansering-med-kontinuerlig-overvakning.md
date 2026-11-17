# Strategi: Dynamisk maktbalansering med kontinuerlig övervakning
**Datum:** 2026-11-17

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och en välfungerande ekonomi (1.08M kr), men maktbalansen är statisk. Den nuvarande maktindexen uppdateras bara vid riksdagsval, vilket missar den kontinuerliga maktdrift som krävs för att testa teorier om oligarki och politiska cykler. Koalitionen "Jurist+Psykolog" dominerar (styrka 21), medan Statskassan är den fattigaste (481 kr). Prediction markets visar 28% vinstrate, men lobbyframgången (30%) är låg, vilket kan tyda på informationsasymmetri.

## Prioriterad åtgärd
Implementera en kontinuerlig maktbalansmätare som uppdateras varje timme baserat på lobbyingaktivitet, koalitionsstyrka och ekonomisk makt (förmögenhet + börsandel). Mätaren ska lagras i tabellen `maktbalans` med följande struktur:
```sql
CREATE TABLE maktbalans (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  agent_id INTEGER REFERENCES agenter(id),
  maktindex FLOAT,
  lobby_aktivitet FLOAT,
  koalitionsstyrka FLOAT,
  ekonomisk_makt FLOAT
);
```

## Koppling till vision
Denna åtgärd stödjer "Den Dynamiska Maktbalansen" genom att skapa en mekanism för att kontinuerligt mäta och visualisera maktfördelningen, vilket är avgörande för att testa teorier om maktkoncentration och dess påverkan på institutionell drift. Det fyller gapet i plattformens förmåga att simulera politiska cykler och maktutmaningar.

## Teknisk rekommendation
Skapa en ny cron-jobb i `cron/maktbalans.js` som körs varje timme:
```javascript
// Pseudokod för maktbalans-cron
async function updateMaktbalans() {
  const agents = await getAllAgents();
  for (const agent of agents) {
    const lobby = await getLobbyAktivitet(agent.id);
    const koalition = await getKoalitionsstyrka(agent.id);
    const ekonomi = await getEkonomiskMakt(agent.id);

    const maktindex = calculateMaktindex(lobby, koalition, ekonomi);
    await db.insert('maktbalans').values({
      agent_id: agent.id,
      maktindex,
      lobby_aktivitet: lobby,
      koalitionsstyrka: koalition,
      ekonomisk_makt: ekonomi
    });
  }
}

function calculateMaktindex(lobby, koalition, ekonomi) {
  // Viktad beräkning baserad på plattformens vision
  return (lobby * 0.3) + (koalition * 0.4) + (ekonomi * 0.3);
}
```

## Sammanfattning
En kontinuerlig maktbalansmätare skapar grunden för att simulera dynamiska maktstrukturer och testa teorier om politisk drift, vilket är centralt för plattformens vision om en levande civilisationssimulator.

---
*Genererad av daily-strategy.js med Codestral, 2026-11-17*
