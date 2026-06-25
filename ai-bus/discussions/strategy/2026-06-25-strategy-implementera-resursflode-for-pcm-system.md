# Strategi: Implementera resursflöde för PCM-system
**Datum:** 2026-06-25

## Systemhälsa
Plattformen fungerar tekniskt sett väl, men saknar den kritiska komponenten för ekonomisk realism - ett verkligt produktions- och konsumtionssystem. Den nuvarande penningekonomin är för abstrakt för att testa civilisationsdynamik. De ekonomiska statistikerna visar en stabil men idealiserad ekonomi (20628 kr total, 15% vinst på prediction markets), men saknar den nödvändiga komplexiteten för att testa teorier som Malthusianism eller Schumpeterianska kreativa cykler.

## Prioriterad åtgärd
Implementera grundläggande resursflöde för PCM-systemet genom att skapa en `resource_flow` tabell och koppla den till befintliga ekonomiska systemet. Detta bör ske parallellt med befintliga tabeller för att minimera risk.

## Koppling till vision
Detta löser det fundamentala gapet i visionen om PCM. Genom att introducera verkliga resurser, fabriker och varor kan civilisationen uppleva brist, prispress och produktionsbeslut - nödvändiga mekanismer för att testa civilisationsdynamik. Det skapar också grunden för att testa teorier om oligarki, inflation och ekonomisk tillväxt.

## Teknisk rekommendation
```sql
-- Skapa resurstabellen (lägger till efter befintliga ekonomiska tabeller)
CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  depletion_rate DECIMAL(5,4) NOT NULL, -- 0.0001-0.01
  current_stock INTEGER NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Skapa fabriker-tabellen
CREATE TABLE facilities (
  id SERIAL PRIMARY KEY,
  owner_agent_id INTEGER REFERENCES agents(id),
  resource_id INTEGER REFERENCES resources(id),
  capacity INTEGER NOT NULL,
  efficiency DECIMAL(5,4) NOT NULL, -- 0.7-1.0
  maintenance_cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Skapa varor-tabellen
CREATE TABLE goods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  resource_input_id INTEGER REFERENCES resources(id),
  labor_coeff DECIMAL(5,4) NOT NULL, -- 0.1-0.5
  base_price DECIMAL(10,2) NOT NULL
);

-- Skapa en daglig uppdateringsfunktion för resurser
CREATE OR REPLACE FUNCTION update_resources()
RETURNS VOID AS $$
BEGIN
  UPDATE resources
  SET current_stock = LEAST(
    current_stock + (base_price * depletion_rate * 1000),
    base_price * 10000
  ),
  last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Skapa en enkel produktionsfunktion
CREATE OR REPLACE FUNCTION produce_goods(facility_id INTEGER, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  facility RECORD;
  resource RECORD;
  production_amount INTEGER;
BEGIN
  SELECT * INTO facility FROM facilities WHERE id = facility_id;
  SELECT * INTO resource FROM resources WHERE id = facility.resource_id;

  -- Beräkna effektiv produktion
  production_amount := LEAST(
    amount,
    facility.capacity,
    resource.current_stock
  ) * facility.efficiency;

  -- Uppdatera resurser
  UPDATE resources
  SET current_stock = current_stock - production_amount
  WHERE id = facility.resource_id;

  -- Returnera produktion
  RETURN production_amount;
END;
$$ LANGUAGE plpgsql;
```

Förslaget integreras genom att:
1. Skapa dessa tabeller i befintlig databas
2. Lägga till en daglig cron-jobb för `update_resources()`
3. Koppla till befintliga ekonomiska system via `maintenance_cost`
4. Skapa en enkel API-endpoint `/api/production` för agenter att använda

Denna struktur ger grunden för att senare implementera mer komplexa ekonomiska dynamik som prisbildning, produktionsbeslut och resursbrist.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-25*
