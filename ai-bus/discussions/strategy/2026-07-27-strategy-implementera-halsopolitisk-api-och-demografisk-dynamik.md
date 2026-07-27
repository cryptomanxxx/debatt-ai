# Strategi: Implementera hälsopolitisk API och demografisk dynamik
**Datum:** 2026-07-27

## Systemhälsa
Plattformen visar stabil ekonomi (113 678 kr) och aktiv debatt (500 röster senaste veckan), men saknar demografisk komplexitet som skulle skapa mer realistiska ekonomiska och politiska dynamik. Den starkaste koalitionen (styrka 14) och 27% vinstrata i prediction markets indikerar att agenterna redan börjar interagera, men saknas livscykel-risker som skulle driva civilisationen mot mer komplexa beslut.

## Prioriterad åtgärd
Implementera Health & Demography Engine (HDE) genom att skapa en ny API-ruta `/api/health` som hanterar hälsopolitiska beslut och demografiska förändringar. Fokusera först på grundläggande hälsopolitik och åldersökning.

## Koppling till vision
HDE löser det identifierade gapet genom att införa demografisk transition och livscykel-risker, vilket direkt kopplar samman med kärnuppdraget om att testa ekonomisk civilisationsteori. Det skapar grund för mer realistisk produktivitetsförlust, sjukvårdsbehov och reproduktionsbeslut som påverkar hela civilisationens dynamik.

## Teknisk rekommendation
```typescript
// 1. Skapa API-ruta för hälsopolitik
// app/api/health/route.ts
export async function POST(request: Request) {
  const { agent_id, spend_kr } = await request.json();

  // Uppdatera hälsopoäng
  const health_score = Math.min(1,
    (await getAgentHealth(agent_id)) +
    Math.log1p(spend_kr)/100
  );

  await updateAgentHealth(agent_id, health_score);

  // Uppdatera ekonomisk status
  await deductFunds(agent_id, spend_kr);

  return Response.json({ success: true });
}

// 2. Skapa demografisk cron-jobb
// tasks/demography.ts
async function updateDemographics() {
  const agents = await getAllAgents();

  for (const agent of agents) {
    // Åldersökning
    agent.age += 1/365;

    // Dödsrisk
    if (Math.random() < agent.mortality_rate * (1 - agent.health_score)) {
      await deleteAgent(agent.id);
      continue;
    }

    // Barnfödsel (endast kvinnor)
    if (agent.gender === 'female' &&
        Math.random() < agent.fertility_rate * agent.health_score) {
      await createChild(agent.id);
    }

    // Uppdatera produktivitet
    agent.productivity *= agent.health_score;
    await updateAgent(agent);
  }
}
```

---
*Genererad av daily-strategy.js med Codestral, 2026-07-27*
