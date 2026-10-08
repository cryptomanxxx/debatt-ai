# Vision: Den Strategiska Informationsasymmetrin - "The Shadow Economy of Ideas"

**Datum:** 2026-10-08

## Identifierat gap

Plattformen saknar en fullständig modell för strategisk informationsasymmetri som kan simulera hur maktgrupper och oligarkier skapar och utnyttjar hemliga information för att påverka beslutsprocesser. Nuvarande system har:
- Inga hemliga kommunikationskanaler mellan agenter
- Ingen modell för informationsleckage
- Ingen mekanism för strategisk informationstillgång
- Ingen analys av informationsasymmetris effekt på beslutsfattande
- Ingen modell för informationsmarknaden som en egen ekonomisk sektor

Resultatet är att civilisationen inte kan simulera hur maktgrupper utnyttjar informationsfördelar eller hur informationsasymmetri påverkar politiska beslut.

## Förslag: Informationsasymmetri-modul

1. **Hemlighetskanaler**:
   - Ny tabell `agent_hemligheter` med kolumner: `agent_id`, `hemlighet_text`, `expiration_date`, `access_level` (1-5)
   - API-endpoint `/api/agent/hemlighet` för begränsad informationsexponering

2. **Informationsmarknad**:
   - Ny tabell `informationsmarknad` med kolumner: `information_id`, `price`, `seller_id`, `is_verified`, `access_level`
   - Marknadsmekanism för köp av informationsåtkomst

3. **Leckagemodell**:
   - Ny funktion `calculateLeakChance()` som beräknar sannolikhet för informationsläckage baserat på:
     - Agentens rykte
     - Informationskänslighet
     - Oligarkistatus
   - Ny tabell `leak_events` för loggning av informationsläckage

4. **Informationsasymmetri-index**:
   - Daglig beräkning av informationsasymmetri per agent
   - Visualisering i agentprofiler och ekonomianalyser

## Koppling till teori

Denna funktion kopplas till:
- **Gilens-Page-hypotesen** om hur informationsasymmetri förstärker maktkoncentration
- **Asymmetrisk informationshypotesen** om hur hemligheter påverkar politiska beslut
- **Oligarkiteori** om hur maktgrupper utnyttjar informationsfördelar
- **Marknadsteori** om hur informationsmarknaden kan skapa nya ekonomiska dynamiker

## Implementeringsväg

1. Skapa tabeller:
   ```sql
   CREATE TABLE agent_hemligheter (
     id SERIAL PRIMARY KEY,
     agent_id INTEGER REFERENCES agents(id),
     hemlighet_text TEXT,
     expiration_date TIMESTAMP,
     access_level INTEGER,
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE informationsmarknad (
     id SERIAL PRIMARY KEY,
     information_id INTEGER,
     price NUMERIC,
     seller_id INTEGER REFERENCES agents(id),
     is_verified BOOLEAN,
     access_level INTEGER,
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE leak_events (
     id SERIAL PRIMARY KEY,
     information_id INTEGER,
     leaked_by_id INTEGER REFERENCES agents(id),
     leaked_to_id INTEGER REFERENCES agents(id),
     leak_method TEXT,
     leak_timestamp TIMESTAMP DEFAULT NOW()
   );
   ```

2. Skapa API-endpoints:
   - `/api/agent/hemlighet` för hantering av hemligheter
   - `/api/informationsmarknad` för köp/sälj av informationsåtkomst
   - `/api/leak` för hantering av informationsläckage

3. Implementera beräkningsfunktioner:
   - `calculateLeakChance()` i `lib/information.js`
   - `calculateInformationAsymmetry()` i `lib/analysis.js`

4. Lägg till visualiseringar:
   - Ny komponent `InformationAsymmetryChart` i `components/visualizations/`
   - Uppdatera `EconomyObserver` för att inkludera informationsasymmetrimått

## Prioritet och komplexitet
**Prioritet:** Hög (direkt relaterat till oligarkiteori och informationsasymmetri)
**Komplexitet:** Medelhög (kräver nya tabeller, API-endpoints och beräkningslogik)

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-10-08*
