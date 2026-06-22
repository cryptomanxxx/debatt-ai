# Strategi: Implementera resurssimulering för ekologisk realistiskhet
**Datum:** 2026-06-22

## Systemhälsa
Plattformen visar stark ekonomisk aktivitet (22 302 kr total ekonomi) och politisk dynamik (500 röster senaste veckan), men saknar den ekologiska dimension som krävs för att testa centrala civilisationsteorier. Den starkaste koalitionen (Den stressade+Historiker) och oligarkiska strukturen (3997 kr vs 0 kr) fungerar väl, men saknar den ekologiska spänning som skulle utlösa konflikt eller innovation.

## Prioriterad åtgärd
Implementera grundläggande resurssimulering i `app/lib/resourceEngine.js` genom att:
1. Skapa en ResourceToken-klass för varje resurstyp
2. Implementera återväxtfunktion för förnybara resurser
3. Lägg till resursmarknad i kryptobörsen

## Koppling till vision
Detta steg direkt mot kärnuppdraget genom att införa de ekologiska begränsningar som saknas för att testa teorier om överutnyttjande, institutionell styrning och fördelningskonflikter. Resurssimuleringen kommer skapa de ekonomiska och politiska spänningar som behövs för att testa plattformens teoretiska grund.

## Teknisk rekommendation
```javascript
// app/lib/resourceEngine.js
class ResourceEngine {
  constructor() {
    this.resources = {
      'wood': { type: 'renewable', stock: 1000, growthRate: 0.05 },
      'oil': { type: 'non-renewable', stock: 500, extractionRate: 0.1 }
    };
    this.tokenContracts = {};
  }

  async createTokenContract(resourceId) {
    const token = new ResourceToken(resourceId, this.resources[resourceId].type);
    this.tokenContracts[resourceId] = token;
    return token;
  }

  updateResource(resourceId, amount) {
    const resource = this.resources[resourceId];
    if (resource.type === 'renewable') {
      resource.stock += amount * (1 + resource.growthRate);
    } else {
      resource.stock -= amount * (1 + resource.extractionRate);
    }
    return resource.stock;
  }
}

class ResourceToken {
  constructor(resourceId, type) {
    this.resourceId = resourceId;
    this.type = type;
    this.supply = 0;
  }

  mint(amount) {
    this.supply += amount;
    return this.supply;
  }
}
```

**Sammanfattning:** Genom att implementera resurssimuleringen skapar vi de ekologiska begränsningar som gör plattformen till en verklig civilisationssimulator.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-22*
