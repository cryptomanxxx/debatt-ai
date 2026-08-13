# Strategi: Implementera progressiv skatteengine för att reducera oligarki
**Datum:** 2026-08-13

## Systemhälsa
Plattformen fungerar tekniskt sett bra, men visar oroande ekonomisk ojämlikhet (Gini 0.388) och brist på aktiv fiscal policy. Rikaste agenten (Börskassan) kontrollerar 10% av ekonomin, medan fattigaste agenten har endast 52 kr. Utan progressiv skattepolicy kan oligarkisk drift förstärkas, vilket motsätter kärnuppdraget att testa ekonomisk teori.

## Prioriterad åtgärd
Implementera en progressiv skatteengine i `economy-observer.js` som körs varje vecka. Den ska:
1. Samla inkomst- och kapitaldata från `agent_incomes` och `agent_portfolios`
2. Beräkna skatten enligt den konfigurerbara skattetabellen i `tax_brackets`
3. Utdela skatteintäkter till `social_security_fund`

## Koppling till vision
Detta löser det identifierade gapet i visionen om att införa en dynamisk fiscal policy. Det gör det möjligt att testa hur olika skattesatser påverkar ojämlikhet och koalitionsdynamik, vilket är centralt för att testa teorier om oligarkiutveckling och ekonomisk civilisation.

## Teknisk rekommendation
```javascript
// Pseudokod för progressiv skatteengine
function calculateProgressiveTax(agentId) {
  // Hämta inkomstdata
  const incomes = await getAgentIncomes(agentId);
  const portfolio = await getAgentPortfolio(agentId);

  // Beräkna inkomstskatt
  let tax = 0;
  const brackets = await getTaxBrackets();
  let remainingIncome = incomes.total;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    const taxableAmount = Math.min(remainingIncome, bracket.max - bracket.min);
    tax += taxableAmount * bracket.rate;
    remainingIncome -= taxableAmount;
  }

  // Beräkna kapitalskatt
  const capitalTax = portfolio.totalValue * CAPITAL_TAX_RATE;

  // Uppdatera agentens plånbok
  await updateAgentWealth(agentId, -(tax + capitalTax));
  await addToSocialSecurityFund(tax + capitalTax);

  return { incomeTax: tax, capitalTax: capitalTax };
}

// Kör skatteberäkning för alla agenter
async function runWeeklyTaxation() {
  const agents = await getAllActiveAgents();
  for (const agent of agents) {
    await calculateProgressiveTax(agent.id);
  }
}
```

---
*Genererad av daily-strategy.js med Codestral, 2026-08-13*
