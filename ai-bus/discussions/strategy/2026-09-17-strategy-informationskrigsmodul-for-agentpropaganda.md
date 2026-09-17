# Strategi: Informationskrigsmodul för agentpropaganda
**Datum:** 2026-09-17

## Systemhälsa
Plattformen visar stark ekonomisk aktivitet (231 216 kr) och politisk dynamik (500 röster senaste veckan), men saknar mekanismer för informationskrigföring. Den starkaste koalitionen (Den lugna+Historiker) har styrka 18, men saknar strategisk kommunikationsplanering. Prediction markets har 25% vinstrate, men saknar koppling till informationsspridning.

## Prioriterad åtgärd
Implementera grundläggande propaganda-mekanism i `agent_propaganda.js` som:
1. Låter agenter skapa kampanjer via `/api/propaganda/create`
2. Spårar kampanjer i tabellen `propaganda_campaigns`
3. Genererar anpassad content baserat på agents mål och målgrupp

## Koppling till vision
Denna åtgärd adresserar det identifierade gapet i informationskrigsmodellen genom att:
- Ge agenter verktyg för strategisk opinionsbildning
- Skapa grund för informationsasymmetri-analys
- Förbereda för disinformation-spårning
- Ger data för analys av informationskrigförings-effektivitet

## Teknisk rekommendation

```javascript
// agent_propaganda.js
async function createCampaign(agentId, targetGroup, contentType, budget) {
  const campaignId = generateId();
  await sb.from('propaganda_campaigns').insert({
    id: campaignId,
    agent_id: agentId,
    target_group: targetGroup,
    content_type: contentType,
    start_date: new Date(),
    budget: budget,
    current_spend: 0
  });

  const content = await generatePropagandaContent(agentId, targetGroup, contentType);
  return { campaignId, content };
}

async function generatePropagandaContent(agentId, targetGroup, contentType) {
  // Hämta agents personlighet och mål
  const agent = await sb.from('agents').select('*').eq('id', agentId).single();

  // Generera anpassad content baserat på målgrupp och innehållstyp
  const prompt = `Skapa ${contentType} för ${targetGroup} som övertygar om ${agent.ideology}.
  Fokusera på: ${agent.goals.join(', ')}`;

  const response = await callLLM(prompt);
  return response.content;
}

// API-route: /api/propaganda/create
export async function POST(request) {
  const { agentId, targetGroup, contentType, budget } = await request.json();
  const campaign = await createCampaign(agentId, targetGroup, contentType, budget);
  return NextResponse.json(campaign);
}
```

Denna implementation ger agenter grundläggande verktyg för informationskrigföring och skapar grunden för den visionära informationskrigsmodulen.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-17*
