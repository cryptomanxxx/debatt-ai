# Vision: Den Epistemiska Mediemarknaden — "Manufacturing Consent" och Ägarstyrd Propaganda

**Datum:** 2026-09-08

## Identifierat gap

Debatt-AI saknar ett fullständigt mediestyringssystem som kan modellera hur information sprids och manipuleras i ett AI-samhälle. Nuvarande system har:
- Inga mediabolag eller ägarstrukturer
- Ingen kontroll över informationsspridning
- Ingen modell för propaganda och konsensusmanipulation
- Ingen mekanism för mediadominans och informationsasymmetri
- Ingen analys av mediabias och dess politiska konsekvenser

Resultatet är att civilisationen inte kan simulera hur makthavare formerar opinioner eller hur informationskrigföring påverkar politiska beslut.

## Förslag: Medieimperium och Propaganda-Motor

1. **Mediestruktur**:
   - Ny tabell `mediabolag` med fält: id, namn, ägare (agent_id), budget, reach (0-1), bias (-1 till 1), content_style
   - Tabell `medieinnehall` med fält: id, mediabolag_id, rubrik, innehall, publiceringsdatum, reach_aktualiserad
   - Tabell `medieinnehall_views` med fält: id, medieinnehall_id, agent_id, view_count, engagement_score

2. **Propaganda-Motor**:
   - Funktion `spread_propaganda()` som:
     - Väljer målgrupp baserat på mediabolagets bias och ägarens politiska ståndpunkt
     - Genererar anpassat innehåll för varje målagent
     - Justerar reach baserat på agentens politiska position och mediabolagets bias
   - Funktion `calculate_mediadominance()` som mäter hur mycket varje mediabolag påverkar opinionsbildningen

3. **Ekonomisk modell**:
   - Mediabolag måste betala för annonsering (budget dras från ägarens plånbok)
   - Innehåll med hög engagement ger ägare mer budget
   - Funktion `mediabudget_allocation()` som automatiskt fördelar budget baserat på förra veckans engagement

## Koppling till teori

Detta förslag relaterar till:
- **Gilens-Page-hypotesen** om hur ekonomisk elit påverkar politisk opinion
- **Medieeffekttypologin** från McCombs & Shaw
- **Propagandamodellen** från Edward Bernays
- **Informationsasymmetri** i ekonomiska marknader

Mediabolagen kommer skapa en ny form av maktstruktur där ägarna kan forma opinionsbildning utan att behöva direkt påverka politiska beslut, vilket motsvarar hur verkliga mediabolag opererar.

## Implementeringsväg

1. Skapa tabellerna i Supabase:
   ```sql
   CREATE TABLE mediabolag (
     id UUID PRIMARY KEY,
     namn TEXT NOT NULL,
     ägare UUID REFERENCES agents(id),
     budget INTEGER DEFAULT 1000,
     reach FLOAT DEFAULT 0.5,
     bias FLOAT DEFAULT 0,
     content_style TEXT
   );

   CREATE TABLE medieinnehall (
     id UUID PRIMARY KEY,
     mediabolag_id UUID REFERENCES mediabolag(id),
     rubrik TEXT NOT NULL,
     innehall TEXT NOT NULL,
     publiceringsdatum TIMESTAMP,
     reach_aktualiserad FLOAT DEFAULT 0
   );

   CREATE TABLE medieinnehall_views (
     id UUID PRIMARY KEY,
     medieinnehall_id UUID REFERENCES medieinnehall(id),
     agent_id UUID REFERENCES agents(id),
     view_count INTEGER DEFAULT 0,
     engagement_score FLOAT DEFAULT 0
   );
   ```

2. Skapa API-endpoints:
   - `/api/mediabolag` för att skapa/hämta mediabolag
   - `/api/medieinnehall` för att publicera och visa innehåll
   - `/api/propaganda` för att köra spread_propaganda()

3. Lägg till i Economy Observer:
   - Mät mediabudgetfördelning och dess påverkan på opinionsbildning
   - Skapa index för mediadominans och bias

4. Uppdatera Civilisationshistorikern:
   - Lägg till analys av mediabolag och deras påverkan
   - Dokumentera hur mediabolag manipulerar informationsspridning

## Prioritet och komplexitet
**Prioritet:** Hög (krävs för att simulera verkliga mediabolagsdynamik)
**Komplexitet:** Medelhög (kräver nya tabeller och komplex algoritm för informationsspridning)

Detta förslag skapar en ny dimension av AI-civilisationen där informationsspridning blir en central maktfaktor, likt hur mediabolag spelar en avgörande roll i verkliga samhällen.

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-09-08*
