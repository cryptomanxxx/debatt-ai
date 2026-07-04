# Strategi: Implementera resursdatabas och produktionslogik
**Datum:** 2026-07-04

## Systemhälsa
Plattformen fungerar väl ekonomiskt och politiskt, men saknar grunden för att simulera fysiska resurser och ekologiska effekter. Aktuell ekonomi baseras enbart på tokenhandel utan kostnader eller externaliteter, vilket gör Gini-koefficienten statisk. Koalitioner och partier existerar, men ingen fysisk produktion eller resursförvaltning finns. Detta hindrar testning av centrala civilisationsteorier.

## Prioriterad åtgärd
Implementera grundläggande resursdatabas och produktionslogik i `schema.prisma` och `economy-engine.js`. Skapa tabellerna `Resource`, `ResourceHolding` och `PublicGood` samt grundläggande produktionsfunktioner.

## Koppling till vision
Detta löser det kritiska gapet i RPGE (Resource & Public Goods Engine) som krävs för att simulera:
1. Resursbaserad produktionskostnad (för att förklara ekonomisk ojämlikhet)
2. Externaliteter (miljöeffekter, gemensamma fördelar)
3. Tragedy of the Commons-scenarier
4. Ostroms principer för resursförvaltning

## Teknisk rekommendation
```javascript
// economy-engine.js
async function initializeResources() {
  // Skapa grundläggande resurser
  await prisma.resource.createMany({
    data: [
      { name: "Trä", totalSupply: 10000, regenerationRate: 0.1, depletionRate: 0.05 },
      { name: "Mat", totalSupply: 5000, regenerationRate: 0.2, depletionRate: 0.1 },
      { name: "Metall", totalSupply: 2000, regenerationRate: 0.05, depletionRate: 0.15 }
    ]
  });

  // Skapa grundläggande offentliga projekt
  await prisma.publicGood.createMany({
    data: [
      { name: "Väg", cost: 100, benefitScore: 0.3, requiredResources: { Trä: 50, Metall: 20 } },
      { name: "Skola", cost: 200, benefitScore: 0.5, requiredResources: { Trä: 80, Metall: 30 } }
    ]
  });
}

async function produceResource(agentId, resourceId, quantity) {
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  const cost = quantity * 10; // Grundläggande produktionskostnad

  // Kontrollera om agenten har tillräckligt med pengar
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (agent.money < cost) throw new Error("Inte tillräckligt med pengar");

  // Uppdatera resursförråd
  await prisma.resource.update({
    where: { id: resourceId },
    data: { totalSupply: { decrement: quantity } }
  });

  // Uppdatera agentens resurslager
  await prisma.resourceHolding.upsert({
    where: { agentId_resourceId: { agentId, resourceId } },
    create: { agentId, resourceId, quantity },
    update: { quantity: { increment: quantity } }
  });

  // Uppdatera agentens pengar
  await prisma.agent.update({
    where: { id: agentId },
    data: { money: { decrement: cost } }
  });
}
```

**Sammanfattning:** Genom att implementera grundläggande resursdatabas och produktionslogik skapar vi grunden för att simulera fysiska resurser och ekologiska effekter, vilket är avgörande för att uppnå kärnuppdraget med att testa ekonomisk civilisationsteori.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-04*
