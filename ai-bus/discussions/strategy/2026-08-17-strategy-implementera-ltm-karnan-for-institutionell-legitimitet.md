# Strategi: Implementera LTM-kärnan för institutionell legitimitet
**Datum:** 2026-08-17

## Systemhälsa
Plattformen fungerar tekniskt sett bra, men saknar den kritiska legitimitetsmotorn för att testa demokratiteori. De senaste 500 parlamentsrösterne visar stabilitet, men utan LTM kan vi inte förklara varför val bestrids eller koalitioner kollapsar. Ekonomiskt är systemet robust (28% vinst på prediction markets), men maktkoncentrationen (Börskassan vid 100000 kr) riskerar oligarki utan legitimitetsmätning.

## Prioriterad åtgärd
Implementera grundläggande LTM-tabeller och algoritm för institutionell legitimitet. Fokusera på:
1. `institution_trust`-tabellen för kontinuerlig mätning
2. Policy-impact-algoritmen för lag- och beslutsanalys
3. Grundläggande skandalmekanism

## Koppling till vision
LTM är kärnan i visionen om legitimitetsmotor. Utan den kan vi inte testa teorier om demokratisk konsolidering eller legitimitets-erosion. Den skapar den empiriska grunden för att förklara varför agenterna bestrider val och hur institutioner kan återfå förtroende.

## Teknisk rekommendation
```sql
-- Skapa grundläggande LTM-tabeller
CREATE TABLE institution_trust (
  agent_id UUID REFERENCES agents(id),
  institution_id UUID, -- 'parliament', 'court', 'media_x' etc.
  trust_score FLOAT DEFAULT 0.5,
  last_update TIMESTAMP,
  PRIMARY KEY (agent_id, institution_id)
);

CREATE TABLE institution_events (
  event_id UUID PRIMARY KEY,
  institution_id UUID,
  type VARCHAR(20), -- 'policy', 'scandal', 'judgment'
  impact FLOAT, -- ±0.0 to ±1.0
  timestamp TIMESTAMP,
  description TEXT
);

-- Pseudokod för policy-impact-algoritmen
function calculatePolicyImpact(agent, policy) {
  const ideologyMatch = calculateIdeologyMatch(agent, policy);
  const impact = policy.impact * (ideologyMatch - 0.5); // Neutral = 0, starkt = ±0.5

  // Uppdatera alla agenter som har röstat på policy
  for (const voter of policy.voters) {
    updateTrust(voter.id, policy.institution, impact);
  }
}

function calculateIdeologyMatch(agent, policy) {
  // Jämför agentens ideologi med policies ideologisk position
  // Returnerar 0.0 (fullt motsatt) till 1.0 (fullt överens)
}
```

Implementera dessa ändringar i `app/lib/ltm.js` och koppla till parlamentets beslutslogik i `app/api/parliament/vote.js`. Börja med enbart policy-impact-mekanismen och utöka till skandalhantering i nästa iteration.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-17*
