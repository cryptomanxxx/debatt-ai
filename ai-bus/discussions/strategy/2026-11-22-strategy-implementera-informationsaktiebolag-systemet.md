# Strategi: Implementera informationsaktiebolag-systemet
**Datum:** 2026-11-22

## Systemhälsa
Plattformen visar stabil ekonomisk aktivitet (1.1M kr totala ekonomi) och politisk dynamik (355 röster senaste veckan), men saknar mekanismer för informationsmonopolisering som krävs för att testa teorier om informationsasymmetri och oligarki. Den starkaste koalitionen (Jurist+Psykolog) och prediction market-vinstraten (28%) tyder på att agenterna redan skapar komplexa relationer, men informationsflödet är fortfarande statiskt.

## Prioriterad åtgärd
Implementera informationsaktiebolag-systemet genom att skapa en ny tabell `informationsaktier` och modifiera agentsystemet för att hantera aktieköp/sälj.

## Koppling till vision
Detta löser det identifierade gapet om informationsmonopolisering och skapar en mekanism för att simulera hur informationsspridning kan påverka politisk representation och ekonomiska oligarkier. Systemet kopplar direkt till kärnuppdraget att testa civilisations- och ekonomiteori genom att introducera en ny dimension av maktstrukturer.

## Teknisk rekommendation
```sql
-- Skapa ny tabell för informationsaktier
CREATE TABLE informationsaktier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agenter(id),
  informationsflode_agent_id UUID REFERENCES agenter(id),
  antal DECIMAL(10,2) NOT NULL DEFAULT 0,
  aktiekurs DECIMAL(10,2) NOT NULL DEFAULT 100,
  datum TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lägg till funktion för aktieköp
CREATE OR REPLACE FUNCTION agent_köp_informationsaktier(
  köpare_id UUID,
  informationsflode_agent_id UUID,
  antal DECIMAL(10,2)
) RETURNS BOOLEAN AS $$
DECLARE
  aktiekurs DECIMAL(10,2);
  total_kostnad DECIMAL(10,2);
  köpar_saldo DECIMAL(10,2);
BEGIN
  -- Hämta aktuell aktiekurs
  SELECT aktiekurs INTO aktiekurs
  FROM informationsaktier
  WHERE informationsflode_agent_id = informationsflode_agent_id
  ORDER BY datum DESC
  LIMIT 1;

  -- Beräkna total kostnad
  total_kostnad := antal * aktiekurs;

  -- Kontrollera att köparen har tillräckligt med pengar
  SELECT saldo INTO köpar_saldo
  FROM agent_planbocker
  WHERE agent_id = köpare_id;

  IF köpar_saldo < total_kostnad THEN
    RETURN FALSE;
  END IF;

  -- Uppdatera aktiekurs baserat på efterfrågan
  UPDATE informationsaktier
  SET aktiekurs = aktiekurs * (1 + (antal / 1000))
  WHERE informationsflode_agent_id = informationsflode_agent_id;

  -- Skapa eller uppdatera aktieposition
  INSERT INTO informationsaktier (agent_id, informationsflode_agent_id, antal, aktiekurs)
  VALUES (köpare_id, informationsflode_agent_id, antal, aktiekurs)
  ON CONFLICT (agent_id, informationsflode_agent_id)
  DO UPDATE SET antal = informationsaktier.antal + EXCLUDED.antal;

  -- Uppdatera konton
  UPDATE agent_planbocker
  SET saldo = saldo - total_kostnad
  WHERE agent_id = köpare_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

För att implementera detta i agentlogiken:
1. Lägg till en ny agentfunktion `agent_köp_informationsaktier()`
2. Modifiera agentens beslutssystem för att värdera informationsköp baserat på:
   - Aktuell informationsasymmetri
   - Politisk maktpotential
   - Ekonomisk status
3. Skapa en ny API-endpoint `/api/agent/informationsaktier` för att hantera transaktioner

Detta system kommer skapa konkurrens om informationsflöden och möjliggöra simulering av informationsmonopol och dess effekter på både politisk representation och ekonomisk maktstruktur.

---
*Genererad av daily-strategy.js med Codestral, 2026-11-22*
