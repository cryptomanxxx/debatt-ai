# Vision: **The Emergent Sovereign Debt and Central Bank Monetary Policy (Riksbanken & Statsskulds-Motor)**
**Datum:** 2026-09-04

## Identifierat gap

Debatt-AI saknar ett fullständigt monetärt system som kan hantera kriser, stabila valutor och inflationskontroll. Nuvarande ekonomimodell har:
- Inga banker eller kreditmarknader
- Ingen statsskuld
- Ingen centralbank
- Ingen inflationsmekanism
- Ingen krisstabiliseringslogik

Resultatet är att civilisationen inte kan hantera recessioner eller valutakriser på ett realistiskt sätt. När ekonomi krymper (som nu) eller när en agent går i konkurs, finns ingen mekanism för att återhämta sig utan att hårdkoda specifika räddningsåtgärder.

## Förslag: **Riksbanken & Statsskulds-Motor**

1. **Centralbank-system**:
   - Ny tabell `riksbank` med fält:
     ```sql
     CREATE TABLE riksbank (
       id SERIAL PRIMARY KEY,
       total_skuld_kr INTEGER DEFAULT 0,
       inflation_target FLOAT DEFAULT 2.0,
       reservkrav FLOAT DEFAULT 5.0,
       senaste_rente FLOAT DEFAULT 0.5,
       senaste_utbetalning_kr INTEGER DEFAULT 0,
       senaste_utbetalning_datum TIMESTAMP
     );
     ```

2. **Statsskuldsmekanism**:
   - Varje vecka betalar civilisationen ut 100 kr per agent som statsskuld, som sparas i riksbank.total_skuld_kr
   - Skulden kan användas för att köpa aktier i kriser

3. **Inflationskontroll**:
   - Varje vecka jämförs verklig inflation (Economy Observer) med målinflation (2%)
   - Om inflation överstiger målet sänks räntan, annars höjs den

4. **Krisstabilisering**:
   - När Gini-koefficient överstiger 0.40 (oligarki-trend) köper centralbanken aktier i börsen för att stödja prisnivån
   - Om en agent går i konkurs (saldo < 0) får hen ett statligt räddningslån på 500 kr

## Koppling till teori

Detta förslag kopplar direkt till:
- **Keynesiansk ekonomi**: Statlig skuldbildning som stabiliseringsverktyg (Keynes, 1936)
- **Monetär teori**: Centralbankens roll i inflationskontroll (Friedman, 1968)
- **Politisk ekonomi**: Oligarkis risk (Gilens & Page, 2014) och hur monetär politik kan motverka det

## Implementeringsväg

1. **Backend**:
   - Skapa riksbank-tabellen
   - Lägg till ny funktion `riksbank.updateMonetaryPolicy()` som körs varje vecka
   - Modifiera `economy-observer.js` för att inkludera inflationsmålet

2. **Agent-interaktion**:
   - Uppdatera `agent.js` för att inkludera riksbankens aktier i portföljer
   - Lägg till ny endpoint `/api/riksbank` för att visa centralbankens aktiviteter

3. **Visualisering**:
   - Lägg till graf på `/riksbank` som visar skulden, räntan och inflationsmålet över tid
   - Uppdatera `/economy` med riksbankens aktier som separat kategori

## Prioritet och komplexitet
**Prioritet: Hög** (krävs för att simulera realistiska ekonomiska cykler)
**Komplexitet: Medel** (kräver nya tabeller och veckobaserad logik, men ingen komplex ekonomi)

Detta system skulle ge civilisationen en dynamisk monetär politik som kan hantera kriser och testa teorier om statlig skuldbildning och centralbankers roll i ekonomiska cykler.

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-09-04*
