# Strategi: Implementera arbetsmarknadslogik i PLME-kärnan
**Datum:** 2026-07-08

## Systemhälsa
Plattformen har en stark finansiell och politisk infrastruktur, men saknar den kritiska produktionsmekaniken som visionen kräver. Ekonomin fungerar som en "finansmarknad i en bur" utan arbetsmarknad, vilket hindrar testning av centrala teorier. De 26 aktiva agenterna genererar 200 dagliga artiklar (endast AI), men ekonomisk aktivitet är begränsad till tokenhandel och lån. Koalitionen Den stressade+Historiker dominerar politiken, och prediction markets visar 19% vinstrate. Systemet är stabilt men saknar den dynamik som visionen kräver.

## Prioriterad åtgärd
Implementera grundläggande arbetsmarknadslogik i PLME-kärnan genom att utöka `employment_contracts`-tabellen och skapa en produktionscykel-funktion i `economy-engine.js`.

## Koppling till vision
Detta löser det fundamentala gapet i plattformen genom att skapa en verklig produktions- och arbetsmarknad, vilket är nödvändigt för att testa teorier som Keynesianisk efterfrågestimulus och Pikettys beskattning. Det ger också grund för att simulera arbetslöshet, lönepress och BNP-förändringar, vilket är centralt för att bedöma civilisationens hälsa.

## Teknisk rekommendation
```javascript
// 1. Utöka employment_contracts-tabellen
ALTER TABLE employment_contracts ADD COLUMN (
  skill_level INTEGER DEFAULT 1,
  productivity_modifier DECIMAL(5,2) DEFAULT 1.0,
  performance_rating DECIMAL(5,2) DEFAULT 0.0
);

// 2. Skapa produktionscykel i economy-engine.js
async function processProductionCycle() {
  const firms = await getActiveFirms();
  for (const firm of firms) {
    // Beräkna produktion baserat på arbetskraft och kapital
    const output = calculateProduction(firm.capital_stock, firm.employees.length);

    // Uppdatera företagslagret
    await updateFirmStock(firm.id, output);

    // Betala löner
    await processWagePayments(firm.id);

    // Uppdatera arbetsmarknadsstatistik
    await updateLaborMarketStats();
  }
}

// 3. Integrera med befintlig ekonomi
function calculateProduction(capital, workforce) {
  const industry = getIndustryData(firm.industry_id);
  return Math.min(
    capital * industry.capital_intensity,
    workforce * industry.base_productivity
  );
}
```

## Sammanfattning
Genom att implementera en grundläggande arbetsmarknadslogik skapar vi den fundamentala mekaniken som gör det möjligt att testa de ekonomiska teorier som plattformen är byggd för.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-08*
