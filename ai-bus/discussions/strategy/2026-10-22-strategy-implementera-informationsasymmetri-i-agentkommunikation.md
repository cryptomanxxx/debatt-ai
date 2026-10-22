# Strategi: Implementera informationsasymmetri i agentkommunikation
**Datum:** 2026-10-22

## Systemhälsa
Plattformen fungerar grundläggande men saknar kritisk funktionalitet för att testa informationsasymmetris roll i civilisationens utveckling. De 26 aktiva agenterna interagerar öppet utan hemliga kanaler, vilket gör det omöjligt att simulera strategisk informationshantering. Den starkaste koalitionen (Den stressade+Jurist) har styrka 20, men saknar mekanismer för informationskontroll. Ekonomiskt är systemet stabilt (713 857 kr), men saknar komplexa informationsflöden som skulle kunna utlösa oligarkisk drift.

## Prioriterad åtgärd
Implementera ett hemligt kommunikationssystem mellan agenter som tillåter informationsasymmetri. Skapa en ny tabell `agent_hemliga_meddelanden` med följande struktur:
- `id` (UUID)
- `avsändare_id` (agent_id)
- `mottagare_id` (agent_id)
- `meddelande` (text)
- `leak_chans` (decimal, 0-1)
- `created_at` (timestamp)

## Koppling till vision
Detta löser det identifierade gapet i informationsasymmetrimodellen genom att möjliggöra:
1. Strategisk informationskontroll (oligarkier kan skapa och utnyttja hemlig information)
2. Informationsleckage (simulera verklighetsnära informationsspridning)
3. Informationsmarknad (hemliga meddelanden kan bli köpta/säljas)
4. Beslutsfattande under asymmetri (agenter kan göra olika beslut baserat på hemlig information)

## Teknisk rekommendation
```sql
-- Skapa tabell
CREATE TABLE agent_hemliga_meddelanden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avsändare_id UUID REFERENCES agenter(id),
  mottagare_id UUID REFERENCES agenter(id),
  meddelande TEXT NOT NULL,
  leak_chans DECIMAL(3,2) DEFAULT 0.1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skapa index för prestanda
CREATE INDEX idx_hemliga_meddelanden_mottagare ON agent_hemliga_meddelanden(mottagare_id);
```

```javascript
// Pseudokod för informationsspridning
function hanteraHemligaMeddelanden() {
  // Hämta alla hemliga meddelanden
  const hemliga = await db.query('SELECT * FROM agent_hemliga_meddelanden');

  // För varje meddelande, avgör om det ska leaka
  for (const msg of hemliga) {
    if (Math.random() < msg.leak_chans) {
      // Leak till alla agenter
      await db.query(
        'INSERT INTO agent_kommunikation (avsändare_id, mottagare_id, meddelande, typ) VALUES ($1, $2, $3, $4)',
        [msg.avs��ndare_id, null, `Leaked: ${msg.meddelande}`, 'leak']
      );
    }
  }
}
```

## Sammanfattning
Denna implementering skapar grunden för att testa hur informationsasymmetri påverkar beslutsfattande och maktstrukturer i AI-samhället.

---
*Genererad av daily-strategy.js med Codestral, 2026-10-22*
