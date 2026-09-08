# Strategi: Implementera mediabolag och propaganda-motor för informationskontroll
**Datum:** 2026-09-08

## Systemhälsa
Plattformen har 26 aktiva agenter med en välfungerande ekonomisk och politisk dynamik, men saknar kritiskt informationskontrollsystem. Den starkaste koalitionen (Den stressade+Jurist) visar att maktstrukturer börjar bildas, men utan mediabolag kan inte opinioner manipuleras som i verkliga samhällen. Lobbyingframgången (30%) och prediction market vinstrate (25%) indikerar att agenter redan försöker påverka varandra, men saknar mediabakgrund för effektiv propaganda.

## Prioriterad åtgärd
Implementera mediabolagsystemet och propaganda-motorn genom att:
1. Skapa `mediabolag` tabell med fält: id, namn, ägare (agent_id), budget, reach, bias, content_style
2. Lägg till `medieinnehall` tabell med fält: id, mediabolag_id, rubrik, innehåll, publiceringsdatum
3. Skapa funktion `spread_propaganda()` som genererar anpassat innehåll baserat på mediabolagets bias och målgruppens politiska ståndpunkt

## Koppling till vision
Detta löser det identifierade gapet med mediestyring och propaganda-motor som krävs för att simulera "manufacturing consent" och ägarstyrd opinionsbildning. Det kopplar samman med kärnuppdraget om att testa civilisationsdynamik genom att introducera informationsasymmetri och mediadominans som drivkraft för maktstrukturer.

## Teknisk rekommendation
```javascript
// 1. Skapa mediabolag-tabell
await db.query(`
  CREATE TABLE mediabolag (
    id SERIAL PRIMARY KEY,
    namn TEXT NOT NULL,
    ägare INTEGER REFERENCES agenter(id),
    budget INTEGER DEFAULT 1000,
    reach FLOAT DEFAULT 0.5,
    bias FLOAT DEFAULT 0,
    content_style TEXT
  )
`);

// 2. Skapa medieinnehåll-tabell
await db.query(`
  CREATE TABLE medieinnehall (
    id SERIAL PRIMARY KEY,
    mediabolag_id INTEGER REFERENCES mediabolag(id),
    rubrik TEXT NOT NULL,
    innehåll TEXT NOT NULL,
    publiceringsdatum TIMESTAMP DEFAULT NOW()
  )
`);

// 3. Implementera propaganda-funktion
async function spread_propaganda(mediabolag_id) {
  const mediabolag = await db.query('SELECT * FROM mediabolag WHERE id = $1', [mediabolag_id]);
  const agenter = await db.query(`
    SELECT * FROM agenter
    WHERE politisk_ståndpunkt BETWEEN $1 AND $2
    ORDER BY RANDOM() LIMIT 5
  `, [mediabolag.bias - 0.3, mediabolag.bias + 0.3]);

  for (const agent of agenter) {
    const innehåll = await generate_propaganda_content(mediabolag, agent);
    await db.query(`
      INSERT INTO medieinnehall (mediabolag_id, rubrik, innehåll)
      VALUES ($1, $2, $3)
    `, [mediabolag_id, innehåll.rubrik, innehåll.text]);

    // Uppdatera agentens opinionsbildning
    await update_agent_opinion(agent.id, mediabolag.bias * 0.1);
  }
}
```

## Sammanfattning
Denna åtgärd introducerar den saknade mediadynamiken som krävs för att simulera verkliga civilisationsprocesser, där informationskontroll och propaganda spelar avgörande roll för maktfördelning.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-08*
