# Strategi: Implementera PRM-fabriker för verklig produktionsdynamik
**Datum:** 2026-07-03

## Systemhälsa
Plattformen visar stabil ekonomisk aktivitet (117 502 kr, 26 aktiva agenter) men saknar produktionsbas. Den nuvarande spekulativa ekonomin (Gini 0,859) kan inte testa teorier om produktivitet eller institutionell drift. Koalitioner och lobbying fungerar väl, men saknas mekanism för att skapa och fördela verklig värdeproduktion.

## Prioriterad åtgärd
Implementera grundläggande fabrikssystem i `economy/factories.js` med tre fabriksobjekt (grön energi, digitala tjänster, fysisk infrastruktur) som producerar konsumtionsvaror varje cykel. Varje fabrik ska ha:
- Produktionskapacitet (0-100 enheter/cykel)
- Resurskostnad (kr, el, data)
- Effektivitet (0-1)
- Tilldelad ägare (agent_id)

## Koppling till vision
PRM är nyckeln till att testa teorier om produktivitet och institutionell drift. Utan fabriker kan plattformen aldrig simulera:
1. Tillväxtkurvor (Romer)
2. Institutionella effekter på lönefördelning (Acemoglu-Robinson)
3. Konsumeringsdynamik (Kuznets-kurvan)

## Teknisk rekommendation
```javascript
// factories.js
class Factory {
  constructor(id, ownerAgentId, type, capacity, resourceInput, outputGood) {
    this.id = id;
    this.ownerAgentId = ownerAgentId;
    this.type = type; // 'green_energy', 'digital_services', 'physical_infra'
    this.capacity = capacity; // 0-100
    this.resourceInput = resourceInput; // {kr: 10, el: 5, data: 2}
    this.outputGood = outputGood; // {good_id: 'renewable_energy', quantity: 10}
    this.efficiency = 0.8; // 0-1
  }

  produce() {
    const outputQuantity = Math.floor(this.capacity * this.efficiency);
    return {
      ...this.outputGood,
      quantity: outputQuantity
    };
  }
}

// Initialiseringskod
const factories = [
  new Factory(1, 'Börskassan', 'green_energy', 50, {kr: 10, el: 5, data: 2}, {good_id: 'renewable_energy', quantity: 10}),
  new Factory(2, 'Sociolog', 'digital_services', 30, {kr: 8, el: 3, data: 4}, {good_id: 'cloud_services', quantity: 5}),
  new Factory(3, 'Historiker', 'physical_infra', 40, {kr: 12, el: 7, data: 1}, {good_id: 'transport_infra', quantity: 8})
];

// Integrera i ekonomicykeln
function runProductionCycle() {
  factories.forEach(factory => {
    const output = factory.produce();
    // Distribuera produkten till agentens lager
    // Uppdatera statistik
  });
}
```

## Sammanfattning
Implementera fabrikssystemet först med tre grundläggande fabriker för att skapa grunden för verklig produktionsdynamik och institutionell drift i civilisationen.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-03*
