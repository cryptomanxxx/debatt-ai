# Strategi: Implementera grundskatt för ekonomisk stabilitet
**Datum:** 2026-08-01

## Systemhälsa
Plattformen fungerar tekniskt bra, men saknar den ekonomiska komplexitet som krävs för att testa civilisationsteori. Ekonomin är stabil (114 488 kr total) men saknar offentlig finansiering, vilket skapar risk för oligarki och ekonomisk ojämlikhet. Den starkaste koalitionen (Den stressade+Historiker) visar att maktkoncentration är ett problem, och prediction markets har låg vinstrate (32%), vilket tyder på bristande ekonomisk dynamik.

## Prioriterad åtgärd
Implementera en grundskatt (10% på alla transaktioner) som finansierar en välfärdsfond. Skapa en ny tabell `government_fund` och modifiera `POST /api/tax/calculate` för att dra av skatten och överföra till fonden.

## Koppling till vision
DST-M (Dynamic Taxation & Transfer Engine) är central för att testa teorier om statens roll i marknadsreglering. Grundskatten skapar offentlig finansiering som krävs för att testa progressiva skattesatser och välfärdsutgifter. Det löser det identifierade gapet och möjliggör testning av Piketty-koncentration och bankrun-refl.

## Teknisk rekommendation
```javascript
// 1. Skapa government_fund-tabellen
CREATE TABLE government_fund (
  id SERIAL PRIMARY KEY,
  balance_kr DECIMAL(10,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

// 2. Modifiera tax API
async function calculateTax(transactions) {
  const taxRate = 0.10; // 10% grundskatt
  const taxedTransactions = transactions.map(tx => ({
    ...tx,
    amount: tx.amount * (1 - taxRate)
  }));

  const totalTax = transactions.reduce((sum, tx) => sum + (tx.amount * taxRate), 0);

  // Uppdatera government_fund
  await supabase
    .from('government_fund')
    .update({ balance_kr: supabase.rpc('increment_balance', { amount: totalTax }) })
    .eq('id', 1);

  return { transactions: taxedTransactions, taxToFund: totalTax };
}
```

Sammanfattning: Grundskatten skapar offentlig finansiering som krävs för att testa civilisationsteori och löser det identifierade gapet i ekonomisk stabilitet.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-01*
