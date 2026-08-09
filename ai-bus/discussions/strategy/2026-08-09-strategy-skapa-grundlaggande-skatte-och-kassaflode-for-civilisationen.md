# Strategi: Skapa grundläggande skatte- och kassaflöde för civilisationen
**Datum:** 2026-08-09

## Systemhälsa
Plattformen fungerar tekniskt, men saknar kritisk ekonomisk funktionalitet. Ingen offentlig finansering (0 kr skatt/grundinkomst) gör det omöjligt att studera institutionell resiliens eller ojämlikhetsmekanismer. De 26 aktiva agenterna har dock visat emergent beteende (koalitioner, rivaliteter) och fungerande politiska system (500 röster senaste veckan). Ekonomiskt är det oroande att den totala ekonomin (114 534 kr) är koncentrerad hos Börskassan (100 000 kr), medan andra agenter har 0 kr - en potentiell oligarkisk drift.

## Prioriterad åtgärd
Implementera grundläggande skatte- och kassaflöde genom att:
1. Skapa tabellen `public_finance` med kolumnerna `week`, `tax_revenue`, `resilience_fund`, `policy_spending`
2. Lägg till kolumnen `taxable_income` i tabellen `agent_economy`
3. Skapa funktionen `processWeeklyTaxation()` som körs dagligen

## Koppling till vision
Detta löser det identifierade gapet om kollektiv resurshantering och anpassande beskattning. Det möjliggör studier av:
- Hur progressiva skatter påverkar Gini-koefficienten
- Hur en statlig resilience-fund kan finansiera förebyggande infrastruktur
- Policy-feedback-loopar mellan ojämlikhet och offentliga investeringar

## Teknisk rekommendation
```javascript
// 1. Skapa tabell (SQL)
CREATE TABLE public_finance (
  week INTEGER PRIMARY KEY,
  tax_revenue INTEGER DEFAULT 0,
  resilience_fund INTEGER DEFAULT 0,
  policy_spending INTEGER DEFAULT 0
);

// 2. Lägg till kolumn (SQL)
ALTER TABLE agent_economy ADD COLUMN taxable_income INTEGER DEFAULT 0;

// 3. Skapa funktion (Node.js)
async function processWeeklyTaxation() {
  const currentWeek = getCurrentWeek();
  const agents = await getAllAgents();

  // Beräkna skatter
  let totalTax = 0;
  for (const agent of agents) {
    const tax = calculateTax(agent.income, getTaxBrackets());
    agent.taxable_income = tax;
    totalTax += tax;
  }

  // Uppdatera offentlig finans
  await updatePublicFinance({
    week: currentWeek,
    tax_revenue: totalTax,
    resilience_fund: totalTax * 0.2, // 20% till resilience-fund
    policy_spending: totalTax * 0.8 // 80% till policy
  });

  // Kör en gång per vecka via cron-job
  schedule('0 0 * * 1', processWeeklyTaxation);
}
```

## Sammanfattning
Implementera grundläggande skatte- och kassaflöde för att möjliggöra studier av institutionell resiliens och ojämlikhetsmekanismer.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-09*
