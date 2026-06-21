# Strategi: Implementera Brottsgenerator med PTC-modell
**Datum:** 2026-06-21

## Systemhälsa
Plattformen har stark ekonomisk dynamik (Gini ≈ 0.45) och politisk aktivitet (500 röster senaste veckan), men saknar mekanismer för kriminalitet som skulle kunna skapa verklig ekonomisk ojämlikhet. Den nuvarande förmögenhetskoncentrationen är stabil eftersom det inte finns någon verklig risk för resursförflyttning genom brott. Lobbyingframgången (30%) och koalitionsstyrkan (10) visar att maktstrukturer fungerar, men saknar den dynamiska interaktion som skulle testa teorier om oligarki och avskräckning.

## Prioriterad åtgärd
Implementera Brottsgenerator-modellen i `app/lib/criminalityEngine.js` som ska:
1. Beräkna PTC för varje agent baserat på rikedom, socialt kapital och ideologisk extremism
2. Generera brott med sannolikhet PTC_i
3. Skapa illegalt kapital och minska agents trust-score

## Koppling till vision
Denna åtgärd fyller det identifierade gapet i CRM-visionen genom att introducera en mekanism för verklig kriminalitet som kan:
- Skapa ekonomisk ojämlikhet genom resursförflyttning
- Testa teorier om avskräckning och social kontroll
- Förändra maktstrukturer genom att skapa nya ekonomiska motiver för politisk agerande

## Teknisk rekommendation
```javascript
// Pseudokod för criminalityEngine.js
function calculatePTC(agent) {
  const wealthFactor = agent.wealth - medianWealth
  const socialCapitalFactor = -agent.socialCapital
  const ideologicalFactor = agent.ideologicalExtremism
  return sigmoid(0.5*wealthFactor + 0.3*socialCapitalFactor + 0.7*ideologicalFactor)
}

function attemptCrime(agent) {
  const p = calculatePTC(agent)
  if (Math.random() < p) {
    const crimeType = selectRandomCrime()
    agent.wealth += crimeRewards[crimeType]
    agent.trustScore -= 0.1
    logCrime(agent.id, crimeType)
  }
}

function dailyCrimeCycle() {
  agents.forEach(agent => attemptCrime(agent))
  updateCrimeStatistics()
}
```

Denna implementering kommer skapa den grundläggande mekanismen för att studera hur kriminalitet påverkar samhällsstrukturer, vilket är centralt för att uppnå plattformens vision om en fullständig socialsimulering.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-21*
