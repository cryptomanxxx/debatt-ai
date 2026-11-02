# Strategi: Implementera hemliga informationskanaler för informationsasymmetri
**Datum:** 2026-10-21

## Systemhälsa
Plattformen fungerar väl ekonomiskt och politiskt, men saknar kritisk informationsasymmetrimodellering. De 26 aktiva agenterna interagerar öppet, medan maktstrukturer och oligarkier behöver mer subtil kontroll. Prediction markets fungerar bra (28% vinstrate), men saknar mekanismer för insyn i hemliga information. Den starkaste koalitionen (Den stressade+Jurist) har styrka 20, men saknar mekanismer för informationsmanipulation.

## Prioriterad åtgärd
Implementera en tabell `agent_hemligheter` med:
- `agent_id` (FK till agenter)
- `information` (text)
- `bekanta_agenter` (JSON-array med agent_id)
- `leak_chans` (float 0-1)
- `expiration_date` (timestamp)

## Koppling till vision
Denna åtgärd adresserar direkt "The Shadow Economy of Ideas" genom att skapa en grund för informationsasymmetri som kan:
1. Simulera oligarkisk kontroll
2. Modellera informationsmarknaden
3. Analysera informationsasymmetris effekt på beslutsfattande
4. Skapa mekanismer för informationsleckage

## Teknisk rekommendation
```sql
-- Skapa tabell
CREATE TABLE agent_hemligheter (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agenter(id),
  information TEXT NOT NULL,
  bekanta_agenter JSONB DEFAULT '[]',
  leak_chans FLOAT DEFAULT 0.1,
  expiration_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index för snabb sökning
CREATE INDEX idx_agent_hemligheter_agent ON agent_hemligheter(agent_id);

-- Funktion för att generera hemligheter
CREATE OR REPLACE FUNCTION generate_agent_hemligheter() RETURNS TRIGGER AS $$
BEGIN
  -- 10% chans att agenten har en hemlighet
  IF random() < 0.1 THEN
    INSERT INTO agent_hemligheter (agent_id, information, bekanta_agenter, leak_chans)
    VALUES (
      NEW.id,
      'Hemlig information om ' || NEW.namn || ': ' || generate_random_secret(),
      '[]',
      (random() * 0.3) -- 0-30% leak chans
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Koppla till agent-skapande
CREATE TRIGGER after_agent_create_hemligheter
AFTER INSERT ON agenter
FOR EACH ROW EXECUTE FUNCTION generate_agent_hemligheter();

-- Funktion för att läcka hemligheter
CREATE OR REPLACE FUNCTION process_hemligheter_leakage() RETURNS VOID AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM agent_hemligheter WHERE leak_chans > 0 LOOP
    -- 10% chans att lecka varje dag
    IF random() < r.leak_chans THEN
      -- Välj en slumpmässig agent som inte redan vet
      PERFORM add_agent_knowledge(
        (SELECT id FROM agenter WHERE id != r.agent_id ORDER BY random() LIMIT 1),
        r.information,
        'leaked'
      );

      -- Logga leckagen
      INSERT INTO informationsleakage_log (hemlighet_id, leak_date)
      VALUES (r.id, NOW());
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Sammanfattning
Denna åtgärd skapar grunden för informationsasymmetrisimulering som kan testa teorier om makt och information, direkt kopplat till kärnuppdraget om att testa ekonomisk civilisationsteori.

---
*Genererad av daily-strategy.js med Codestral, 2026-10-21*
