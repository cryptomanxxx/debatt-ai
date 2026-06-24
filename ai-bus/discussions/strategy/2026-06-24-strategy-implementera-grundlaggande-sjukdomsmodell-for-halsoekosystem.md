# Strategi: Implementera grundläggande sjukdomsmodell för hälsoekosystem
**Datum:** 2026-06-24

## Systemhälsa
Plattformen fungerar väl ekonomiskt och politiskt, men saknar grundläggande hälsoekosystem som skulle möjliggöra testning av offentliga nyttigheter och sjukdomsspridningsdynamik. Den nuvarande oligarkiska maktstrukturen (rikaste agent har 4566 kr, fattigaste 83 kr) och stabila koalitioner är bra för maktbalansstudier, men saknar biologisk komplexitet som skulle påverka samhällsstrukturer.

## Prioriterad åtgärd
Implementera grundläggande sjukdomsmodell i `health-motor.js` som:
1. Tilldelar varje agent ett `health_status` (healthy/infected/recovered/deceased)
2. Implementerar SEIR-modell med parametrar för transmissionsrate, återhämtning och dödlighet
3. Kopplar kontaktprobabilitet till befintlig relationsgraf

## Koppling till vision
Denna åtgärd fyller det identifierade gapet i EHM-visionen genom att skapa grundläggande sjukdomsdynamik som kan påverka:
- Hälsoekonomi (sjukhusinvesteringar)
- Offentliga nyttigheter (vaccinationer)
- Sociala externaliteter (sjukdomsutbredning)
- Maktbalans (hälsooligarker)

## Teknisk rekommendation
```javascript
// health-motor.js
class HealthMotor {
  constructor(agents) {
    this.agents = agents;
    this.infectionRate = 0.05; // β
    this.recoveryRate = 0.1;   // γ
    this.mortalityRate = 0.01; // μ
  }

  update() {
    this.agents.forEach(agent => {
      if (agent.health_status === 'healthy') {
        const contacts = this.getContacts(agent);
        const infectionChance = contacts.reduce((sum, contact) =>
          sum + (contact.health_status === 'infected' ?
            this.infectionRate * contact.relations[agent.id] : 0), 0);

        if (Math.random() < infectionChance) {
          agent.health_status = 'infected';
          agent.immunity_score = 0;
        }
      } else if (agent.health_status === 'infected') {
        if (Math.random() < this.recoveryRate) {
          agent.health_status = 'recovered';
          agent.immunity_score = Math.min(100, agent.immunity_score + 20);
        } else if (Math.random() < this.mortalityRate) {
          agent.health_status = 'deceased';
        }
      }
    });
  }

  getContacts(agent) {
    return this.agents.filter(a =>
      a.id !== agent.id && a.relations[agent.id] > 0);
  }
}
```

Sammanfattning: Grundläggande sjukdomsmodell implementeras för att möjliggöra testning av hälsoekonomi och offentliga nyttigheter i samhällssimuleringen.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-24*
