# Strategi: Implementera LTI-kärnan i förtroendegrafen
**Datum:** 2026-08-27

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 AI-genererade artiklar, men saknar LTI-kärnan som skulle mätta institutionell legitimitet. Den nuvarande förtroendegrafen är binär (positiv/neutral/negativ) utan tidsberoende eller kvantitativ justering. Detta hindrar testning av institutionell legitimitetsteorier och riskerar att förvränga koalitionsdynamiken. Prioritering krävs för att implementera LTI-kärnan innan nästa ekonomisk cyklus.

## Prioriterad åtgärd
Implementera grundläggande LTI-kärna i `lib/trustEngine.js` för att hantera trust_events och uppdatera institutionell legitimitet. Fokusera på:
1. trust_event-schema (source_agent_id, target_institution, event_type, magnitude)
2. Legitimitetsindex per institution (0-100 baserat på genomsnittlig trust_event-magnitude)
3. Dynamisk uppdatering av förtroendegrafen

## Koppling till vision
LTI-kärnan löser det identifierade gapet genom att:
1. Ger tidsberoende förtroendeutveckling för institutioner
2. Skapar ett jämförbart legitimitetsindex som påverkar agentbeteenden
3. Enablar testning av institutionell legitimitetsteorier (Piketty-koncentration, Gilens-Page-hypotesen)

## Teknisk rekommendation
```javascript
// trustEngine.js - Grundläggande LTI-implementering
class TrustEngine {
  constructor() {
    this.trustEvents = [];
    this.institutionLegitimacy = {
      parliament: 50,
      court: 50,
      economy: 50
    };
  }

  async recordEvent(event) {
    // Validera och lagra trust_event
    const validatedEvent = this.validateEvent(event);
    this.trustEvents.push(validatedEvent);

    // Uppdatera legitimitetsindex
    this.updateLegitimacy(validatedEvent);

    // Uppdatera förtroendegrafen
    await updateTrustGraph(validatedEvent);
  }

  updateLegitimacy(event) {
    const decayFactor = 0.95; // 5% avklingning per event
    const impact = event.magnitude * (event.isPositive ? 1 : -1);

    // Exponential moving average
    this.institutionLegitimacy[event.target_institution] =
      (this.institutionLegitimacy[event.target_institution] * decayFactor) +
      (impact * (1 - decayFactor));

    // Begränsa till 0-100
    this.institutionLegitimacy[event.target_institution] =
      Math.max(0, Math.min(100,
        this.institutionLegitimacy[event.target_institution]));
  }
}

// Hooka in i befintliga system
// 1. Modifiera alla relevanta händelser för att generera trust_events
// 2. Uppdatera förtroendegrafen i realtid
// 3. Exponera legitimitetsindex i admin-gränssnittet
```

## Sammanfattning
Implementera LTI-kärnan i trustEngine.js för att skapa en dynamisk legitimitetsmätning som grund för institutionell stabilitet och agentbeteende.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-27*
