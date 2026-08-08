# Strategi: Implementera ODE-kärnan för idédiffusion
**Datum:** 2026-08-08

## Systemhälsa
Plattformen fungerar väl ekonomiskt (stabil total ekonomi, bra prediction market vinstrate) och politiskt (aktiv debatt, stabil koalitioner), men saknar den kritiska informationsspridningsmekanismen som skulle möjliggöra studier av sociala förstärkningar och polarisering. Den nuvarande informationsflödesstrukturen är för passiv och saknar den nätverksbaserade interaktion som krävs för att testa teorier om idéviralisering.

## Prioriterad åtgärd
Implementera ODE-kärnan genom att skapa en ny tabell `ideas` och modifiera agentens beslutslogik för att inkludera exponering och adoption av idéer. Fokusera först på grundläggande funktioner innan komplexa nätverksmekanismer införs.

## Koppling till vision
Detta direkt implementerar Opinion Diffusion Engine (ODE) som beskrivs i visionen, vilket är centralt för att studera hur idéer sprids och påverkar opinioner. Det skapar grunden för att testa teorier om kritisk mass, kaskadeffekter och sociala förstärkningar som saknas i plattformen idag.

## Teknisk rekommendation
```javascript
// 1. Skapa ideas-tabell i Supabase
CREATE TABLE ideas (
  id UUID PRIMARY KEY,
  creator_agent_id UUID REFERENCES agents(id),
  topic_tag TEXT REFERENCES tags(tag),
  initial_utility FLOAT,
  adoption_threshold FLOAT,
  decay_rate FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

// 2. Modifiera agentens beslutslogik (pseudokod)
function processIdeaDiffusion(agent) {
  // 1. Exponera agent till alla idéer
  const exposedIdeas = getIdeasExposedToAgent(agent);

  // 2. Beräkna adoptionchans för varje idé
  for (const idea of exposedIdeas) {
    const adoptionProbability = calculateAdoptionProbability(
      agent,
      idea,
      agent.relations,
      agent.personality
    );

    // 3. Adoptera idé med sannolikhet
    if (Math.random() < adoptionProbability) {
      adoptIdea(agent, idea);
      updateAgentOpinion(agent, idea.topic_tag);
    }
  }

  // 4. Uppdatera idéers levnadstid
  decayIdeas();
}

// 3. Lägg till API-endpoint för idégenerering
POST /api/diffusion/ideas/create
{
  creator_agent_id: UUID,
  topic_tag: TEXT,
  initial_utility: FLOAT,
  adoption_threshold: FLOAT,
  decay_rate: FLOAT
}
```

Denna implementering skapar grunden för att studera informationsspridning i plattformen, vilket är direkt kopplat till kärnuppdraget om att testa ekonomisk civilisationsteori.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-08*
