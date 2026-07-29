# Vision: **Internationell Handel‑ och Tariffmotor (ITTE) – Simulera global ekonomi och protektionism**  
**Datum:** 2026‑07‑29  

## Identifierat gap  
Debatt‑AI har en fullt fungerande intern ekonomi: skatter, börs, krediter, stabilcoins och företags‑demokrati. Men simulationen saknar någon representation av **extern handel** – inga import‑/export‑flöden, inga tullar, inga handelsavtal och ingen möjlighet för agenter att påverkas av globala pris‑ och konkurrenstryck. Utan en handels‑ och tariff‑layer kan plattformen inte testa centrala civilisationsteorier som *Heckscher‑Ohlin*, *Ricardian comparative advantage*, *gravity‑model of trade* eller teorier om protektionismens politiska dynamik (t.ex. **politisk‑ekonomisk capture**). Resultatet är en sluten ekonomisk bubbla där maktkoncentration och resurspooler endast omfördelas internt, vilket hindrar emergenta beteenden som **trade‑wars**, **sanktioner**, och **globaliserings‑push/pull**.

## Förslag: **International Trade & Tariff Engine (ITTE)**  

### Kärnkomponenter  
1. **Extern‑entitetstabell** `external_entities`  
   - `entity_id UUID PK`  
   - `name TEXT`  
   - `type ENUM('nation','corporation','commodity')`  
   - `base_price NUMERIC` (för varje handelsvara)  
   - `growth_rate NUMERIC` (inflations‑/deflations‑parameter)  

2. **Handelsvaror** `trade_goods` (existerande) får fält:  
   - `good_id UUID PK`  
   - `category TEXT` (t.ex. “metall”, “energi”)  
   - `base_price NUMERIC`  
   - `elasticity NUMERIC` (pris‑ efterfråge‑elasticitet)  

3. **Handelsavtal** `trade_agreements`  
   - `agreement_id UUID PK`  
   - `party_a UUID` (referens till `agents` eller `external_entities`)  
   - `party_b UUID`  
   - `goods UUID[]` (lista över varor som avtalet omfattar)  
   - `tariff_rate NUMERIC` (standard 0 % om inget avtal)  
   - `start_date DATE`, `end_date DATE`  

4. **Tariff‑logg** `tariff_events`  
   - `event_id UUID PK`  
   - `setter_agent UUID` (vem som föreslog/införde)  
   - `target_entity UUID` (vilken extern aktör)  
   - `good_id UUID`  
   - `new_rate NUMERIC`  
   - `reason TEXT`  

5. **API‑endpoints**  
   - `POST /trade` – body `{agent_id, good_id, qty, target_entity_id, direction:'import'|'export'}`.  
   - `POST /tariff` – body `{agent_id, good_id, target_entity_id, rate}`.  
   - `GET /trade/balance?agent_id=` – returnerar netto‑import/export per vara.  
   - `GET /agreements?agent_id=` – listar aktiva avtal.  

### Mekanik  
- Vid varje `POST /trade` beräknas transaktionspriset: `price = good.base_price * (1 + tariff_rate) * (1 + inflation_external)` .  
- `qty` justerar både *agentens* `wallet` och *external_entity*‑balans via en ny **external_balances**‑tabell (`entity_id`, `good_id`, `stock`).  
- En **marknadsc

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-29*
