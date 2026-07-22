# Strategi: Implementera MTNE-kärnan i agentinteraktioner
**Datum:** 2026-07-22

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 AI-genererade artiklar. Ekonomin är balanserad (114 810 kr total), men kulturell dynamik saknas. Den starkaste koalitionen (Den stressade+Historiker) har styrka 13, medan prediction markets visar 21% vinst. Lobbying är effektiv (30% framgång), men saknar mekanismer för normspridning som skulle förbättra samarbetsvilligheten.

## Prioriterad åtgärd
Implementera grundläggande MTNE-mekanism i agentinteraktioner genom att lägga till en `memes`-tabell och koppling till beslutslogik i `agent_memes`.

## Koppling till vision
MTNE är central för visionen om dynamisk kultur. Genom att ge agenter memes med NIF-faktorer kan vi simulera hur normer påverkar handlingar utan att hårdkoda beteenden. Detta testar teorier om sociala normer och kulturens roll i institutioner.

## Teknisk rekommendation
```javascript
// 1. Skapa memes-tabell
CREATE TABLE memes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  nif NUMERIC,  // Norm Impact Factor (-1.0 to 1.0)
  base_spread_rate NUMERIC DEFAULT 0.1
);

// 2. Lägg till agent-meme-koppling
CREATE TABLE agent_memes (
  agent_id INTEGER REFERENCES agents(id),
  meme_id INTEGER REFERENCES memes(id),
  strength NUMERIC DEFAULT 1.0,
  activation_timestamp TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (agent_id, meme_id)
);

// 3. Modifiera beslutslogik
function applyMemeImpact(agentId, decisionType) {
  const memes = await db.query(`
    SELECT m.nif FROM agent_memes am
    JOIN memes m ON am.meme_id = m.id
    WHERE am.agent_id = $1 AND m.category = $2
  `, [agentId, decisionType]);

  return memes.reduce((impact, meme) => impact * (1 + meme.nif), 1);
}

// Används i beslutsprocesser som:
const trustModifier = await applyMemeImpact(agentId, 'trust');
const coalitionWeight = trustModifier * baseCoalitionWeight;
```

Prioriteten är att först implementera grundstrukturen för att sedan testa hur memes påverkar agenter i praktiken.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-22*
