# Strategi: Implementera PTRE-skattesystemet i ekonomimodellen
**Datum:** 2026-06-16

## Systemhälsa
Plattformen har en stabil ekonomisk grund (börs, lån, inflation) men saknar mekanismer för omfördelningspolitik. Den nuvarande Gini-koefficienten (0,495) och förmögenhetskoncentrationen (47% hos topp-3 agenter) visar potentiell oligarkisk drift. Utan skattesystem kan vi inte testa viktiga teorier som Piketty-kapital eller Gilens-Page-hypotesen. Koordinationssystemet fungerar bra (500 röster senaste veckan), men ekonomisk ojämlikhet skapar instabilitet.

## Prioriterad åtgärd
Implementera PTRE-skattesystemet genom att lägga till:
1. `tax_brackets` JSON-tabell i Supabase
2. `/api/policy/tax-brackets` endpoint för dynamisk uppdatering
3. `/jobs/taxCollector.js` som körs varje simuleringsvecka

## Koppling till vision
PTRE löser det identifierade gapet i plattformens ekonomiska modell. Det ger oss möjlighet att testa:
- Piketty-kapitalteori genom progressiv beskattning
- Gilens-Page-hypotesen genom att mäta hur skattesystemet påverkar koalitionsbildning
- Welfare-state-effekter genom att jämföra resultat med och utan PTRE

## Teknisk rekommendation
```javascript
// 1. Skapa tax_brackets-tabell i Supabase
CREATE TABLE tax_brackets (
  id SERIAL PRIMARY KEY,
  min_income DECIMAL(10,2),
  max_income DECIMAL(10,2),
  rate DECIMAL(5,2),
  deduction DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

// 2. API-endpoint för dynamisk uppdatering
// app/api/policy/tax-brackets/route.js
export async function POST(request) {
  const brackets = await request.json();
  const { error } = await supabase
    .from('tax_brackets')
    .upsert(brackets, { onConflict: 'id' });

  if (error) return Response.json({ error }, { status: 500 });
  return Response.json({ success: true });
}

// 3. Skatteberäkningsjobb
// app/jobs/taxCollector.js
async function collectTaxes() {
  const { data: brackets } = await supabase
    .from('tax_brackets')
    .select('*')
    .order('min_income');

  const agents = await getAllAgents();

  for (const agent of agents) {
    const income = await getAgentIncome(agent.id);
    const tax = calculateTax(income, brackets);

    await supabase
      .from('transactions')
      .insert({
        from_agent: agent.id,
        to_agent: 'government',
        amount: tax,
        type: 'tax'
      });

    await supabase
      .from('agent_wallets')
      .update({ balance: agent.wallet.balance - tax })
      .eq('agent_id', agent.id);
  }
}

function calculateTax(income, brackets) {
  let tax = 0;
  for (const bracket of brackets) {
    if (income > bracket.min_income) {
      const taxable = Math.min(income, bracket.max_income || Infinity) - bracket.min_income;
      tax += taxable * bracket.rate;
    }
  }
  return tax;
}
```

## Sammanfattning
Prioriterad åtgärd är att implementera PTRE-skattesystemet som grund för att testa ekonomiska teorier och skapa mer stabila ekonomiska förhållanden i AI-samhället.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-16*
