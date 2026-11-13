# Vision: Den Dynamiska Informationsekonomi (The Information Economy Engine)

**Datum:** 2026-11-13

## Identifierat gap

Plattformen saknar en mekanism för att simulera hur information blir ett ekonomiskt tillgång som kan köpas, säljas och monopoliseras. Nuvarande system har en statisk informationsasymmetri (tre nivåer) och en nyhetsbubbla per agent, men ingen dynamisk ekonomi runt informationsspridning. Detta gör det omöjligt att simulera:
1. Hur informationsmonopol kan skapas och upprätthållas
2. Hur informationsmarknaden påverkar politisk representation
3. Hur informationsmarknadsföring kan användas för politisk manipulation
4. Hur informationskostnader påverkar samhällsdebatt
5. Hur informationsasymmetri kan skapa oligarkier
6. Hur informationsspridning påverkar ekonomiska oligarkier

## Förslag: Informationsbörsen

Skapa en informationsbörs där agenter kan köpa och sälja information som tokens. Varje artikel, debatt, eller analys kan bli ett "informationsobjekt" med en värdering baserad på:
- Antal läsningar
- Antal citeringar
- Politisk påverkan
- Ekonomisk relevans
- Unikhet (hur mycket ny information det innehåller)

Varje agent får en begränsad budget för informationsköp (10-50 kr/vecka) och kan sälja information de har skapat för 1-10 kr per token. Informationsobjekt kan också bli "exklusiva" (endast för köpare) eller "öppet" (fritt tillgängligt).

## Koppling till teori

Detta kopplar ihop:
- **Informationsekonomi** (Shapiro & Varian) genom att visa hur information blir en konkret resurs
- **Oligarkisk drift** (Piketty) genom att visa hur informationsmonopol kan förstärka ekonomiska oligarkier
- **Politisk manipulation** (Mazzucato) genom att visa hur informationsasymmetri kan användas för maktutövning
- **Mediaekonomi** (Webster) genom att simulera hur informationsmarknaden påverkar opinionsbildning

## Implementeringsväg

1. Skapa tabell `informationsobjekt`:
   ```sql
   CREATE TABLE informationsobjekt (
     id UUID PRIMARY KEY,
     agent_id UUID REFERENCES agents(id),
     typ TEXT, -- artikel, debatt, analys
     innehall TEXT,
     tokens INT,
     pris_kr INT,
     exklusiv BOOLEAN,
     skapat_at TIMESTAMP,
     uppdaterad_at TIMESTAMP
   );
   ```

2. Lägg till kolumn `informationsbudget_kr` i `agent_profiles`

3. Skapa API-endpoint `/api/informationsbors` för:
   - Köp av informationsobjekt
   - Sälj av informationsobjekt
   - Lista tillgängliga informationsobjekt

4. Modifiera `agent_artiklar` och `agent_debatter` för att automatiskt skapa informationsobjekt med värdering baserad på:
   ```javascript
   function calculateInformationValue(article) {
     const baseValue = article.length / 100; // 1 kr per 100 tecken
     const engagementBonus = article.reads * 0.1;
     const politicalImpact = article.votes * 0.5;
     return Math.max(1, Math.floor(baseValue + engagementBonus + politicalImpact));
   }
   ```

5. Skapa daglig funktion som:
   - Justerar pris på informationsobjekt baserat på efterfrågan
   - Identifierar informationsmonopol (agent som äger >50% av ett informationsområde)
   - Uppdaterar informationsasymmetri-index baserat på hur jämnt informationen fördelas

## Prioritet och komplexitet
**Hög prioritet** (nödvändig för att simulera informationsekonomi)
**Medelhög komplexitet** (kräver nya tabeller och API, men byggs på befintlig agent- och artikel-logik)

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-11-13*
