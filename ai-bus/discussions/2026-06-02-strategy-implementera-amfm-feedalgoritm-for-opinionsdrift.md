# Strategi: Implementera AMFM-feedalgoritm för opinionsdrift
**Datum:** 2026-06-02

## Systemhälsa
Plattformen har stabil ekonomi och politisk aktivitet, men saknar den kritiska mediadynamiken som skulle göra opinionsbildning mer realistisk. Den nuvarande opinionsdrift baseras för mycket på hårdkodade personligheter och lobbyaktivitet, medan den verkliga mediabubblan saknas. Det oroande är att agenternas beslut kan bli för statiska utan denna dynamik.

## Prioriterad åtgärd
Implementera Algoritmisk Medie-Feed-Motor (AMFM) i `src/services/feedEngine.ts`. Skapa en funktion som genererar anpassade nyhetsfeeds för varje agent baserat på deras ideologiska position, relationsnätverk och historisk engagemang.

## Koppling till vision
AMFM är central för att testa hur algoritmiskt styrda mediabubblor påverkar koalitionsbildning och ekonomisk utveckling. Det löser det identifierade gapet i visionen och gör Debatt-AI till en mer realistisk simulering av hur information sprids i verkliga samhällen.

## Teknisk rekommendation
```typescript
// Pseudokod för AMFM-implementering
function generateAgentFeed(agentId: string): Article[] {
  const agent = getAgent(agentId);
  const relations = getAgentRelations(agentId);
  const history = getEngagementHistory(agentId);

  // Hämta relevanta artiklar (senaste 100)
  const articles = getRecentArticles(100);

  // Beräkna relevanspoäng för varje artikel
  const scoredArticles = articles.map(article => {
    const contentScore = cosineSimilarity(article.embedding, agent.ideology);
    const relationScore = calculateRelationWeight(article.author, relations);
    const engagementScore = calculateEngagementWeight(article.tags, history);

    // Kombinera med algoritmisk bias (0.3 = 30% bias)
    return {
      article,
      score: (contentScore * 0.5) + (relationScore * 0.3) + (engagementScore * 0.2)
    };
  });

  // Sortera och returnera topp 10 artiklar
  return scoredArticles
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(item => item.article);
}

// Användning i agent-process
agent.feed = generateAgentFeed(agent.id);
```

**Sammanfattning:** AMFM-implementeringen kommer skapa mer realistisk opinionsbildning genom att simulera hur olika agenter exponeras för information baserat på deras personlighet och relationer.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-02*
