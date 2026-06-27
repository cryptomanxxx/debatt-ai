# Strategi: Implementera EcoDynamics Engine-kärnan
**Datum:** 2026-06-27

## Systemhälsa
Plattformen visar stabil hälsa med aktiv debatt (500 röster senaste veckan) och funktionella ekonomiska mekanismer, men saknar den kritiska miljödimensionen som skulle testa teorier som Tragedy of the Commons. Den starkaste koalitionen (Den stressade+Historiker) visar att agenter kan bilda strategiska allianser, men saknar konkurrens om begränsade resurser. Lobbyingframgången (30%) tyder på att politisk makt fungerar, men saknar den miljökritiska dimensionen som skulle skapa mer komplexa maktstrukturer.

## Prioriterad åtgärd
Implementera EcoDynamics Engine-kärnan genom att skapa tabellen `resources` och koppla den till befintliga ekonomiska system. Fokusera först på två grundläggande resurser: kol och el.

## Koppling till vision
Detta steg direkt implementerar EcoDynamics Engine-visionen genom att introducera begränsade resurser och utsläppsmekanismer. Det skapar grunden för att testa teorier om externaliteter, resurskonflikter och klimatpolicy, som är centrala för kärnuppdraget att testa ekonomisk civilisationsteori.

## Teknisk rekommendation
```sql
-- Skapa resurstabellen
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    total_stock INTEGER NOT NULL,
    extraction_rate FLOAT NOT NULL,
    price_per_unit FLOAT NOT NULL,
    renewable BOOLEAN NOT NULL,
    depletion_curve VARCHAR(20) NOT NULL CHECK (depletion_curve IN ('linear', 'exponential')),
    emission_factor FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lägg till utsläppsfält till agents-tabellen
ALTER TABLE agents ADD COLUMN co2_emission_kg FLOAT DEFAULT 0;

-- Skapa användningsrelation
CREATE TABLE agent_resource_use (
    agent_id INTEGER REFERENCES agents(id),
    resource_id INTEGER REFERENCES resources(id),
    units_used_this_tick INTEGER NOT NULL,
    tick_id INTEGER NOT NULL,
    PRIMARY KEY (agent_id, resource_id, tick_id)
);

-- Initialisera grundläggande resurser
INSERT INTO resources (name, total_stock, extraction_rate, price_per_unit, renewable, depletion_curve, emission_factor)
VALUES
    ('Kol', 1000000, 10000, 5.0, FALSE, 'exponential', 0.8),
    ('El', 500000, 5000, 10.0, FALSE, 'linear', 0.2);
```

Följande ändringar krävs i `economy-engine.js`:
```javascript
// Lägg till utsläppsberäkning i tick-funktionen
function calculateEmissions(agentId, resourceId, unitsUsed) {
    const resource = db.query('SELECT emission_factor FROM resources WHERE id = $1', [resourceId]);
    const emissions = unitsUsed * resource.emission_factor;
    db.query('UPDATE agents SET co2_emission_kg = co2_emission_kg + $1 WHERE id = $2', [emissions, agentId]);
    db.query('INSERT INTO agent_resource_use (agent_id, resource_id, units_used_this_tick, tick_id) VALUES ($1, $2, $3, $4)',
        [agentId, resourceId, unitsUsed, currentTick]);
}
```

Denna implementering skapar grunden för att testa teorier om resurskonflikter och klimatpolicy, vilket är centralt för plattformens kärnuppdrag.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-27*
