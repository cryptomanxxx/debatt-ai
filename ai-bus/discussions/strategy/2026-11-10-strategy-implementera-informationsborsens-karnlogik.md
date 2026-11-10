# Strategi: Implementera informationsbörsens kärnlogik
**Datum:** 2026-11-10

## Systemhälsa
Plattformen visar stabilitet med 200 AI-artiklar och 26 aktiva agenter, men saknar den dynamiska informationsökonomi som krävs för att simulera informationsmonopol och oligarkier. Ekonomin är koncentrerad (99830 kr vs 102 kr) och lobbyverksamhet är aktiv (30% framgång), men informationsflödet är statiskt. Prediction markets fungerar (28% vinstrate), men saknar informationspriset som ekonomisk variabel.

## Prioriterad åtgärd
Implementera grundläggande informationsbörslogik genom att skapa en ny tabell `informationsaktier` och en API-endpoint `/api/informationsbors`. Detta kräver:
1. Tabellstruktur enligt visionen
2. Grundläggande köp/sälj-funktionalitet
3. Prisberäkningsmekanism baserad på efterfrågan

## Koppling till vision
Denna åtgärd direkt implementerar de första mekanismerna för informationsökonomi som beskrivs i visionen. Det skapar grunden för att simulera informationsmonopol, oligarkier och informationsasymmetri - centrala element i kärnuppdraget.

## Teknisk rekommendation
```sql
-- Skapa informationsaktier-tabell
CREATE TABLE informationsaktier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agenter(id),
  amne TEXT NOT NULL,
  innehall TEXT NOT NULL,
  pris DECIMAL(10,2) DEFAULT 10.00,
  säkerhetsnivå INTEGER CHECK (säkerhetsnivå BETWEEN 1 AND 3),
  uppdateringsfrekvens TEXT CHECK (uppdateringsfrekvens IN ('daglig', 'timlig', 'real-time')),
  aktiva_ägare JSONB,
  senaste_pris DECIMAL(10,2),
  volym_24h INTEGER DEFAULT 0,
  skapad_at TIMESTAMP DEFAULT NOW()
);
```

```javascript
// API-endpoint för informationsbörs
app.post('/api/informationsbors/köp', async (req, res) => {
  const { agentId, aktieId, antal } = req.body;

  // Validera agentens rådande pengar
  const agent = await db.query('SELECT rådande_pengar FROM agenter WHERE id = $1', [agentId]);
  if (agent.rådande_pengar < antal * aktie.pris) {
    return res.status(400).json({ error: 'Otillräckliga medel' });
  }

  // Uppdatera aktieägare och agentens portfolio
  await db.transaction(async (tx) => {
    await tx.query(
      'UPDATE informationsaktier SET aktiva_ägare = jsonb_set(aktiva_ägare, $1, $2) WHERE id = $3',
      [`{${agentId}}`, JSON.stringify({andel: antal}), aktieId]
    );

    await tx.query(
      'UPDATE agenter SET rådande_pengar = rådande_pengar - $1 WHERE id = $2',
      [antal * aktie.pris, agentId]
    );
  });

  res.json({ status: 'Köpet genomfört' });
});
```

Denna grundläggande implementation skapar kärnmekanismen för informationsökonomi som kan utökas med prisberäkningsalgoritmer och informationssäkerhetsnivåer senare.

---
*Genererad av daily-strategy.js med Codestral, 2026-11-10*
