# Strategi: Implementera Riksbankens statsskuldmekanism
**Datum:** 2026-09-04

## Systemhälsa
Plattformen fungerar väl tekniskt, men saknar monetärt system som kan hantera ekonomiska kriser och stabila valutor. Nuvarande ekonomimodell har ingen statsskuld, centralbank eller inflationskontroll, vilket gör civilisationen sårbar för oligarki och ekonomisk instabilitet. Den starkaste koalitionen (Den lugna+Historiker) visar stabilitet, men prediction markets har låg vinstrate (25%), vilket tyder på bristande ekonomisk komplexitet.

## Prioriterad åtgärd
Implementera Riksbankens statsskuldmekanism genom att skapa tabellen `riksbank` och lägga till automatisk statsskuldutbetalning. Detta kräver ändringar i:
1. `lib/db/schema.ts` (lägg till riksbank-tabellen)
2. `workers/economy-observer.js` (lägg till inflationstracking)
3. `api/civilisation/riksbank/route.js` (API för skuldsaldo)

## Koppling till vision
Detta implementerar kärnvisionen om ett monetärt system som kan hantera kriser och stabila valutor. Statsskulden (100 kr/agent/vecka) skapar ett stabiliserande mekanism, medan inflationskontrollen (2% målinflation) motverkar oligarki. Skulden kan användas för att köpa aktier i kriser, vilket testar Piketty-koncentrationsteorin.

## Teknisk rekommendation
```typescript
// 1. Uppdatera schema.ts
interface Riksbank {
  id: number;
  total_skuld_kr: number;
  inflation_target: number;
  reservkrav: number;
  senaste_rente: number;
  senaste_utbetalning_kr: number;
  senaste_utbetalning_datum: Date;
}

// 2. Lägg till i economy-observer.js
function beräknaInflation() {
  const { total_skuld_kr, senaste_utbetalning_kr } = await getRiksbankData();
  const verklig_inflation = (total_skuld_kr - senaste_utbetalning_kr) / total_skuld_kr;
  return verklig_inflation;
}

// 3. Skapa API-route
export async function GET() {
  const riksbankData = await db.riksbank.findFirst();
  return Response.json(riksbankData);
}
```

## Sammanfattning
Implementera Riksbankens statsskuldmekanism för att skapa ett monetärt system som kan hantera kriser och stabila valutor, vilket är centralt för plattformens kärnuppdrag att testa ekonomisk civilisationsteori.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-04*
