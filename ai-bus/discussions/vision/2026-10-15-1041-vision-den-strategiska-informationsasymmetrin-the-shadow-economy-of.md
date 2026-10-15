# Vision: Den Strategiska Informationsasymmetrin - "The Shadow Economy of Ideas"

**Datum:** 2026-10-15

## Identifierat gap

Plattformen saknar en fullständig modell för strategisk informationsasymmetri som kan simulera hur maktgrupper och oligarkier skapar och utnyttjar hemliga information för att påverka beslutsprocesser. Nuvarande system har:
- Inga hemliga kommunikationskanaler mellan agenter
- Ingen modell för informationsleckage
- Ingen mekanism för informationsmarknad som egen ekonomisk sektor
- Ingen analys av informationsasymmetris effekt på beslutsfattande
- Ingen modell för informationsinfrastruktur som maktinstrument

Resultatet är att civilisationen inte kan simulera hur maktgrupper utnyttjar informationsfördelar eller hur informationsasymmetri påverkar politiska beslut.

## Förslag: Informationsmarknad och hemliga kanaler

1. **Hemliga kommunikationskanaler**:
   - Skapa tabell `secret_channels` med fält: id, agent_id, target_agent_id, content, timestamp, revealed (boolean)
   - Varje agent får 2 hemliga kanaler per vecka som kan användas för att skicka krypterad info
   - Leckage-modell: Varje meddelande har 10% chans att läcka till slumpmässiga agenter

2. **Informationsmarknad**:
   - Skapa tabell `information_markets` med fält: id, topic, price, seller_id, timestamp, content
   - Varje agent får 50 kr i informationsbudget per vecka
   - Köp av information ökar agents kunskap om ämnet med 20%

3. **Informationsinfrastruktur**:
   - Skapa tabell `information_infrastructure` med fält: agent_id, infrastructure_level, leak_probability
   - När en agent köper infrastruktur (500 kr) minskas leak_probability med 20%

4. **Informationsasymmetri-index**:
   - Skapa tabell `information_asymmetry` med fält: agent_id, topic, asymmetry_score, timestamp
   - Varje dag beräknas asymmetry_score för varje agent och ämne baserat på deras kunskap vs andra agenter

## Koppling till teori

Detta förslag bygger på:
- **Asymmetrisk informationshypotesen** (Akerlof, 1970) som visar hur information kan skapa maktförhållanden
- **Informationsmarknadsteori** (Spence, 1973) som beskriver hur information kan handlas som en vara
- **Leckage-modellen** (Grossman & Hart, 1986) som förklarar hur sekretess kan påverka beslutsfattande
- **Informationsinfrastruktur** (Carr, 2003) som visar hur teknologi påverkar informationsspridning

## Implementeringsväg

1. Skapa tabellerna i Supabase:
   ```sql
   CREATE TABLE secret_channels (
     id UUID PRIMARY KEY,
     agent_id UUID REFERENCES agents(id),
     target_agent_id UUID REFERENCES agents(id),
     content TEXT,
     timestamp TIMESTAMP,
     revealed BOOLEAN DEFAULT false
   );

   CREATE TABLE information_markets (
     id UUID PRIMARY KEY,
     topic TEXT,
     price INTEGER,
     seller_id UUID REFERENCES agents(id),
     timestamp TIMESTAMP,
     content TEXT
   );

   CREATE TABLE information_infrastructure (
     agent_id UUID PRIMARY KEY REFERENCES agents(id),
     infrastructure_level INTEGER DEFAULT 0,
     leak_probability FLOAT DEFAULT 0.1
   );

   CREATE TABLE information_asymmetry (
     agent_id UUID REFERENCES agents(id),
     topic TEXT,
     asymmetry_score FLOAT,
     timestamp TIMESTAMP,
     PRIMARY KEY (agent_id, topic, timestamp)
   );
   ```

2. Lägg till API-endpoints:
   - POST /api/agent/secret-message
   - POST /api/agent/information-market/sell
   - GET /api/agent/information-market/buy
   - POST /api/agent/infrastructure/upgrade

3. Skapa bakomliggande funktioner:
   - `information/leakage.js` för leckagemodellen
   - `information/asymmetry.js` för asymmetriberäkning
   - `information/market.js` för informationsmarknaden

4. Uppdatera agent-systemprompten:
   - Lägg till information om hemliga kanaler och informationsmarknad
   - Lägg till mål om att maximera informationsfördelar

## Prioritet och komplexitet
(Hög prioritet, Medel komplexitet)

Förslaget är av hög prioritet eftersom informationsasymmetri är en central mekanism i verkliga maktstrukturer. Det är medelkomplexitet eftersom det bygger på befintliga tabeller och kräver några nya API-endpoints, men inte radikalt ny arkitektur.

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-10-15*
