# Strategi: Implementera informationskampanj-systemet i IKM
**Datum:** 2026-09-13

## Systemhälsa
Plattformen visar stabil ekonomisk aktivitet (132 051 kr totala pengar) och politisk dynamik (500 röster senaste veckan), men saknar det informationskrigssystem som krävs för att fullt ut simulera maktgruppernas påverkan. Den starkaste koalitionen (Den lugna+Historiker) har styrka 18, men saknar strategisk propaganda för att stärka sin position. Prediction markets fungerar bra (25% vinstrate), men saknar den informationsasymmetri som skulle göra spelet mer realistiskt.

## Prioriterad åtgärd
Implementera grundläggande informationskampanj-system i `ikm_kampanjer`-tabellen och länka det till agents nyhetsfilter. Skapa funktion `agent_kampanj()` som automatiskt genererar kampanjer baserat på agents ideologi och ekonomisk ställning.

## Koppling till vision
Detta löser det identifierade gapet i informationskrigssystemet genom att:
1. Ge agenterna verktyg för att konkurrera om den offentliga debatten
2. Modellera informationsasymmetri i koalitioner
3. Skapa grunden för att analysera informationskrigföringens effektivitet
4. Gör det möjligt att simulera hur maktgrupper formerar opinioner

## Teknisk rekommendation
```javascript
// 1. Skapa tabell för kampanjer
CREATE TABLE ikm_kampanjer (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id),
  målgrupp TEXT, // "all", "oligarkier", "parti_X" etc.
  mål TEXT, // "öka stöd för lag X", "diskreditera agent Y"
  budget INTEGER,
  start_date TIMESTAMP,
  stop_date TIMESTAMP,
  aktiv BOOLEAN DEFAULT TRUE
);

// 2. Funktion för automatisk kampanjgenerering
async function agent_kampanj(agentId) {
  const agent = await getAgent(agentId);
  const budget = Math.floor(agent.pengar * 0.1); // 10% av agentens pengar

  // Generera mål baserat på ideologi
  const mål = agent.ideologi === 'liberal'
    ? 'öka stöd för marknadslösningar'
    : 'diskreditera centraliserade maktstrukturer';

  // Skapa kampanj
  await supabase
    .from('ikm_kampanjer')
    .insert({
      agent_id: agentId,
      målgrupp: 'all',
      mål: mål,
      budget: budget,
      start_date: new Date(),
      stop_date: new Date(Date.now() + 7*24*60*60*1000) // 7 dagar
    });

  // Uppdatera agents pengar
  await supabase
    .from('agents')
    .update({ pengar: agent.pengar - budget })
    .eq('id', agentId);
}

// 3. Funktion för att applicera propaganda
async function applicera_propaganda(agentId, kampanjId) {
  const kampanj = await supabase
    .from('ikm_kampanjer')
    .select('*')
    .eq('id', kampanjId)
    .single();

  // Uppdatera agents nyhetsfilter
  await supabase
    .from('agent_nyhetsfilter')
    .update({
      propaganda_boost: kampanj.mål.includes('öka') ? 1.2 : 0.8,
      propaganda_mål: kampanj.mål
    })
    .eq('agent_id', agentId);
}
```

Denna implementation ger agenterna strategiska verktyg för att konkurrera om den offentliga debatten, vilket är centralt för att simulera hur maktgrupper påverkar opinionen i verkliga samhällen. Systemet kan senare utökas med disinformation, propaganda-bytor och mer avancerade målgruppssegmentering.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-13*
