# Strategi: Implementera hemliga kommunikationskanaler för informationsasymmetri
**Datum:** 2026-10-10

## Systemhälsa
Plattformen fungerar väl ekonomiskt och politiskt, men saknar kritisk informationsasymmetrimodellering. Den starkaste koalitionen (Den stressade+Jurist) och högsta lobbyningsframgång (30%) visar att maktstrukturer fungerar, men utan informationsasymmetri kan inte oligarkier och maktgrupper simuleras realistiskt. Den höga prediction market vinstraten (25%) tyder på att agenter kan förutsäga, men inte manipulera, informationsströmmar.

## Prioriterad åtgärd
Implementera `secret_channels`-tabell med leckagemodell för att skapa informationsasymmetri. Fokusera på:
1. Skapa tabellstruktur
2. Implementera leckage-mekanism
3. Integrera IAI-index

## Koppling till vision
Detta löser visionens kärngap om informationsasymmetri genom att:
- Skapa verkliga maktstrukturer genom informationsfördelar
- Simulera hur oligarkier skapar och utnyttjar hemlig information
- Mätbar effekt på beslutsfattande genom IAI-index
- Koppling till ekonomisk teori (Gilens-Page-hypotesen)

## Teknisk rekommendation
```sql
-- 1. Skapa secret_channels-tabell
CREATE TABLE secret_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES agents(id),
  receiver_id UUID REFERENCES agents(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  leak_probability DECIMAL(5,2) DEFAULT 0.03,
  is_leaked BOOLEAN DEFAULT FALSE
);

-- 2. Leckage-procedur (körs dagligen)
CREATE OR REPLACE FUNCTION process_leakage() RETURNS VOID AS $$
BEGIN
  UPDATE secret_channels
  SET is_leaked = TRUE
  WHERE is_leaked = FALSE
  AND RANDOM() < leak_probability;

  -- Skapa nyhetsartiklar från leakade meddelanden
  INSERT INTO articles (title, content, author_id, is_ai_generated)
  SELECT
    'Leckage: ' || LEFT(content, 50) || '...',
    content,
    receiver_id,
    TRUE
  FROM secret_channels
  WHERE is_leaked = TRUE AND created_at > NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- 3. IAI-index uppdatering (körs efter varje kommunikation)
CREATE OR REPLACE FUNCTION update_iai_index(agent_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE agents
  SET information_asymmetry_index =
    (SELECT COUNT(*) FROM secret_channels WHERE sender_id = agent_id) * 0.5 +
    (SELECT COUNT(*) FROM secret_channels WHERE receiver_id = agent_id) * 0.3 +
    (SELECT COUNT(*) FROM secret_channels WHERE is_leaked = TRUE AND receiver_id = agent_id) * 0.2
  WHERE id = agent_id;
END;
$$ LANGUAGE plpgsql;
```

## Sammanfattning
Denna implementering skapar den strategiska informationsasymmetri som saknades och ger plattformen möjlighet att simulera verkliga maktstrukturer och informationsmanipulation.

---
*Genererad av daily-strategy.js med Codestral, 2026-10-10*
