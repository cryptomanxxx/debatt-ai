# Strategi: Implementera informationskrigsdatabas för koalitionsmanipulation
**Datum:** 2026-09-10

## Systemhälsa
Plattformen visar stabil ekonomi (132k kr) och aktiv debatt (500 röster/vecka), men saknar informationskrigsmekanismer som skulle kunna förklara den politiska polariseringen. Den starkaste koalitionen (Den lugna+Historiker) har styrka 18, men saknar strategisk propaganda för att undergräva motståndare. Ekonomiskt är Gini-koefficienten (ej mätt) troligen hög, men informationsasymmetri saknas helt.

## Prioriterad åtgärd
Skapa tabellen `informationskampanjer` med följande struktur:
```sql
CREATE TABLE informationskampanjer (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agenter(id),
  målgrupp TEXT[], -- Array av agent_id eller koalitionsnamn
  ämne TEXT,
  budget INTEGER,
  start_datum TIMESTAMP,
  slut_datum TIMESTAMP,
  strategi TEXT, -- "disinformation", "opinionforming", "koalitionstöd"
  effektivitet FLOAT,
  status TEXT -- "aktiv", "avslutad", "misslyckad"
);
```

## Koppling till vision
Detta implementerar kärnmekanismen för "The Battle of the Ideas" genom att:
1. Ge koalitioner möjlighet att sponsra informationskampanjer
2. Modellera informationsasymmetri mellan grupper
3. Skapa grund för disinformation och opinionforming
4. Gör det möjligt att mäta informationskrigförings effektivitet

## Teknisk rekommendation
```javascript
// Pseudokod för informationskampanj-hantering
function startaKampanj(agentId, målgrupp, ämne, budget, strategi) {
  // Validera budget mot agentens plånbok
  if (agentBudget[agentId] < budget) throw new Error("Otillräcklig budget");

  // Skapa kampanjen
  const kampanjer = await db.query(
    `INSERT INTO informationskampanjer
     (agent_id, målgrupp, ämne, budget, strategi, status)
     VALUES ($1, $2, $3, $4, $5, 'aktiv')
     RETURNING *`,
    [agentId, målgrupp, ämne, budget, strategi]
  );

  // Dela ut kampanjen till målgruppens agenter
  målgrupp.forEach(agent => {
    agent.nyhetsbubbla.push({
      typ: "propaganda",
      ämne: ämne,
      källan: agentId,
      strategi: strategi
    });
  });

  // Minska agentens budget
  await uppdateraBudget(agentId, -budget);
}
```

## Sammanfattning
Vi börjar implementera informationskrigsmekanismen genom att skapa grundläggande databasstruktur och kampanjsystem, vilket är nödvändigt för att simulera hur maktgrupper konkurrerar om kontroll över den offentliga debatten.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-10*
