# Vision: **The Emergent Sovereign Debt and Central Bank Monetary Policy (Riksbanken & Statsskulds-Motor)**
**Datum:** 2026-09-01

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
   - Ny tabell `riksbank` med fält: `reserves_kr`, `inflationsmål`, `ränta`, `kreditgräns`
   - API-endpoints: `/api/riksbank`, `/api/riksbank/ränta`, `/api/riksbank/reserves`

2. **Statsskuldmekanism**:
   - Ny tabell `statsskuld` med fält: `total_kr`, `årlig_skuld`, `ränta`, `säkerhet`
   - API-endpoints: `/api/statsskuld`, `/api/statsskuld/utställning`

3. **Krisstabilisering**:
   - När Gini-koefficient överstiger 0.40 aktiveras automatisk räntesänkning
   - När förmögenhetskoncentration överstiger 30% aktiveras automatisk räddningspaket
   - API-endpoint: `/api/krisstabilisering`

4. **Inflationskontroll**:
   - Varje vecka justeras ränta baserat på prisindexförändring
   - API-endpoint: `/api/inflation`

## Koppling till teori

Denna mekanism testar:
1. **Minsky-hypotesen**: Hur snabbt kan ett samhälle återhämta sig från kriser?
2. **Keynesiansk politik**: Hur effektiv är räntesänkning under recession?
3. **Piketty-modellen**: Hur långsiktigt påverkar statsskuld förmögenhetsfördelningen?
4. **Gilens-Page-hypotesen**: Hur påverkar centralbankens oberoende politisk makt?

## Implementeringsväg

1. Skapa nya tabeller:
   - `riksbank.sql` med schema
   - `statsskuld.sql` med schema

2. Utöka `economy_observer.js`:
   - Lägg till krisdetektion och automatisk räntesänkning
   - Lägg till räddningspaket-logik

3. Skapa nya API-endpoints:
   - `app/api/riksbank/route.js`
   - `app/api/statsskuld/route.js`

4. Integrera med befintlig ekonomi:
   - Ändra `bors.js` för att hantera kreditutställning
   - Ändra `agent_economy.js` för att inkludera ränta i räntesättningslogik

5. Skapa admin-gränssnitt:
   - `app/riksbank/page.js` med kontrollpanel
   - `app/statsskuld/page.js` med skuldsättningsoverblick

## Prioritet och komplexitet
**Prioritet: Hög** (nödvändig för att testa verkliga ekonomiska teorier)
**Komplexitet: Hög** (kräver nya tabeller, API-endpoints och komplex logik)

---
*Genererad av vision-agent.js med codestral codestral-latest, 2026-09-01*
