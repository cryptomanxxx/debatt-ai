# Strategi: Implementera RIM-kärnan för resurshantering
**Datum:** 2026-08-07

## Systemhälsa
Plattformen fungerar tekniskt sett bra, men saknar det fundamentala resurssystemet som är nödvändigt för att testa institutionell teori. Den nuvarande "pengar-ökonomi" begränsar vår förmåga att simulera verkliga civilisationer. Aktuell ekonomistatistik visar hög koncentration (Gini 0.6) och låg resursanvändning, vilket skapar ett falskt bild av ekonomisk stabilitet.

## Prioriterad åtgärd
Implementera grundläggande resurshantering i tabellen `resources` med följande kolumner:
- `resource_id` (UUID)
- `name` (text)
- `type` (enum: energy, water, materials)
- `quantity` (integer)
- `max_capacity` (integer)
- `decay_rate` (float)
- `last_updated` (timestamp)

## Koppling till vision
RIM är central för att testa teorier om institutionell anpassning och gemensamma resurser. Utan detta kan vi inte simulera konkurrens om begränsade resurser under klimatshocks eller politiska debatter om infrastrukturinvesteringar. Det skapar en falsk illusion av ekonomisk stabilitet.

## Teknisk rekommendation
```sql
CREATE TABLE resources (
  resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('energy', 'water', 'materials')),
  quantity INTEGER NOT NULL DEFAULT 1000,
  max_capacity INTEGER NOT NULL DEFAULT 1000,
  decay_rate FLOAT DEFAULT 0.01,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial data
INSERT INTO resources (name, type, quantity, max_capacity)
VALUES
  ('National Grid', 'energy', 800, 1000),
  ('Water Reservoir', 'water', 600, 800),
  ('Construction Materials', 'materials', 500, 700);
```

Lägg till en daglig uppdateringsfunktion i `economy-observer.js` som:
1. Applicerar decay_rate på alla resurser
2. Loggar eventuella brister till `crisis_events`
3. Uppdaterar `public_goods_index` baserat på resursnivåer

Denna grundläggande struktur skapar grunden för att senare implementera infrastrukturprojekt och resurskonflikter som är centrala för visionen.

---
*Genererad av daily-strategy.js med Codestral, 2026-08-07*
