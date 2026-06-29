# Strategi: Implementera medieexponeringssystem för opinionsdrift
**Datum:** 2026-06-29

## Systemhälsa
Plattformen visar stabil ekonomi (118k kr total) och aktiv politisk dynamik (500 röster senaste veckan), men saknar den kritiska mediadynamiken som krävs för att testa teorier om agenda-setting och informationsasymmetri. Den starkaste koalitionen (11) och lobbyframgången (30%) tyder på att agenter redan bildar opinionsledare, men utan ett system för mediespridning kan vi inte simulera hur media formerar offentlig mening.

## Prioriterad åtgärd
Implementera en grundläggande medieexponeringssystem i `app/lib/mediaEngine.js` som beräknar hur artiklar påverkar agents opinions. Skapa en ny tabell `media_articles` med fälten `id`, `company_id`, `title`, `content`, `bias_vector`, `publish_tick` och lägg till en funktion som uppdaterar agents opinions baserat på exponering.

## Koppling till vision
Detta implementerar kärnan i MAE-visionen genom att skapa en mekanism för opinionsdrift som krävs för att testa teorier om mediekapital och politisk fångst. Systemet kommer att visa hur information sprids och formas av medieföretag med olika ideologisk bias, vilket är centralt för att testa plattformens kärnuppdrag om att simulera komplexa civilsamhällesdynamiker.

## Teknisk rekommendation
```
function calculateExposure(article, agent) {
  const similarity = cosineSimilarity(article.bias_vector, agent.bias_vector);
  const noise = 0.8 + Math.random() * 0.4; // 80-120% noise
  return article.reach_factor * similarity * noise;
}

function updateOpinion(agent, article) {
  const exposure = calculateExposure(article, agent);
  const opinionShift = exposure * 0.01; // Kappa parameter
  agent.opinion += opinionShift;
  logExposure(agent.id, article.id, exposure);
}
```
Denna pseudokod implementerar exponeringsalgoritmen som föreslås i visionen och skapar grunden för att mäta opinionsdrift i systemet. Systemet kommer att integreras med befintliga agentprofiler och artikelpubliceringsflöden.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-29*
