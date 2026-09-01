# Strategi: Implementera centralbankssystem med automatisk räntestyrning
**Datum:** 2026-09-01

## Systemhälsa
Plattformen visar stabila ekonomiska grundläggningar men saknar kritiska monetära mekanismer. Den starkaste koalitionen (Den lugna + Historiker) indikerar politisk stabilitet, men ekonomisk koncentration (Gini-koefficient ej mätt) och lågt prediction market-vinst (25%) tyder på bristande dynamik. Den nuvarande ekonomimodellen saknar inflationskontroll, vilket riskerar oligarkisk drift utan realistisk krisstabilisering.

## Prioriterad åtgärd
Implementera grundläggande centralbankfunktioner med automatisk räntestyrning och inflationsmålsystem. Fokusera på:
1. Skapa `riksbank`-tabellen med nödvändiga fält
2. Lägg till räntestyrningslogik baserat på prisindex
3. Implementera grundläggande krisstabiliseringsregler

## Koppling till vision
Detta löser det identifierade gapet om monetärt system genom att:
- Ge civilisationen en mekanism för inflationskontroll
- Tillåta automatisk räntestyrning vid ekonomisk kris
- Skapa grunden för senare utbyggnad av statsskuldssystem
- Möjliggör realistisk testning av ekonomisk teori om valutakriser

## Teknisk rekommendation
```sql
-- Skapa riksbank-tabellen
CREATE TABLE riksbank (
  id SERIAL PRIMARY KEY,
  reserves_kr INTEGER DEFAULT 1000000,
  inflationsmal DECIMAL(5,2) DEFAULT 2.0,
  ranta DECIMAL(5,2) DEFAULT 3.5,
  kreditgrans INTEGER DEFAULT 5000000,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lägg till räntestyrningsfunktion
CREATE OR REPLACE FUNCTION update_ranta()
RETURNS TRIGGER AS $$
DECLARE
  prisindex DECIMAL;
  prisindex_vecka_innan DECIMAL;
  prisindex_skillnad DECIMAL;
BEGIN
  -- Hämta senaste prisindex
  SELECT prisindex INTO prisindex FROM prisindex ORDER BY datum DESC LIMIT 1;

  -- Hämta prisindex från förra veckan
  SELECT prisindex INTO prisindex_vecka_innan
  FROM prisindex
  WHERE datum = (SELECT datum FROM prisindex ORDER BY datum DESC LIMIT 1 OFFSET 1);

  -- Beräkna skillnad
  prisindex_skillnad := (prisindex - prisindex_vecka_innan) / prisindex_vecka_innan * 100;

  -- Justera ränta baserat på inflationsmål
  IF prisindex_skillnad > NEW.inflationsmal THEN
    UPDATE riksbank SET ranta = ranta + 0.5 WHERE id = NEW.id;
  ELSIF prisindex_skillnad < NEW.inflationsmal THEN
    UPDATE riksbank SET ranta = ranta - 0.5 WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Skapa trigger för räntestyrning
CREATE TRIGGER ranta_styrning
AFTER INSERT OR UPDATE ON prisindex
FOR EACH ROW EXECUTE FUNCTION update_ranta();

-- Lägg till krisstabiliseringsfunktion
CREATE OR REPLACE FUNCTION kris_stabilisering()
RETURNS TRIGGER AS $$
DECLARE
  gini DECIMAL;
  formogenhetskoncentration DECIMAL;
BEGIN
  -- Beräkna Gini-koefficient
  SELECT AVG(gini) INTO gini FROM ekonomi_observer;

  -- Beräkna förmögenhetskoncentration
  SELECT AVG(formogenhetskoncentration) INTO formogenhetskoncentration FROM ekonomi_observer;

  -- Aktivera stabiliseringsåtgärder vid kris
  IF gini > 0.40 OR formogenhetskoncentration > 30 THEN
    -- Räntesänkning
    UPDATE riksbank SET ranta = ranta - 1.5;

    -- Räddningspaket till största agenten
    UPDATE agenter
    SET pengar = pengar + 5000
    WHERE id = (SELECT id FROM agenter ORDER BY pengar DESC LIMIT 1);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Skapa trigger för krisstabilisering
CREATE TRIGGER kris_stabilisering_trigger
AFTER INSERT OR UPDATE ON ekonomi_observer
FOR EACH ROW EXECUTE FUNCTION kris_stabilisering();
```

## Sammanfattning
Prioriterad åtgärd skapar grundläggande monetärt system som direkt stöder visionen om emergent statsfinans och krisstabilisering.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-01*
