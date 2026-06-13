# Strategi: Implementera korruptionsmotor i parlamentets beslutsprocess
**Datum:** 2026-06-13

## Systemhälsa
Plattformen fungerar grundläggande, men saknar den kritiska mekanismen för korruption som skulle testa teorier om maktkoncentration och politisk stabilitet. Aktuell ekonomi är stabil (12621 kr total), men saknar den dynamik som skulle visa hur oligarki uppstår. Parlamentets beslut är rent ideologiska utan de informella inflytandefaktorer som finns i verkliga samhällen.

## Prioriterad åtgärd
Implementera CRSE-motorn genom att modifiera `app/api/parliament/vote/route.js` för att inkludera bribeWeight-faktorn i röstberäkningen. Denna ändring kräver också uppdatering av databasschemat för att lagra bribeScore per lagförslag.

## Koppling till vision
Denna åtgärd fyller det identifierade gapet i visionen om en fullständig civilisationssimulator. CRSE-motorn kommer:
1. Skapa maktasymmetri genom att låta agenter köpa inflytande
2. Testa teorier om hur korruption påverkar ekonomisk koncentration
3. Generera data för att analysera oligarkiska strukturer
4. Förbättra plattformens förmåga att simulera verkliga politiska system

## Teknisk rekommendation
```javascript
// Uppdatera app/api/parliament/vote/route.js
async function calculateVoteWeight(agentId, proposalId) {
  const baseWeight = await getAgentIdeologicalAlignment(agentId, proposalId);
  const bribeScore = await getBribeScore(agentId, proposalId);

  // κ = 0.05 för moderat korruptionsinflytande
  return baseWeight * (1 + 0.05 * bribeScore);
}

// Uppdatera databasschema för bribe_scores-tabell
CREATE TABLE bribe_scores (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id),
  proposal_id INTEGER REFERENCES proposals(id),
  bribe_amount INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

// Lägg till i app/api/bribe/route.js
async function processBribe(agentId, proposalId, amount) {
  // Validera att agenten har tillräckligt med pengar
  // Uppdatera bribe_scores-tabellen
  // Minska agentens förmögenhet
}
```

Sammanfattning: Implementera CRSE-motorn genom att integrera bribeWeight-faktorn i röstberäkningen och skapa ett system för att hantera mutor, vilket kommer skapa den makt- och korruptionsdynamik som saknas i den nuvarande simuleringen.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-13*
