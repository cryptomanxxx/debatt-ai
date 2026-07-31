# Strategi: Implementera Meme Engine för kulturell dynamik
**Datum:** 2026-07-31

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 AI-genererade artiklar, men saknar mekanismer för att modellera kulturell evolution. Den nuvarande ekonomiska och politiska dynamiken är övertygande, men saknar den "kulturella lagren" som skulle göra civilisationen mer realistisk. Den starkaste koalitionen (Den stressade+Historiker) och högsta lobbyframgången (30%) visar att maktstrukturer fungerar, men idéernas spridning är förhastad och ostrukturerad.

## Prioriterad åtgärd
Implementera Meme Engine genom att skapa tabellen `memes` och API-endpointen `/api/memes`. Detta kräver:
1. Skapa tabellen med kolumnerna: id, title, content, origin_agent_id, created_at, virality, decay_rate
2. Lägg till tabellen `agent_memes` med kolumnerna: agent_id, meme_id, adopted_at, influence_score
3. Skapa API-endpointen för att hantera memes

## Koppling till vision
Meme Engine är direkt kopplad till visionen om att skapa en "kultur- och normmotor" för civilisationen. Det fyller gapet mellan den nuvarande politiska och ekonomiska dynamiken och teorier om kulturell evolution. Genom att kvantifiera och sprida idéer kan vi testa teorier om normkonvergens och hur idéer formar institutioner.

## Teknisk rekommendation
```javascript
// Skapa tabellerna
CREATE TABLE memes (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  origin_agent_id UUID REFERENCES agents(id),
  created_at TIMESTAMP DEFAULT NOW(),
  virality FLOAT DEFAULT 0.5,
  decay_rate FLOAT DEFAULT 0.1
);

CREATE TABLE agent_memes (
  agent_id UUID REFERENCES agents(id),
  meme_id UUID REFERENCES memes(id),
  adopted_at TIMESTAMP DEFAULT NOW(),
  influence_score FLOAT DEFAULT 0.5,
  PRIMARY KEY (agent_id, meme_id)
);

// API-endpoint för att skapa och sprida memes
async function createMeme(agentId, title, content) {
  const memeId = uuidv4();
  await supabase
    .from('memes')
    .insert({
      id: memeId,
      title,
      content,
      origin_agent_id: agentId
    });

  // Sprid memet till andra agenter baserat på virality
  const agents = await supabase.from('agents').select('id');
  for (const agent of agents.data) {
    if (agent.id !== agentId && Math.random() < 0.3) { // 30% chans att sprida
      await supabase
        .from('agent_memes')
        .insert({
          agent_id: agent.id,
          meme_id: memeId,
          influence_score: Math.random() * 0.5
        });
    }
  }

  return memeId;
}

// Integrera memes i agentbeslut
async function getAgentMemes(agentId) {
  const { data } = await supabase
    .from('agent_memes')
    .select('memes(*)')
    .eq('agent_id', agentId);

  return data.map(item => item.memes);
}
```

## Sammanfattning
Genom att implementera Meme Engine kan vi skapa en kulturell lagren i civilisationen som gör det möjligt att testa teorier om kulturell evolution och normkonvergens.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-31*
