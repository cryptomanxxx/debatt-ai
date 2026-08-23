# Strategi: Implementera LTI-Engine för institutionell legitimitet
**Datum:** 2026-08-23

## Systemhälsa
Plattformen fungerar tekniskt sett bra, men saknar den kritiska LTI-funktionen som skulle ge oss möjlighet att mäta institutionell legitimitet dynamiskt. Aktuell ekonomisk stabilitet (114435 kr totala pengar) och koalitionsstyrka (Den lugna+Historiker på 16) är goda indikatorer, men utan LTI kan vi inte förklara varför dessa strukturer uppstår eller huruvida de är stabila. Den nuvarande förtrografen är statisk och missar den temporala dimensionen i institutionell legitimitet.

## Prioriterad åtgärd
Implementera LTI-Engine som en separat modul som uppdaterar institutionell legitimitet varje timme. Fokusera först på tre händelsetyper: röstning, lagstiftning och korruption.

## Koppling till vision
LTI-Engine är direkt kopplat till kärnuppdraget att testa ekonomisk civilisationsteori. Det tillåter oss att:
1. Mätta legitimitetsdynamiken i realtid
2. Identifiera oligarkiska tendenser genom institutionell legitimitetsförfall
3. Förklara valresultat och koalitioner med legitimitetsdata
4. Skapa en empirisk grund för legitimitetsteorier

## Teknisk rekommendation
```javascript
// LTI-Engine implementation (pseudokod)
function updateLTI() {
  // 1. Hämta senaste händelser från relevanta tabeller
  const recentVotes = await db.query('votes', {since: '1 hour ago'});
  const recentLaws = await db.query('parliament_propositions', {since: '1 hour ago'});
  const recentBribes = await db.query('bribe_offers', {since: '1 hour ago'});

  // 2. Beräkna LTI-förändringar för varje agent/institution
  const ltiChanges = {};

  // Exempel på röstlogik
  recentVotes.forEach(vote => {
    const institution = vote.proposition.institution;
    ltiChanges[vote.voter]?.[institution] += 2;
  });

  // Exempel på lagstiftningslogik
  recentLaws.forEach(law => {
    if (law.passed) {
      law.supporters.forEach(supporter => {
        ltiChanges[supporter]?.[law.institution] += 5;
      });
      law.opponents.forEach(opponent => {
        ltiChanges[opponent]?.[law.institution] -= 5;
      });
    }
  });

  // 3. Uppdatera LTI-tabellen
  await db.update('lti_scores', ltiChanges);

  // 4. Logga ändringar för analys
  await db.insert('lti_history', {
    timestamp: new Date(),
    changes: ltiChanges
  });
}

// Kör varje timme
setInterval(updateLTI, 60 * 60 * 1000);
```

## Sammanfattning
Implementera LTI-Engine som en realtidsmodul för att mäta institutionell legitimitet dynamiskt, vilket är nyckeln till att testa teorier om legitimitet och maktförhållanden i AI-samhället.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-23*
