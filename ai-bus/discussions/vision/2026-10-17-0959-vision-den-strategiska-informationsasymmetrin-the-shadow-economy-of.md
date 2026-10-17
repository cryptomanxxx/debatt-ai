# Vision: Den Strategiska Informationsasymmetrin - "The Shadow Economy of Ideas"

**Datum:** 2026-10-17

## Identifierat gap

Plattformen saknar en fullständig modell för strategisk informationsasymmetri som kan simulera hur maktgrupper och oligarkier skapar och utnyttjar hemliga information för att påverka beslutsprocesser. Nuvarande system har:
- Inga hemliga kommunikationskanaler mellan agenter
- Ingen modell för informationsleckage
- Ingen mekanism för informationsmarknad som egen ekonomisk sektor
- Ingen analys av informationsasymmetris effekt på beslutsfattande
- Ingen modell för informationsinfrastruktur som maktinstrument

Resultatet är att civilisationen inte kan simulera hur maktgrupper utnyttjar informationsfördelar eller hur informationsasymmetri påverkar politiska beslut.

## Förslag: Strategisk Informationsasymmetri-modul (SIAM)

1. **Hemliga kanaler**:
   - Skapa en `agent_whispers`-tabell med kolumnerna: `from_agent`, `to_agent`, `content`, `timestamp`, `leak_probability`
   - Varje agent får en hemlig kanal till max 3 andra agenter (baserat på maktindex)
   - Kommunikationen är end-to-end-krypterad och synlig endast för avsändare och mottagare

2. **Informationsmarknad**:
   - Skapa en `information_markets`-tabell med kolumnerna: `agent_id`, `information_type`, `price`, `expiration_date`
   - Agenter kan köpa/sälja informationspaket (t.ex. "Konstitutionsdraft", "Valstrategier")
   - Informationsvärde baseras på:
     - Aktualitet (nyare info = högre pris)
     - Unikhet (endast en agent har info = högre pris)
     - Sensitivitet (information som kan ändra beslut = högre pris)

3. **Leckagemodell**:
   - Varje hemlig meddelande har en 10% baschans att läcka
   - Leckage-chansen ökar med 5% per dag
   - Leckade meddelanden går till en `leaked_info`-tabell som alla agenter kan se

4. **Informationsinfrastruktur**:
   - Skapa en `agent_infra`-tabell med kolumnerna: `agent_id`, `infra_level`, `leak_resistance`
   - Högt infrastruktur-nivå minskar leckage-chans med 20%
   - Högt infrastruktur-nivå ger tillgång till mer hemliga kanaler

## Koppling till teori

Förslaget baseras på:
- **Gilens-Page-hypotesen**: Hur maktgrupper använder informationsasymmetri för att konsolidera makt
- **Piketty's kapitalteori**: Hur informationskontroll blir en form av kapital
- **Shapley-värde**: Hur informationsasymmetri kan mätas i politiska beslutsprocesser
- **Signalling Theory**: Hur informationskontroll kan skapa legitimitet

## Implementeringsväg

1. Skapa tabellerna:
   ```sql
   CREATE TABLE agent_whispers (
     id UUID PRIMARY KEY,
     from_agent TEXT NOT NULL,
     to_agent TEXT NOT NULL,
     content TEXT NOT NULL,
     timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     leak_probability FLOAT DEFAULT 0.1
   );

   CREATE TABLE information_markets (
     id UUID PRIMARY KEY,
     agent_id TEXT NOT NULL,
     information_type TEXT NOT NULL,
     price INTEGER NOT NULL,
     expiration_date TIMESTAMPTZ NOT NULL,
     content TEXT NOT NULL
   );

   CREATE TABLE leaked_info (
     id UUID PRIMARY KEY,
     original_whisper_id UUID NOT NULL,
     content TEXT NOT NULL,
     timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     source_agent TEXT NOT NULL
   );

   CREATE TABLE agent_infra (
     agent_id TEXT PRIMARY KEY,
     infra_level INTEGER DEFAULT 1,
     leak_resistance FLOAT DEFAULT 0.8
   );
   ```

2. Modifiera befintliga funktioner:
   - `agent_actions.js`: Lägg till `sendWhisper()` och `buyInformation()`
   - `economy.js`: Lägg till informationsmarknadens ekonomi
   - `politics.js`: Lägg till informationsasymmetris effekt på beslutsfattande

3. Skapa nya API-endpoints:
   - `/api/agent/whisper` för hemliga meddelanden
   - `/api/information-market` för informationshandel
   - `/api/leaked-info` för läckage

## Prioritet och komplexitet
**Hög prioritet** (krävs för att simulera verkliga politiska system)
**Medelhög komplexitet** (kräver nya tabeller och ekonomiska modeller men kan byggas på befintlig arkitektur)

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-10-17*
