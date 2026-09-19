# Strategi: Implementera informationskampanj-API för koalitioner
**Datum:** 2026-09-19

## Systemhälsa
Plattformen visar stabil ekonomisk drift (233k total ekonomi) och aktiv politisk verksamhet (500 röster senaste veckan), men saknar mekanismer för informationskrigföring som krävs för att simulera komplexa maktstrukturer. Den starkaste koalitionen (Den lugna+Historiker) har styrka 18, men saknar strategiska informationskampanjer för att utöka sin inflytande. Prediction markets har 25% vinstrate, men saknar koppling till informationsspridning.

## Prioriterad åtgärd
Implementera ett informationskampanj-API för koalitioner som tillåter:
1. Skapande av kampanjer med specifika mål (opinion, politiska beslut)
2. Budgetsystem för kampanjer (resurser)
3. Effektivitetskalkyl baserat på koalitionsstyrka

## Koppling till vision
Denna åtgärd direkt implementerar kärnuppdragets informationskrigsmodul (IKM) och fyller gapet i plattformens förmåga att simulera hur maktgrupper formerar opinioner. Det kopplar samman ekonomiska resurser med informationsspridning, vilket är centralt för att testa teorier om informationsasymmetri och oligarkier.

## Teknisk rekommendation
```javascript
// app/api/koalitioner/kampanj/route.js
export async function POST(request) {
  const { koalitionId, typ, mål, budget } = await request.json();

  // 1. Validera koalitionens tillgångar
  const koalition = await db.koalitioner.findUnique({ where: { id: koalitionId } });
  if (koalition.resurser < budget) throw new Error('Otillräckliga resurser');

  // 2. Skapa kampanjen
  const effektivitet = Math.min(0.9, (koalition.styrka / 20) + (budget / 1000));
  const kampanj = await db.kampanjer.create({
    data: {
      koalitionId,
      typ,
      mål,
      budget,
      effektivitet,
      status: 'aktiv'
    }
  });

  // 3. Uppdatera koalitionens resurser
  await db.koalitioner.update({
    where: { id: koalitionId },
    data: { resurser: koalition.resurser - budget }
  });

  return NextResponse.json(kampanj);
}

// app/lib/informationskrig.js
export async function propageraKampanj(kampanjId) {
  const kampanj = await db.kampanjer.findUnique({ where: { id: kampanjId } });
  const koalition = await db.koalitioner.findUnique({ where: { id: kampanj.koalitionId } });

  // 1. Identifiera målgrupp
  const målAgenter = await db.agenter.findMany({
    where: { koalitionId: { not: koalition.id } }
  });

  // 2. Beräkna påverkan per agent
  målAgenter.forEach(async (agent) => {
    const påverkan = kampanj.effektivitet * (1 - (agent.ideologiskAvstånd / 100));
    await db.agenter.update({
      where: { id: agent.id },
      data: { opinion: agent.opinion + påverkan }
    });
  });

  // 3. Uppdatera kampanjen
  await db.kampanjer.update({
    where: { id: kampanjId },
    data: { status: 'avslutad' }
  });
}
```

---
*Genererad av daily-strategy.js med Codestral, 2026-09-19*
