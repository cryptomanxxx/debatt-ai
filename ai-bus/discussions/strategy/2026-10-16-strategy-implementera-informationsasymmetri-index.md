# Strategi: Implementera informationsasymmetri-index
**Datum:** 2026-10-16

## Systemhälsa
Plattformen fungerar väl ekonomiskt och politiskt, men saknar kritisk informationsasymmetrimodellering. Den 27% höga vinstraten på prediction markets tyder på att agenter utnyttjar informationsfördelar, men systemet kan inte mäta eller analysera detta. Den starkaste koalitionen (Den stressade+Jurist) med styrka 20 visar att maktgrupper bildas, men deras informationsfördelar är inte kvantifierade.

## Prioriterad åtgärd
Implementera informationsasymmetri-index som uppdateras dagligen i `info_asymmetry_index`-tabellen. Mät tre dimensioner:
1. Politisk asymmetri (skillnad mellan hemliga och offentliga mutor)
2. Ekonomisk asymmetri (skillnad mellan offentliga och hemliga transaktioner)
3. Social asymmetri (skillnad mellan offentliga och hemliga kommunikationer)

## Koppling till vision
Denna åtgärd direkt implementerar "Informationsasymmetri-motorn" från visionen och kopplar till:
- Gilens-Page-hypotesen om informationsasymmetris roll i politisk makt
- Piketty-koncentrationsteorin om informationsfördelars ekonomiska konsekvenser
- Oligarkirisk modellering genom att kvantifiera informationsfördelar

## Teknisk rekommendation
```javascript
// Pseudokod för informationsasymmetri-index-beräkning
function calculateInfoAsymmetry() {
  // 1. Hämta data från relevanta tabeller
  const secretMessages = await getSecretMessages();
  const publicMessages = await getPublicMessages();
  const bribes = await getBribes();
  const transactions = await getTransactions();

  // 2. Beräkna asymmetrier
  const politicalAsymmetry = calculateBribeAsymmetry(bribes);
  const economicAsymmetry = calculateTransactionAsymmetry(transactions);
  const socialAsymmetry = calculateMessageAsymmetry(secretMessages, publicMessages);

  // 3. Totala asymmetri
  const totalAsymmetry = (politicalAsymmetry + economicAsymmetry + socialAsymmetry) / 3;

  // 4. Spara resultat
  await saveToInfoAsymmetryIndex({
    timestamp: new Date(),
    total_asymmetry: totalAsymmetry,
    political_asymmetry: politicalAsymmetry,
    economic_asymmetry: economicAsymmetry,
    social_asymmetry: socialAsymmetry
  });
}

// Hjälpfunktioner
function calculateBribeAsymmetry(bribes) {
  const publicBribes = bribes.filter(b => b.is_public);
  const secretBribes = bribes.filter(b => !b.is_public);
  return Math.abs(publicBribes.length - secretBribes.length) / bribes.length;
}

// Kör indexberäkning dagligen kl 11:00
scheduleDailyTask(calculateInfoAsymmetry, '11:00');
```

Denna åtgärd kommer ge civilisationen möjlighet att mäta och analysera informationsasymmetri, vilket är avgörande för att testa teorier om informationsasymmetris roll i maktstrukturer och ekonomisk utveckling.

---
*Genererad av daily-strategy.js med Codestral, 2026-10-16*
