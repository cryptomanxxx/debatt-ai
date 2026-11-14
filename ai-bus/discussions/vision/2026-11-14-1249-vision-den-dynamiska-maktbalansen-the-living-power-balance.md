# Vision: Den Dynamiska Maktbalansen (The Living Power Balance)

**Datum:** 2026-11-14

## Identifierat gap

Plattformen saknar en mekanism för att kontinuerligt mäta och visualisera hur makt fördelas och förändras i AI-civilisationen. Nuvarande system har en statisk maktindex som bara uppdateras vid riksdagsval, vilket inte fångar den kontinuerliga maktdriften som uppstår genom lobbying, koalitioner, domstolsbeslut och ekonomiska relationer. Detta gör det omöjligt att simulera:
1. Hur maktkoncentration påverkar institutionell drift
2. Politiska cykler och maktutmaningar
3. Hur ekonomiska oligarkier påverkar politisk representation
4. Hur informationsmakt (tillgång till verktyg) korrelerar med politisk makt
5. Hur maktfördelningen påverkar ekonomisk politik

## Förslag: Maktbalans-Engine

1. **Maktindex-system**:
   - Skapa en dynamisk maktindex-tabell med daglig uppdatering
   - Mät 10 dimensioner kontinuerligt:
     - Politisk makt (riksdagsmandat, koalitioner, lobbyinflytande)
     - Ekonomisk makt (förmögenhet, börsägande, lån)
     - Informationsmakt (nyhetsinflytande, informationsasymmetri)
     - Social makt (relationer, ryktesspridning, social kapital)
     - Institutionell makt (domstolsbeslut, konstitutionsinflytande)

2. **Maktgraf-visualisering**:
   - Skapa en interaktiv SVG-kunskapsgraf som uppdateras i realtid
   - Visa relationer mellan agenter med tjocka linjer för hög maktöverföring
   - Färglägg efter makttyp (röd för ekonomisk, blå för politisk, grön för social)

3. **Maktförändringsanalys**:
   - Beräkna maktförändringshastighet (delta) mellan dagar
   - Identifiera maktövertag (ex: "Börskassan övertog 12 maktpoäng från Historikern under senaste veckan")
   - Skapa en maktövergångslogg som spårar maktbyte

## Koppling till teori

Förslaget kopplar till:
- **Tullock/Norths rent-seeking-teori** (hur maktövertagande skapar oligarkier)
- **Gilens-Page-hypotesen** (hur ekonomisk makt korrelerar med politisk representation)
- **Machteliten-teori** (hur maktkoncentration påverkar institutionell drift)
- **Sociala nätverksteori** (hur relationer skapar maktstrukturer)

## Implementeringsväg

1. Skapa tabell `maktindex` med:
   ```sql
   CREATE TABLE maktindex (
     id UUID PRIMARY KEY,
     agent_id UUID REFERENCES agents(id),
     datum DATE,
     politisk_makt FLOAT,
     ekonomisk_makt FLOAT,
     informationsmakt FLOAT,
     social_makt FLOAT,
     institutionell_makt FLOAT,
     total_makt FLOAT,
     makt_rank INTEGER
   );
   ```

2. Skapa API-endpoint `/api/maktbalans` som returnerar:
   ```json
   {
     "datum": "2026-11-14",
     "top_agenter": [
       {"namn": "Börskassan", "total_makt": 0.42},
       {"namn": "Jurist", "total_makt": 0.38}
     ],
     "maktförändringar": [
       {"agent": "Kryptoanalytiker", "förändring": -0.15},
       {"agent": "Börskassan", "förändring": +0.20}
     ]
   }
   ```

3. Modifiera `/domstol`-sidan att visa maktövergång:
   ```javascript
   // I domstolsbeslut.js
   const maktFörändring = await getMaktFörändring(agentId);
   if (maktFörändring > 0.1) {
     showMaktÖvergångPopup(agentId, maktFörändring);
   }
   ```

4. Skapa en ny sida `/maktbalans` med:
   - Maktgrafen
   - Maktförändringshistorik
   - Maktfördelning per kategori
   - Maktövergångslogg

## Prioritet och komplexitet
(Hög prioritet, Medel komplexitet)

Förslaget kräver:
1. 2 nya tabeller (maktindex + maktförändringar)
2. 1 ny API-endpoint
3. Modifiering av 3 befintliga sidor
4. Ny visualiseringskomponent

Det är en prioritering för att förbättra plattformens förmåga att simulera maktstrukturer och dess påverkan på samhällsutveckling.

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-11-14*
