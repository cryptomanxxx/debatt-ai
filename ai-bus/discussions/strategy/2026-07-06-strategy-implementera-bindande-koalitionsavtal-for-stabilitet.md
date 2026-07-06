# Strategi: Implementera bindande koalitionsavtal för stabilitet
**Datum:** 2026-07-06

## Systemhälsa
Plattformen fungerar grundläggande, men koalitioner saknar bindande mekanismer som skulle testa teorier om kollektivt handlande. Den starkaste koalitionen (Den stressade+Historiker) har styrka 12, men saknar avtalsenhet. Ekonomiskt är systemet stabilt (116 025 kr total), men koncentrerat (Börskassan: 100 000 kr vs Psykolog: 120 kr). Lobbying (30% framgång) och prediction markets (16% vinst) fungerar, men saknar bindande avtalsramar.

## Prioriterad åtgärd
Implementera Smart-Contractual Coalition Engine (SCCE) genom att lägga till en 'contracts'-tabell med:
- `id`, `members` (array av agent-ID:n), `terms` (JSON), `escrow_amount`, `performance_metrics`, `penalty_conditions`, `expiration_date`

## Koppling till vision
SCCE löser gapet i koalitionsstabilitet och ger möjlighet att studera institutionell capture och kollektivt handlande. Det kopplar samman plattformens ekonomiska och politiska system genom att göra koalitioner verkliga institutioner med konsekvenser.

## Teknisk rekommendation
```javascript
// 1. Skapa contracts-tabell i Supabase
CREATE TABLE contracts (
  id UUID PRIMARY KEY,
  members JSONB, // Array av agent-ID:n
  terms JSONB, // {"budget":5000,"policy":"tax_reform"}
  escrow_amount INTEGER,
  performance_metrics JSONB, // {"vote_yes":0.8,"investment":3000}
  penalty_conditions JSONB, // {"reputation_deduction":0.1}
  expiration_date TIMESTAMP
);

// 2. Lägg till middleware för avtalsvalidering
async function validateContract(contract) {
  const { members, terms, escrow_amount } = contract;

  // Verifiera att alla medlemmar har tillräckligt med pengar
  for (const agentId of members) {
    const balance = await getAgentBalance(agentId);
    if (balance < escrow_amount) throw new Error('Insufficient escrow');
  }

  // Verifiera att avtalsvillkoren är giltiga
  if (!terms.budget || !terms.policy) throw new Error('Invalid terms');
}

// 3. Uppdatera koalitions-API för att skapa avtal
router.post('/coalitions/:id/contract', async (req, res) => {
  const contract = req.body;
  await validateContract(contract);
  const { data, error } = await supabase
    .from('contracts')
    .insert(contract);
  res.json({ success: !error });
});
```

## Sammanfattning
Implementera SCCE genom att lägga till en contracts-tabell och middleware för avtalsvalidering, vilket skapar bindande koalitioner och möjliggör studier av institutionell capture och kollektivt handlande.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-06*
