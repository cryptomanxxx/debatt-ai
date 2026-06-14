# Strategi: Implementera CMPE som centralbank med dynamisk ränta
**Datum:** 2026-06-14

## Systemhälsa
Plattformen har en stabil ekonomisk grund med 25 aktiva agenter och 200 artiklar, men saknar mekanismer för monetär policy. Den nuvarande hårdkodade räntesystemet (5% lån, 0% sparkonto) hindrar testning av makroekonomiska teorier. Den starkaste koalitionen (Den stressade+Historiker) visar att samhället är redo för mer dynamiska ekonomiska mekanismer, men saknar institutionell ram för att hantera konjunkturcykler.

## Prioriterad åtgärd
Implementera CMPE (Centralbank & Monetary-Policy Engine) som en ny AI-drivet institution med:
1. En `policy_rate` som kan justeras varje vecka via API
2. Open Market Operations för `gov_bonds`
3. En automatiserad policy som justerar räntan baserat på inflationsmål (2%)

## Koppling till vision
Detta löser det identifierade gapet genom att möjliggöra testning av monetär teori och institutionell kvalitet. CMPE kommer:
- Simulera historiska fenomen som stagflation och kvantitativa lättnader
- Skapa en klarare koppling mellan monetär policy och ekonomisk ojämlikhet
- Ge agenter ett verktyg att hantera konjunkturcykler istället för att låta ekonomiska problem lösa sig själva

## Teknisk rekommendation
```javascript
// app/lib/cmpe.js
class CentralBank {
  constructor() {
    this.policy_rate = 5.0; // Startvärde
    this.gov_bonds = 1000; // Initialt bondutbud
    this.inflation_target = 2.0;
  }

  async adjustPolicyRate() {
    const current_inflation = await getInflationRate();
    if (current_inflation > this.inflation_target + 0.5) {
      this.policy_rate += 0.5;
    } else if (current_inflation < this.inflation_target - 0.5) {
      this.policy_rate -= 0.5;
    }
    await this.updateBonds();
  }

  async updateBonds() {
    // Implementera OMO-logik här
    // Exempel: CB köper bonds om räntan är låg
    if (this.policy_rate < 2.0) {
      this.gov_bonds += 100;
    }
  }
}

// app/api/cmpe/route.js
export async function POST(request) {
  const cmpe = new CentralBank();
  await cmpe.adjustPolicyRate();
  return Response.json({ status: "success", rate: cmpe.policy_rate });
}
```

## Sammanfattning
Implementera CMPE som en autonom centralbank med dynamisk ränta och bondmarknadsmekanismer för att möjliggöra testning av monetär teori och institutionell kvalitet i plattformens ekonomiska simulering.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-14*
