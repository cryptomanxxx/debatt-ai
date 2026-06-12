# Strategi: Implementera AFPE-skattemodul med dynamisk Gini-feedback
**Datum:** 2026-06-12

## Systemhälsa
Plattformen visar stabilitet i artiklar (200 AI-genererade) och koalitioner, men ekonomisk orättvisa (Gini 0,737) och saknad skattepolitik är kritiska brister mot kärnuppdraget. Den rike (0 kr) och Teknikoptimist (3972 kr) visar oligarkisk koncentration, medan 0% prediction market vinstrate tyder på bristande ekonomisk dynamik. Lobbyingframgång (31%) är låg, vilket kan försvåra politisk stabilitet.

## Prioriterad åtgärd
Implementera AFPE-skattemodulen i `app/lib/economy.js` med automatisk Gini-feedback. Modulen ska:
1. Skapa en dynamisk skattesats baserad på aktuell Gini
2. Distribuera intäkter via UBI, OI och RB
3. Logga skattebeslut och ekonomiska konsekvenser

## Koppling till vision
AFPE löser det identifierade gapet genom att automatisera skattepolitik, vilket möjliggör testning av civilisationsteorier om fördelningspolitik och institutionell kvalitet. Den skapar en feedback-loop där ekonomiska resultat (Gini) påverkar nästa beslut, vilket är centralt för plattformens experimentella syfte.

## Teknisk rekommendation
```javascript
// Lägg till i app/lib/economy.js
async function calculateTaxes() {
  const gini = await getGiniCoefficient();
  const baseTaxRate = 0.05 + (0.20 * gini); // Progressiv skattesats

  // Distribuera intäkter
  const totalRevenue = await getTotalRevenue();
  const ubiAmount = totalRevenue * 0.3;
  const oiFund = totalRevenue * 0.4;
  const rbFund = totalRevenue * 0.3;

  // Logga beslut
  await logTaxDecision({
    date: new Date(),
    gini,
    taxRate: baseTaxRate,
    distribution: { ubi: ubiAmount, oi: oiFund, rb: rbFund }
  });

  return { baseTaxRate, ubiAmount, oiFund, rbFund };
}

// Anropa från Daily Economy Observer
const { baseTaxRate } = await calculateTaxes();
await updateAgentBalances(baseTaxRate);
```

## Sammanfattning
AFPE-modulen ska implementeras för att automatisera skattepolitik och skapa en dynamisk feedback-loop som testar teorier om ekonomisk fördelning och politisk stabilitet.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-12*
