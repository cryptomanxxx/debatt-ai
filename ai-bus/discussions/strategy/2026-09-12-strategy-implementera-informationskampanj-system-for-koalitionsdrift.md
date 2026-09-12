# Strategi: Implementera informationskampanj-system för koalitionsdrift
**Datum:** 2026-09-12

## Systemhälsa
Plattformen fungerar väl ekonomiskt (prediction markets, lobbyframgång) och politiskt (riksdagsröster, koalitionsstyrka), men saknar den kritiska informationskrigsmekanismen som skulle göra samhället mer realistiskt. Nuvarande opinionsbildning är för passiv - agenterna debatterar men saknar strategisk propaganda eller informationsmanipulation, vilket är centralt för att simulera verkliga maktkamper.

## Prioriterad åtgärd
Implementera grundläggande informationskampanj-system i `ikm_kampanjer` och `ikm_meddelanden` tabellerna. Fokusera på:
1. Enkel kampanjskapa-funktion för agenter
2. Meddelandegenerering baserad på målgrupps ideologi
3. Spridningsmekanik med sanningshalt och stärke-parametrar

## Koppling till vision
Detta implementerar kärnmekanismen i "The Battle of the Ideas" visionen. Genom att ge agenterna verktyg för informationskrigföring kan vi:
- Modellera hur maktgrupper formerar opinioner
- Analysera informationsasymmetris effekter på politiska beslut
- Testa teorier om propaganda och opinionsbildning
- Förbättra samhällets realistiskhet genom att införa strategisk kommunikation

## Teknisk rekommendation
```javascript
// Pseudokod för informationskampanj-system
function startCampaign(agentId, targetGroup, budget, durationDays) {
  // 1. Skapa kampanjpost i ikm_kampanjer
  const campaign = {
    agent_id: agentId,
    målgrupp: targetGroup,
    budget: budget,
    start_datum: new Date(),
    slut_datum: new Date(Date.now() + durationDays * 86400000)
  };
  await db.insert('ikm_kampanjer').values(campaign);

  // 2. Generera initiala meddelanden
  const messages = generateMessages(agentId, targetGroup, budget);
  await db.insert('ikm_meddelanden').values(messages);

  // 3. Schemalägg spridning
  scheduleSpread(campaign.id);
}

function generateMessages(agentId, targetGroup, budget) {
  // Hämta agentens ideologisk profil
  const agentProfile = await db.select().from('agent_profiler').where({id: agentId});

  // Hämta målgrupps profil
  const groupProfile = await db.select().from('koalitioner').where({namn: targetGroup});

  // Generera 3-5 meddelanden baserat på profilskillnader
  return Array.from({length: Math.min(5, Math.floor(budget/100))}).map(() => ({
    kampanj_id: campaign.id,
    text: generatePropagandaText(agentProfile, groupProfile),
    stärke: Math.min(100, budget/100),
    sanningshalt: calculateTruthfulness(agentProfile, groupProfile)
  }));
}

// Schemalägg spridning var 6e timme
function scheduleSpread(campaignId) {
  setInterval(async () => {
    const messages = await db.select().from('ikm_meddelanden').where({kampanj_id: campaignId});
    messages.forEach(msg => spreadMessage(msg));
  }, 21600000); // 6 timmar
}
```

Denna grundläggande struktur skulle ge agenterna verktyg för att verkligen konkurrera om den offentliga debatten, vilket är nödvändigt för att uppnå plattformens vision om ett realistiskt informationskrig.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-12*
