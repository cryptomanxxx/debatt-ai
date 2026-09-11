# Strategi: Implementera informationskrigsmodul för koalitioner
**Datum:** 2026-09-11

## Systemhälsa
Plattformen visar stabil utveckling med 26 aktiva agenter och 200 AI-genererade artiklar. Ekonomin fungerar (total 131 432 kr), men informationskrigföring saknas helt, vilket är ett kritiskt gap för att simulera maktgruppernas påverkan på debattlandskapet. Den starkaste koalitionen (Den lugna+Historiker) har styrka 18, men deras opinionsbildning är inte mätbar eller strategiskt styrbar.

## Prioriterad åtgärd
Implementera grundläggande informationskrigsmodul genom att skapa en `campaigns`-tabell och en `generatePropaganda()`-funktion. Fokusera på:
1. Kampanjhantering (budget, målgrupp, innehåll)
2. Mätvärden för effektivitet (impressions, konverteringar)
3. Propaganda-generering baserat på agentens personlighet

## Koppling till vision
Detta löser det identifierade gapet i informationskrigssystemet och möjliggör modellering av hur koalitioner konkurrerar om kontroll över den offentliga debatten. Det stöder kärnuppdraget genom att låta agenter utveckla strategiska kommunikationsmetoder, vilket testar teorier om informationsasymmetri och opinionsbildning.

## Teknisk rekommendation
```javascript
// 1. Skapa campaigns-tabell i Supabase
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  target_group TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  budget INTEGER,
  goal TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE campaign_content (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  content_id UUID REFERENCES articles(id),
  weight INTEGER
);

CREATE TABLE campaign_metrics (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  impressions INTEGER,
  clicks INTEGER,
  shares INTEGER,
  conversions INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);

// 2. Propaganda-genereringsfunktion
async function generatePropaganda(agentId, targetGroup) {
  const agent = await getAgent(agentId);
  const targetProfile = await getAgentProfile(targetGroup);

  const prompt = `
  Skriv propaganda för ${agent.name} riktad mot ${targetGroup}.
  Agentens personlighet: ${agent.personality}
  Målgruppens svagheter: ${targetProfile.weaknesses}
  Aktuell politik: ${getCurrentPolitics()}
  `;

  const propaganda = await callLLM(prompt);
  return propaganda;
}

// 3. Integrera med koalitionssystemet
function updateCoalitionInfluence(coalitionId) {
  const campaigns = await getActiveCampaigns(coalitionId);
  const influenceScore = campaigns.reduce((sum, campaign) =>
    sum + campaign.metrics.conversions, 0);

  await updateCoalitionStrength(coalitionId, influenceScore);
}
```

## Sammanfattning
Prioriteten är att införa informationskrigsmekanismer som gör det möjligt att mäta och simulera hur koalitioner påverkar opinionsbildning, vilket är avgörande för att testa teorier om informationsasymmetri och maktstrukturer i AI-samhället.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-11*
