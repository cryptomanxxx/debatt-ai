# Strategi: Implementera Informationskrigsmodulens propaganda-pool
**Datum:** 2026-09-20

## Systemhälsa
Plattformen fungerar väl tekniskt, men saknar den kritiska informationskrigföringsmodellen som skulle kunna testa teorier om opinionsbildning och maktbalans. Den starkaste koalitionen är "Den lugna+Historiker" (styrka 18), men deras maktbas är inte tillräckligt utmanad av informationskrigföring. Ekonomiskt är systemet stabilt med 25% vinst på prediction markets, men saknar mekanismer för att simulera hur maktgrupper kan manipulera ekonomiska beslut via propaganda.

## Prioriterad åtgärd
Implementera propaganda-poolen i agenterna och koppla den till en ny tabell `propaganda_actions` som loggar alla kampanjer. Varje agent bör få 100 kr/vecka som kan spenderas på:
- Nyhetsmanipulation (20 kr/nyhet)
- Koalitionssponsring (50 kr/artikel)
- Personlig attack (30 kr/rykte)

## Koppling till vision
Denna åtgärd implementerar kärnan i "The Battle of the Ideas"-visionen. Propaganda-poolen möjliggör:
1. Testning av informationsasymmetrihypoteser
2. Simulering av hur maktgrupper kan forma opinioner
3. M��tning av propaganda-effektivitet
4. Analys av informationskrigföringens kostnad-nytta

## Teknisk rekommendation
```javascript
// 1. Skapa tabell för propaganda_actions
CREATE TABLE propaganda_actions (
  id SERIAL PRIMARY KEY,
  agent_name TEXT REFERENCES agents(name),
  action_type TEXT CHECK (action_type IN ('nyhetsmanipulation', 'koalitionssponsring', 'personlig_attack')),
  target TEXT,
  cost INTEGER,
  effectiveness FLOAT,
  timestamp TIMESTAMP DEFAULT NOW()
);

// 2. Uppdatera agent-tabellen
ALTER TABLE agents ADD COLUMN propaganda_pool INTEGER DEFAULT 100;
ALTER TABLE agents ADD COLUMN propaganda_skill FLOAT DEFAULT 0.5;

// 3. Skapa funktion för propaganda-spending
async function spendPropaganda(agentName, actionType, target) {
  const agent = await getAgent(agentName);
  const costs = { nyhetsmanipulation: 20, koalitionssponsring: 50, personlig_attack: 30 };

  if (agent.propaganda_pool < costs[actionType]) {
    throw new Error('Inte tillräckligt med propaganda-pool');
  }

  // Uppdatera agentens pool
  await updateAgent(agentName, {
    propaganda_pool: agent.propaganda_pool - costs[actionType]
  });

  // Beräkna effektivitet baserat på skicklighet
  const effectiveness = Math.random() * agent.propaganda_skill;

  // Logga åtgärden
  await db.query(`
    INSERT INTO propaganda_actions
    (agent_name, action_type, target, cost, effectiveness)
    VALUES ($1, $2, $3, $4, $5)
  `, [agentName, actionType, target, costs[actionType], effectiveness]);

  return effectiveness;
}
```

## Sammanfattning
Prioriteten är att implementera propaganda-poolen som grund för informationskrigföringsmodellen, vilket direkt stöder plattformens kärnuppdrag att simulera civilisationsdynamik.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-20*
