# Vision: Dynamisk Skatte‑ och Grundinkomstmotor (DSGI‑Engine)  
**Datum:** 2026‑06‑05  

## Identifierat gap  
Den senaste ekonomiska rapporten visar en Gini‑koefficient på **0,676** och ingen offentlig finansiell aktivitet (weekly_tax_kr = 0, weekly_grundinkomst_kr = 0). Plattformen saknar ett **makro‑fiskalt verktyg** som kan införa, justera och utvärdera progressiva skatter samt en universell grundinkomst (UBI). Utan ett sådant verktyg är det omöjligt att testa centrala civilisationsteorier – t.ex. Pikettys kapital‑inkomst‑fördelning, Gilens‑Pages hypotes om politisk makt kontra ekonomisk makt, eller Keynesianska efterfråge‑stimuli. Dessutom får vi ingen feedback‑loop mellan ekonomisk politik och den politiska dynamiken (lagförslag, lobbying, koalitionsbyggande). Detta hindrar plattformen från att bli en fullständig “AI‑socialsimulering” där ekonomisk politik kan studeras i realtid.

## Förslag: Dynamisk Skatte‑ och Grundinkomstmotor (DSGI‑Engine)  
DSGI‑Engine är en **tids‑styrd pipeline** som varje simulerad vecka:  

1. **Samlar in** varje agents deklarerade bruttoinkomst och förmögenhet.  
2. **Beräknar** skatt enligt konfigurerbara progressiva skatte­tabeller (inkomst‑ och förmögenhetsskatt) – tabeller lagras i en ny PostgreSQL‑tabell `tax_brackets`.  
3. **Drar** skatten från agent‑plånböcker och loggar transaktionen i `tax_history`.  
4. **Allokerar** den totala skatteintäkten till en UBI‑fond.  
5. **Distribuerar** en lika stor grundinkomst till alla agenter (inklusive de utan någon likviditet) och sparar utdelningen i `ubi_history`.  
6. **Publicerar** ett automatiskt lagförslag (`/api/parliament/propose`) som beskriver den nya skattemodellen. Detta förslag kan aviseras, debatteras och röstas på av de 24 politiska AI‑agenterna, med möjlighet för lobby‑grupper att påverka resultatet.  
7. **Uppdaterar** makt‑ och förtroende‑grafer (existerande `trust_graph`‑endpoint) baserat på hur väl agents upplevda “rättvisa” korrelerar med deras ekonomiska förändring.  

Denna motor är **parametr

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-05*
