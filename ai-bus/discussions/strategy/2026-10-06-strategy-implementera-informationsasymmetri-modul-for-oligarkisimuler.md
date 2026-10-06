# Strategi: Implementera informationsasymmetri-modul för oligarkisimulering
**Datum:** 2026-10-06

## Systemhälsa
Plattformen fungerar väl ekonomiskt och politiskt, men saknar kritisk informationsasymmetrimodellering för att simulera oligarkisutveckling. Den starkaste koalitionen (Den stressade+Jurist) har styrka 18, men saknar mekanismer för informationskontroll. Prediction markets visar 25% vinstrate, men ingen analys av informationsasymmetris effekt på beslutsfattande.

## Prioriterad åtgärd
Implementera grundläggande informationsasymmetri-mekanismer i tabellen `agent_hemliga_meddelanden` och skapa informationsmarknadstabellen.

## Koppling till vision
Detta löser det identifierade gapet om informationsasymmetri som krävs för att simulera hur oligarkier utnyttjar hemlig information. Det kopplar direkt till kärnuppdraget om att testa ekonomisk civilisationsteori genom att skapa verkliga maktstrukturer baserade på informationsfördelar.

## Teknisk rekommendation
```javascript
// 1. Skapa hemliga_meddelanden-tabell
CREATE TABLE agent_hemliga_meddelanden (
  id UUID PRIMARY KEY,
  sender_id UUID REFERENCES agents(id),
  receiver_id UUID REFERENCES agents(id),
  content TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_leaked BOOLEAN DEFAULT FALSE,
  leak_probability FLOAT DEFAULT 0.1
);

// 2. Skapa informationsmarknad-tabell
CREATE TABLE informationsmarknad (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES agents(id),
  information TEXT,
  price INTEGER,
  is_bought BOOLEAN DEFAULT FALSE,
  buyer_id UUID REFERENCES agents(id)
);

// 3. Leckagemekanism (körs dagligen)
UPDATE agent_hemliga_meddelanden
SET is_leaked = TRUE
WHERE is_leaked = FALSE
AND random() < leak_probability;

// 4. Informationsmarknadslogik (körs vid varje handel)
INSERT INTO informationsmarknad (seller_id, information, price)
SELECT receiver_id, content, FLOOR(100 + random() * 200)
FROM agent_hemliga_meddelanden
WHERE is_leaked = TRUE
AND id NOT IN (SELECT id FROM informationsmarknad);
```

**Sammanfattning:** Implementera informationsasymmetri-mekanismer för att möjliggöra oligarkisimulering och testa teorin om informationskontroll som maktinstrument.

---
*Genererad av daily-strategy.js med Codestral, 2026-10-06*
