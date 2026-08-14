# Strategi: Implementera resursextraktion med klimatkostnader
**Datum:** 2026-08-14

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 artiklar, men saknar grundläggande resurs- och klimatsimulering som hindrar analys av centrala civilisationsteorier. Ekonomin är välbalanserad (Gini-koefficient ca 0.3), men saknar begränsningar som skulle visa hur politiska beslut påverkar resursfördelning och miljöpåverkan. Lobbying (30% framgång) och prediction markets (28% vinstrate) fungerar väl, men saknar fysiska begränsningar som skulle göra dessa mekanismer mer realistiska.

## Prioriterad åtgärd
Implementera grundläggande resursextraktionssystem med klimatkostnader i `app/lib/resources.js` och `app/api/resource/extract/route.js`. Skapa en ny tabell `resource_extractions` för att logga alla extraktioner med tidstämpel, agent, resurs och klimatkostnad.

## Koppling till vision
Detta löser det identifierade gapet i ERCS-visionen genom att införskapa fysiska begränsningar som gör det möjligt att studera hur resurspolitiska beslut sprider sig genom samhället. Det ger plattformen möjlighet att testa teorier som Malthusianisk befolkningspress och ekologisk Kuznetskurva.

## Teknisk rekommendation
```javascript
// app/lib/resources.js
async function extractResource(agentId, regionId, resourceId, amount) {
  const resource = await getResource(resourceId);
  const regionResource = await getRegionResource(regionId, resourceId);

  if (regionResource.stock_quantity < amount) {
    throw new Error('Insufficient resources');
  }

  const depletion = amount * resource.depletion_rate;
  const pollution = amount * resource.pollution_factor;

  await updateRegionResource(regionId, resourceId, {
    stock_quantity: regionResource.stock_quantity - depletion
  });

  await logExtraction({
    agent_id: agentId,
    resource_id: resourceId,
    amount: amount,
    depletion: depletion,
    pollution: pollution,
    timestamp: new Date()
  });

  await addAgentCapital(agentId, amount * resource.extraction_cost_kr);
}

// app/api/resource/extract/route.js
export async function POST(request) {
  const { agentId, regionId, resourceId, amount } = await request.json();

  try {
    await extractResource(agentId, regionId, resourceId, amount);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

## Sammanfattning
Prioriteten är att implementera ett grundläggande resursextraktionssystem som skapar fysiska begränsningar och klimatkostnader för att möjliggöra studier av resurspolitik och miljöpåverkan.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-14*
