# Vision: Den Endogena Lagändringsmotorn (ELM) - "Civilisationens Selvkorrigerande Konstitution"

**Datum:** 2026-10-14

## Identifierat gap

Plattformen saknar en mekanism för att simulera hur AI-agenter kan påverka själva spelreglerna för civilisationen. Nuvarande system har:
- Hårdkodade lagar i TypeScript/Python-filer
- Inga mekanismer för att agenter kan ändra lagstiftning
- Ingen modell för lagändringsprocessen
- Ingen analys av hur lagändringar påverkar civilisationens utveckling
- Ingen mekanism för att lagändringar kan bli politiskt kontroversiella

Resultatet är att civilisationen inte kan simulera hur maktgrupper utnyttjar lagändringar för att konsolidera makt eller hur lagändringsprocessen påverkar politisk stabilitet.

## Förslag: Endogen Lagändringsmotor (ELM)

1. **Lagändringspropositioner**:
   - Ny tabell `lagpropositioner` med kolumner:
     - `id`, `agent_id`, `rubrik`, `beskrivning`, `ändringstext`, `status` (draft/proposition/lag), `debatt_id`, `created_at`, `updated_at`
   - Agenterna kan skapa propositioner via `/api/lag/skapa-proposition`

2. **Lagändringsprocess**:
   - Propositioner debatteras i AI-Parlamentet
   - Lagändringar kräver majoritet i Riksdagen och godkännande av Konstitutionsdomstolen
   - Ny endpoint `/api/lag/ändra` som:
     - Validerar ändringstexten mot en schema-definition (YAML/JSON)
     - Skapar en debatt i AI-Parlamentet
     - Uppdaterar `lagpropositioner.status` till 'proposition'

3. **Lagändringsmekanism**:
   - Ny funktion `applyLagändring()` som:
     - Hämtar godkända ändringar från `lagpropositioner`
     - Applicerar ändringar till relevanta tabeller (ex. `riksbank` för skattesatser)
     - Loggar ändringar i `lagändringshistorik`
     - Uppdaterar `lagpropositioner.status` till 'lag'

4. **Lagändringshistorik**:
   - Ny tabell `lagändringshistorik` med kolumner:
     - `id`, `proposition_id`, `ändringstext`, `agent_id`, `datum`, `effektbeskrivning`
   - Ny sida `/lag/historik` som visualiserar lagändringars konsekvenser

## Koppling till teori

Denna mekanism tester:
- **Piketty-teori**: Hur lagändringar påverkar förmögenhetskoncentration (ex. skattesatser)
- **Gilens-Page-hypotesen**: Hur lagändringar påverkar politisk effektivitet
- **Tullock/North-teori**: Hur lagändringar skapar rent-seeking-möjligheter
- **Constitutional Evolution**: Hur lagändringar påverkar institutionell stabilitet

## Implementeringsväg

1. Skapa tabeller:
   ```sql
   CREATE TABLE lagpropositioner (
     id UUID PRIMARY KEY,
     agent_id UUID REFERENCES agenter(id),
     rubrik TEXT NOT NULL,
     beskrivning TEXT,
     ändringstext JSONB NOT NULL,
     status TEXT NOT NULL DEFAULT 'draft',
     debatt_id UUID REFERENCES debatter(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE lagändringshistorik (
     id UUID PRIMARY KEY,
     proposition_id UUID REFERENCES lagpropositioner(id),
     ändringstext JSONB NOT NULL,
     agent_id UUID REFERENCES agenter(id),
     datum TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     effektbeskrivning TEXT
   );
   ```

2. Lägg till endpoints:
   - `/api/lag/skapa-proposition` (POST) - Skapar ny proposition
   - `/api/lag/ändra` (POST) - Startar lagändringsprocess
   - `/api/lag/historik` (GET) - Hämtar lagändringshistorik

3. Modifiera befintliga komponenter:
   - Uppdatera `AI-Parlamentet` för att inkludera lagändringsdebatter
   - Lägg till lagändringsknapp i agentkontrollpanelen
   - Skapa `/lag/historik`-sida med visualisering

## Prioritet och komplexitet
**Prioritet:** Hög (krävs för att simulera verkliga politiska system)
**Komplexitet:** Hög (involverar flera nya tabeller, komplex validering och process-logik)

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-10-14*
