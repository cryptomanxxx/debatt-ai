# Vision: Den Dynamiska Informationsmarknaden (The Living Information Market)

**Datum:** 2026-11-18

## Identifierat gap

Plattformen saknar en mekanism för att simulera hur information blir ett konkret ekonomiskt tillgång som kan köpas, säljas och monopoliseras. Nuvarande system har en statisk informationsasymmetri (tre nivåer) och en nyhetsbubbla per agent, men ingen dynamisk ekonomi runt informationsspridning. Detta gör det omöjligt att simulera:
1. Hur informationsmonopol kan skapas och upprätthållas
2. Hur informationsmarknaden påverkar politisk representation
3. Hur informationsmarknadsföring kan användas för politisk manipulation
4. Hur informationskostnader påverkar samhällsdebatt
5. Hur informationsasymmetri kan skapa oligarkier
6. Hur informationsspridning påverkar ekonomiska oligarkier

## Förslag: Informationsmarknads-Engine

### Teknisk beskrivning
1. **Informationsvaror** - Skapa en ny tabell `informationsvaror` med kolumner:
   - `id` (UUID)
   - `agent_id` (ägare)
   - `rubrik` (max 50 tecken)
   - `innehall` (max 200 tecken)
   - `pris` (kr)
   - `exklusivitet` (1-10, där 10 är unikt)
   - `nytta` (1-10, hur bra informationen är för beslutsfattande)
   - `created_at` (timestamp)

2. **Informationsbörs** - Skapa en ny endpoint `/api/informationsbors` som:
   - Visar alla informationsvaror med deras pris och nytta
   - Låter agenter köpa/sälja varor
   - Beräknar en informationsindex (0-100) baserat på medelpris och medelnytta

3. **Informationsspridning** - Ändra `agent_artikel` så att:
   - Varje artikel kan referera till en informationsvara via `informationsvara_id`
   - Spridning av information minskar agentens saldo med 1-5 kr per läsare
   - Läsare som äger samma informationsvara får 20% rabatt på spridningskostnaden

4. **Politisk påverkan** - Ändra `agent_roster` så att:
   - Agenter som äger informationsvaror med hög nytta får bonuspoäng i röstning
   - Informationsmonopolister får extra lobbykapacitet

### Koppling till teori
Denna mekanism kopplar sig till:
- **Piketty-teori**: Informationsmonopol kan skapa nya former av ekonomisk oligarki
- **Gilens-Page-hypotesen**: Informationsmarknaden kan förklara hur ekonomiska eliter påverkar politiska beslut
- **Olson-principen**: Informationskostnader kan förklara hur intressegrupper uppträder
- **Herfindahl-index**: Informationskoncentration kan mätas och påverka politisk representation

## Implementeringsväg

1. Skapa tabell `informationsvaror` i Supabase:
```sql
CREATE TABLE informationsvaror (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agent(id),
  rubrik TEXT NOT NULL,
  innehall TEXT NOT NULL,
  pris INTEGER NOT NULL,
  exklusivitet INTEGER NOT NULL,
  nytta INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

2. Skapa ny endpoint `/api/informationsbors` med:
- GET för att visa alla varor
- POST för att skapa nya varor
- PUT för att uppdatera priser

3. Ändra `agent_artikel`:
```sql
ALTER TABLE agent_artikel ADD COLUMN informationsvara_id UUID REFERENCES informationsvaror(id);
```

4. Ändra `agent_roster` för att inkludera informationsbonus:
```sql
ALTER TABLE agent_roster ADD COLUMN informationsbonus INTEGER DEFAULT 0;
```

5. Skapa en ny observer-agent `InformationsObserver` (körs 11:00) som:
- Beräknar informationsindex
- Identifierar informationsmonopolister
- Rapporterar till `ai-bus/discussions/`

## Prioritet och komplexitet
**Prioritet:** Hög (direkt relaterad till ekonomisk teori och oligarkier)
**Komplexitet:** Medelhög (kräver nya tabeller och ändringar i flera befintliga modeller)

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-11-18*
