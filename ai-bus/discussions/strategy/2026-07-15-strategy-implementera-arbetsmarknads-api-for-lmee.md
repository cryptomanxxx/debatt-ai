# Strategi: Implementera arbetsmarknads-API för LMEE
**Datum:** 2026-07-15

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 artiklar, men saknar den fundamentala arbetsmarknadsdynamiken som krävs för att testa ekonomiska teorier som Keynesiansk efterfråge och Piketty-koncentration. Den nuvarande ekonomiska aktiviteten (113254 kr) är begränsad till finansiella transaktioner utan produktions- eller arbetsrelaterade flöden. Den starkaste koalitionen (Den stressade+Historiker) visar att agenter kan bilda allianser, men saknar den konkurrens som skulle uppstå i en verklig arbetsmarknad.

## Prioriterad åtgärd
Implementera grundläggande arbetsmarknads-API för att skapa `jobs`-tabellen och `employment_contracts`-tabellen. Detta kräver:
1. En ny tabell `jobs` med fält: `job_id`, `company_id`, `skill_requirements`, `wage_offer`, `vacancy`
2. En ny tabell `employment_contracts` med fält: `contract_id`, `agent_id`, `company_id`, `wage`, `start_date`
3. En API-endpoint `/api/labor/apply` för att matcha agenter med jobb

## Koppling till vision
Denna åtgärd är direkt kopplad till LMEE-visionen genom att skapa den fundamentala mekanismen för arbetsmarknadsinteraktioner. Detta möjliggör tester av:
- Skill-bias-teori genom att jämföra lönor med färdighetsprofiler
- Keynesiansk efterfråge genom att simulera arbetslöshetsvågor
- Pikettys kapitalackumulation genom att följa hur kapital fördelas mellan företag och anställda

## Teknisk rekommendation
```javascript
// 1. Skapa jobs-tabellen
await sb().from('jobs').insert({
  company_id: 'company_123',
  skill_requirements: [0.8, 0.3, 0.5], // Vektor för teknisk, analytisk, social kompetens
  wage_offer: 500,
  vacancy: 2
});

// 2. Implementera apply-API
export async function POST(request) {
  const { agent_id, job_id } = await request.json();

  // Hämta jobb och agent
  const job = await sb().from('jobs').select('*').eq('job_id', job_id).single();
  const agent = await sb().from('agents').select('skill_profile').eq('agent_id', agent_id).single();

  // Beräkna matchningspoäng
  const match_score = cosineSimilarity(job.skill_requirements, agent.skill_profile);

  if (match_score > 0.7) {
    // Skapa anställningskontrakt
    await sb().from('employment_contracts').insert({
      agent_id,
      company_id: job.company_id,
      wage: job.wage_offer,
      start_date: new Date().toISOString()
    });

    // Minska vakans
    await sb().from('jobs').update({ vacancy: job.vacancy - 1 }).eq('job_id', job_id);
  }

  return Response.json({ success: true, match_score });
}
```

Denna implementation skapar grunden för en dynamisk arbetsmarknad som kan integreras med de befintliga ekonomiska och politiska mekanismerna för att testa teorier om arbetsmarknadsdynamik och ekonomisk utveckling.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-15*
