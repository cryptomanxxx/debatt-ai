# Strategi: Implementera LTI-motor i trust_scores-tabellen
**Datum:** 2026-08-21

## Systemhälsa
Plattformen visar hälsiga ekonomiska och politiska dynamiker, men saknar den kritiska legitimitetsmätaren som skulle förklara institutionell stabilitet. Aktuell koalitionsstyrka (16) och lobbyningsframgång (30%) tyder på funktionellt samhälle, men utan LTI kan vi inte förklara varför koalitioner upplöses eller oligarkiska tendenser förstärks.

## Prioriterad åtgärd
Implementera LTI-motorn genom att lägga till en `trust_scores`-tabell med kolumnerna:
- `agent_id` (PK)
- `institution` (FK: parlament/domstol/media/ekonomi/agent_{id})
- `score` (0-100)
- `last_updated` (timestamp)

## Koppling till vision
LTI-motorn fyller det identifierade gapet i visionen och möjliggör testning av legitimitetsteorier. Den kommer automatiskt uppdatera förtroendeindex baserat på händelser som lagstiftning, korruption och mediaexponering - exakt vad som behövs för att förklara institutionell drift.

## Teknisk rekommendation
```sql
-- Skapa tabell
CREATE TABLE trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  institution VARCHAR(50), -- 'parlament', 'domstol', 'media', 'ekonomi', eller 'agent_{id}'
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_trust_pair UNIQUE (agent_id, institution)
);

-- Initialiseringsfunktion
CREATE OR REPLACE FUNCTION initialize_trust_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Initialiserar alla agenter med 50 för alla institutioner
  INSERT INTO trust_scores (agent_id, institution, score)
  SELECT id, 'parlament', 50 FROM agents;

  INSERT INTO trust_scores (agent_id, institution, score)
  SELECT id, 'domstol', 50 FROM agents;

  INSERT INTO trust_scores (agent_id, institution, score)
  SELECT id, 'media', 50 FROM agents;

  INSERT INTO trust_scores (agent_id, institution, score)
  SELECT id, 'ekonomi', 50 FROM agents;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Uppdateringsfunktion för händelser
CREATE OR REPLACE FUNCTION update_trust_score(
  p_agent_id UUID,
  p_institution VARCHAR(50),
  p_change INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE trust_scores
  SET score = GREATEST(0, LEAST(100, score + p_change)),
      last_updated = NOW()
  WHERE agent_id = p_agent_id AND institution = p_institution;
END;
$$ LANGUAGE plpgsql;
```

Denna implementation kommer automatiskt uppdatera förtroendeindex när relevanta händelser inträffar, och kan sedan användas för att analysera institutionell legitimitet och sociala relationer.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-21*
