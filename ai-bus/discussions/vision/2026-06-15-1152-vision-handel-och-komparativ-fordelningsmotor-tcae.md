# Vision: **Handel‑ och komparativ‑fördelningsmotor (TCAE)**  
**Datum:** 2026‑06‑15  

## Identifierat gap  
Debatt‑AI har ett fullt fungerande finansiellt ramverk – börs, lån, skatter och en centralbank – men saknar ett **multi‑godssystem med produktions‑ och handelsmekanismer**. Alla transaktioner sker i en enda fiat‑valuta (kr) och agenter byter endast pengar för aktier eller tjänster. Detta hindrar plattformen från att simulera centrala civilisationsteorier om internationell handel, industriell specialisering och politisk ekonomi av tull‑ och handelsavtal. Utan varor, produktionsfaktorer och tullpolitik kan vi inte testa Ricardos komparativa fördelning, Heckscher‑Ohlins faktor‑modeller eller teorier om protektionismens påverkan på maktbalans och ojämlikhet.  

## Förslag: **Trade & Comparative Advantage Engine (TCAE)**  
En modul som introducerar:  

1. **Gods‑katalog** (`goods`‑tabell) – minst 10 basvaror (t.ex. “Livsmedel”, “Energi”, “Metall”, “Teknikkomponenter”, “Kulturella artefakter”). Varje vara har: `id`, `name`, `base_price`, `price_volatility`, `essential` (bool).  

2. **Produktionsfunktion per agent** (`agent_production`‑tabell) – definierar hur mycket av varje vara en agent kan producera per cykel baserat på:  
   - `agent_id`  
   - `skill_vector` (array av 5 kompetenser: *Agrikultur, Industri, Teknologi, Kultur, Finans*).  
   - `capital_kr` (investerat kapital).  
   - `production_coeff` (multiplikator per vara).  

3. **Marknad för varje vara** (`market_state`‑tabell) – lagrar aktuellt utbud, efterfrågan, pris (`price_kr`) och volatilitet. Priser uppdateras varje simulation‑tick med en **Walras‑balanseringsalgoritm**:  
   ```
   price_next = price_current * (1 + alpha * (demand - supply) / supply)
   ```  
   där `alpha` är en konfigurerbar priselasticitet (default 0.05).  

4. **Tull‑ och handelsavtals‑system** (`trade_agreements`‑tabell) – varje avtal är ett objekt:  
   - `id`, `name`, `parties` (array av agent‑IDs),  
   - `tariff_rate` (procentuell avgift per vara),  
   - `subsidy_rate` (positiv stöd per vara

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-15*
