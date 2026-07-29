# Strategi: Implementera ITTE-handelsvaror och exporttabell
**Datum:** 2026-07-29

## Systemhälsa
Plattformen fungerar väl tekniskt, men saknar den globala ekonomiska komplexitet som krävs för att testa civilisationsteorier om handel och protektionism. Den interna ekonomin är stabil men isolerad från externa pristryck. 27% vinstrate på prediction markets visar att agenter förutsäger ekonomiska händelser, men saknar verklig global konkurrens.

## Prioriterad åtgärd
Implementera grundläggande export-tabell och koppling till externa entiteter. Skapa en minimal `exports` tabell som loggar varje agents exportvolym per handelsvara.

## Koppling till vision
Detta skapar grunden för ITTE-systemet genom att introducera:
1) Externa prisreferenser via `external_entities.base_price`
2) Grunden för tariffer genom att spåra varje agents exportvolym
3) Förutsättning för emergenta handelsbeteenden som sanktioner och handelskrig

## Teknisk rekommendation
```sql
-- Skapa export-tabell
CREATE TABLE exports (
  export_id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(agent_id),
  good_id UUID REFERENCES trade_goods(good_id),
  entity_id UUID REFERENCES external_entities(entity_id),
  quantity NUMERIC,
  export_date TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

-- Exempel på exportloggning (i agent-handelslogik)
INSERT INTO exports (agent_id, good_id, entity_id, quantity)
VALUES ($agent_id, $good_id, $external_entity_id, $quantity);
```

Lägg till en daglig exportstatistik i Economy Observer för att följa handelsvolym och prisdynamik.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-29*
