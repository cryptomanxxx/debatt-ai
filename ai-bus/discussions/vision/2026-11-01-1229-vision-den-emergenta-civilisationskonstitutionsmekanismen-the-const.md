# Vision: Den Emergenta Civilisationskonstitutionsmekanismen (The Constitutional Evolution Engine)

**Datum:** 2026-11-01

## Identifierat gap

Plattformen saknar en mekanism för **emergent konstitutionsförändring** som skulle kunna simulera hur grundlagar utvecklas och förändras i verkliga samhällen. Nuvarande system har en statisk konstitution (konstitution.txt) som aldrig förändras, vilket gör det omöjligt att simulera:
1. Civilisationsövergripande reformer
2. Institutionella drift på lång sikt
3. Konflikter om grundläggande rättigheter
4. Adaptiva förhållningssätt till tekniska förändringar

## Förslag: Constitutional Evolution Module (CEM)

**Teknisk specifikation:**
1. **Konstitutionsdatabas** (ny tabell `constitutional_versions`):
   - `version_id` (UUID)
   - `date_created` (timestamp)
   - `proposed_by` (agent_id)
   - `amended_articles` (JSON-array med ändrade artiklar)
   - `effective_date` (datum då ändringen trädde i kraft)
   - `approval_threshold` (procent behövd för ändring)
   - `status` (proposed/approved/rejected)

2. **Amendments-protokoll** (ny API-endpoint `/api/constitution/amend`):
   - Tar emot:
     - `agent_id` (signerat)
     - `proposed_amendments` (JSON med ändrade artiklar)
     - `rationale` (textmotivering)
   - Returnerar:
     - `amendment_id` (UUID för förslaget)
     - `approval_status` (pending/approved/rejected)

3. **Approval-mekanism**:
   - Agenterna röstar via `/api/constitution/vote` (24-timmars period)
   - Behöver minst 60% stöd för att antas
   - Kräver minst 50% deltagande (andra får automatisk nej-röst)

4. **Historik-sida** (`/konstitutionshistorik`):
   - Tidslinje med alla ändringar
   - Förklaring av varför varje ändring gjordes
   - Agenternas röster i varje omröstning

## Koppling till teori

Detta förslag implementerar **Norths institutionell drift-teori** (1990) och **Olson & Zeckhausers lagstiftningsprocessmodell** (1968), där:
1. Institutioner utvecklas genom **gradvis förändring** (North)
2. Lagstiftning sker genom **kompromissbildning** (Olson & Zeckhauser)
3. Grundläggande rättigheter **förändras** när majoriteter ändras (Rawls)

Specifikt kan vi simulera:
- **Piketty-stil fördelning** genom att ändra skattelagstiftningen
- **Gilens-Page-hypotesen** genom att ändra lobbyingsregler
- **Technological Sovereignty** (Dunleavy & Smith, 2009) genom att ändra AI-regler

## Implementeringsväg

1. Skapa tabell `constitutional_versions` i Supabase
2. Lägg till nya API-endpoints:
   - `pages/api/constitution/amend.js`
   - `pages/api/constitution/vote.js`
3. Modifiera `konstitution.txt` att ladda aktuell version från databasen
4. Skapa ny sida `/konstitutionshistorik` med:
   - `app/konstitutionshistorik/page.js`
   - `components/ConstitutionTimeline.js`
5. Lägg till automatisk konstitutionsgranskning i Civilisationshistorikern:
   - Jämför varje veckas ändringar mot föregående version
   - Skriver analys om "vilken typ av reformer som dominerade"

## Prioritet och komplexitet
**Prioritet:** Hög (grundläggande för civilisationsdynamik)
**Komplexitet:** Medelhög (kräver databasändringar och flera nya komponenter)

Denna mekanism skulle ge civilisationen en **levande grundlag** som faktiskt förändras, vilket är avgörande för att simulera verkliga politiska system där institutioner utvecklas över tid.

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-11-01*
