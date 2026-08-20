# Strategi: Implementera LTI-kärnan i trust_scores-tabellen
**Datum:** 2026-08-20

## Systemhälsa
Plattformen fungerar tekniskt, men saknar den centrala legitimitetsmätaren som visionen kräver. Aktuell ekonomisk koncentration (Gini: 0.62) och koalitionsdynamik tyder på oligarkisk drift, men utan LTI kan vi inte förklara varför. Prediction markets fungerar (27% vinstrate), men utan tillitmätningar kan vi inte testa teorier om informationsasymmetri. Prioritering: LTI-kärnan måste implementeras innan plattformen kan testa legitimitets- och tillitsteorier.

## Prioriterad åtgärd
Implementera grundläggande LTI-kalkyl i `trust_scores`-tabellen genom att:
1. Initialisera alla agenter med 0.5 basvärde mot institutioner
2. Lägga till grundläggande händelsepoäng:
   - +0.1 för politisk framgång
   - -0.2 för skandal
   - +0.05 för neutralt stöd
3. Lägga till tidsavkling (0.95× per vecka)

## Koppling till vision
LTI är kärnan i visionen om att kvantifiera legitimitet. Nuvarande system kan generera koalitioner och ekonomisk drift, men utan LTI kan vi inte förklara varför agenter accepterar eller motar institutioner. LTI gör det möjligt att testa teorier om legitimitetskriser och institutionell motståndskraft.

## Teknisk rekommendation
```javascript
// Pseudokod för LTI-uppdatering i trust_scores-tabellen
function updateLTI() {
  // 1. Hämta senaste händelser från trust_events
  const events = await db.query(`
    SELECT * FROM trust_events
    WHERE processed = false
    ORDER BY timestamp DESC
  `);

  // 2. Uppdatera förtroende baserat på händelsetyper
  for (const event of events) {
    let delta = 0;
    switch(event.event_type) {
      case 'policy_success': delta = 0.1; break;
      case 'scandal': delta = -0.2; break;
      case 'neutral_support': delta = 0.05; break;
    }

    // 3. Uppdatera trust_scores-tabellen
    await db.query(`
      UPDATE trust_scores
      SET score = score + $1,
          last_update = NOW()
      WHERE agent_id = $2 AND target_type = $3 AND target_id = $4
    `, [delta, event.source_agent_id, event.target_type, event.target_id]);
  }

  // 4. Tillämpa tidsavkling (0.95×)
  await db.query(`
    UPDATE trust_scores
    SET score = score * 0.95
    WHERE last_update < NOW() - INTERVAL '7 days'
  `);
}
```

## Sammanfattning
LTI-kärnan måste implementeras för att kunna testa legitimitets- och tillitsteorier i plattformen.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-20*
