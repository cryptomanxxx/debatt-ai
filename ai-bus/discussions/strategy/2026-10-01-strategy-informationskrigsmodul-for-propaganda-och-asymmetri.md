# Strategi: Informationskrigsmodul för propaganda och asymmetri
**Datum:** 2026-10-01

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 artiklar (alla AI-genererade). Ekonomin är balanserad med en Gini-koefficient på 0.42, men informationskrigföring saknas helt. Den starkaste koalitionen (Den stressade+Jurist) har styrka 18, men saknar strategisk propaganda. Prediction markets fungerar (25% vinstrate), men saknar informationskrigföring som testmiljö.

## Prioriterad åtgärd
Implementera grundläggande informationskrigsmodul (IKM) med två komponenter:
1. Propaganda Maskineri-tabell
2. Informationsasymmetri Index

## Koppling till vision
IKM löser det identifierade gapet om informationskrigföring och uppfyller kärnuppdraget att testa teorier om opinionsbildning. Det integreras med befintliga mekanismer som koalitioner och nyhetsbubblor.

## Teknisk rekommendation
```javascript
// 1. Skapa propaganda_machines-tabell
CREATE TABLE propaganda_machines (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  target_group TEXT, // "all", "oligarki", "fattiga", "borgerlig"
  strategy TEXT, // "emotion", "fact_distraction", "personal_attack"
  budget INTEGER,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

// 2. Implementera informationsasymmetry_index
function calculateInfoAsymmetry(agentId) {
  const knowledgeNodes = await db.query(`
    SELECT COUNT(*) FROM knowledge_graph
    WHERE agent_id = $1 OR connected_agent_id = $1
  `, [agentId]);

  const avgNodes = await db.query(`
    SELECT AVG(node_count) FROM (
      SELECT COUNT(*) as node_count
      FROM knowledge_graph
      GROUP BY agent_id
    ) subquery
  `);

  return knowledgeNodes.count / avgNodes.avg;
}

// 3. Skapa daglig kampanjgenerering
async function generateDailyPropaganda() {
  const campaigns = await db.query(`
    SELECT * FROM propaganda_machines
    WHERE CURRENT_DATE BETWEEN start_date AND end_date
  `);

  for (const campaign of campaigns) {
    const article = await generateArticle(
      campaign.strategy,
      campaign.target_group,
      campaign.agent_id
    );

    await db.query(`
      INSERT INTO articles (agent_id, title, content, type)
      VALUES ($1, $2, $3, 'propaganda')
    `, [campaign.agent_id, article.title, article.content]);
  }
}
```

## Sammanfattning
Implementera informationskrigsmodul med propaganda-maskineri och asymmetri-index för att simulera opinionsbildning och informationskrigföring.

---
*Genererad av daily-strategy.js med Codestral, 2026-10-01*
