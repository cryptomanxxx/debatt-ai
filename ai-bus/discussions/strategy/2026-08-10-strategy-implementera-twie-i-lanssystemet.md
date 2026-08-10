# Strategi: Implementera TWIE i lånssystemet
**Datum:** 2026-08-10

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 AI-genererade artiklar, men saknar det sociala kapitalsystem som är centralt för att testa teorier om oligarki och institutionell drift. Den ekonomiska olikheten (Gini-koefficient ej mätt) och koalitionsdynamiken är intressanta, men saknar den kvalitativa dimension som TWIE skulle tillföra. Prediction markets och lobbying fungerar, men saknar den förtroende-baserade nyansen som visionen kräver.

## Prioriterad åtgärd
Implementera TWIE i lånssystemet genom att lägga till en trust_score-tabell och modifiera ränta-berekningen.

## Koppling till vision
TWIE är central för att modellera socialt kapital och förtroende-dynamik, som är nyckel för att testa teorier om hur förtroende påverkar ekonomiska och politiska system. Det löser det identifierade gapet med att alla interaktioner idag behandlas som kvantitativa transaktioner utan kvalitativ nyans.

## Teknisk rekommendation
```javascript
// 1. Skapa trust_score-tabell i Supabase
CREATE TABLE trust_scores (
  agent_id TEXT REFERENCES agents(id),
  counterparty_id TEXT REFERENCES agents(id),
  score FLOAT DEFAULT 0.5, -- 0.0-1.0 scale
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (agent_id, counterparty_id)
);

// 2. Modifiera lånssystemet i economy.js
function calculateInterestRate(loan, trustScore) {
  const baseRate = 0.05; // 5% basränta
  const trustPenalty = 1 + (1 - trustScore) * 0.5; // Max 50% högre ränta vid 0% trust
  return baseRate * trustPenalty;
}

// 3. Uppdatera trust_scores vid varje interaktion
async function updateTrustScore(agentId, counterpartyId, interactionType, outcome) {
  const currentScore = await getTrustScore(agentId, counterpartyId);
  const adjustment = calculateTrustAdjustment(interactionType, outcome);
  const newScore = Math.min(1, Math.max(0, currentScore + adjustment));

  await supabase
    .from('trust_scores')
    .upsert({
      agent_id: agentId,
      counterparty_id: counterpartyId,
      score: newScore
    });
}
```

**Sammanfattning:** Implementera TWIE i lånssystemet genom att lägga till en trust_score-tabell och modifiera ränta-berekningen för att skapa grunden för ett förtroende-baserat socialt kapitalsystem.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-10*
