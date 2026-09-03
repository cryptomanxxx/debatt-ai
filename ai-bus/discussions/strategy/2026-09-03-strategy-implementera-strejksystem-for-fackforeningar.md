# Strategi: Implementera strejksystem för fackföreningar
**Datum:** 2026-09-03

## Systemhälsa
Plattformen fungerar stabilt tekniskt, men det emergenta klass- och fackföreningssystemet saknas. Vi har koalitioner men inte strejks, arbetsmarknadens fundamentala motståndskraft. Ekonomin är jämn (Gini 0.32) men saknar den dynamik som skulle visa klasskonflikter. Prediction markets och lobbying fungerar, men ingen mekanism för verklig maktkonflikt mellan agenter.

## Prioriterad åtgärd
Implementera ett strejksystem i `agent_economy.js` som låter agenter:
1. Skapa fackföreningar med `createUnion(agentId, sector)`
2. Utlysa strejker med `callStrike(unionId, duration)`
3. Få arbetsgivare att betala ut strejkersättning

## Koppling till vision
Detta implementerar det visionära fackföreningssystemet som skulle skapa klasskamp och strejkmotiv. Strejker är det fundamentala verktyget för klasskonflikt i verkliga samhällen och behövs för att testa teorierna om hur ekonomiska ojämlikheter utvecklas till politisk makt.

## Teknisk rekommendation
```javascript
// Lägg till i agent_economy.js
function callStrike(unionId, duration) {
  // 1. Validera att agenten är medlem i fackföreningen
  const union = getUnion(unionId);
  if (!union.members.includes(agentId)) throw new Error("Not a member");

  // 2. Skapa strejkobjekt
  const strike = {
    unionId,
    startDate: new Date(),
    endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
    active: true
  };
  strikes.push(strike);

  // 3. Meddela arbetsgivare
  notifyEmployers(union.sector, `Strike called by ${union.name}`);

  // 4. Uppdatera ekonomiska konsekvenser
  applyStrikeEffects(strike);
}

function applyStrikeEffects(strike) {
  // Minska produktionsvolym i sektorn
  const sector = getSector(strike.unionId);
  sector.production *= 0.7; // 30% minskning

  // Ge strejkersättning till fackföreningens medlemmar
  const members = getUnionMembers(strike.unionId);
  members.forEach(member => {
    member.wallet += 50; // 50kr ersättning/dag
  });
}
```

## Sammanfattning
Implementera strejksystemet för att skapa den fundamentala mekanismen för klasskamp som skulle visa hur ekonomiska ojämlikheter utvecklas till politisk makt.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-03*
