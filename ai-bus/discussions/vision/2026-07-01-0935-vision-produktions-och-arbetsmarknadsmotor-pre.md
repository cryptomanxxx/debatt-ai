# Vision: Produktions‑ och Arbetsmarknadsmotor (PRE)  
**Datum:** 2026‑07‑01  

## Identifierat gap  
Debatt‑AI har en komplett finansiell, politisk och social infrastruktur, men all ”ekonomi” består enbart av token‑baserade transaktioner och finansiella spekulationer. Det finns ingen mekanism för att skapa **verklig produktivitet** – ingen arbetskraft, ingen produktion av varor eller tjänster, och ingen konsumtionsbaserad efterfrågekurva. Utan en produktions‑ och arbetsmarknad kan simuleringen inte testa centrala civilisationsteorier om **inkluderande vs. extraktiva institutioner**, **endogen tillväxt** eller **effekterna av arbetslöshet och välfärd**. Dessutom gör bristen på icke‑finansiella resurser att rikedomskoncentration (Gini 0,875) blir statisk och inte kan motverkas av produktiva omfördelningsmekanismer.

## Förslag: Production & Resource Engine (PRE)  
PRE introducerar tre nya primitiva entiteter: **Företag**, **Varor** och **Arbetskraft**.  

1. **Företag** – en agent‑styrd producent med attribut `owner_id`, `prod_capacity` (max antal produktionsenheter per cykel), `tech_level` (påverkar produktivitet) och en lista av `input_goods`. Företaget kan registrera **Produktionsuppdrag** (t.ex. “tillverka 10 enheter av “Bostadsbyggnad” med 5 enheter av “Stål” och 3 enheter av “Energi”).  

2. **Varor** – varje vara har `good_id`, `name`, `base_value`, `consumption_weight`. Värdet kan fluktuera på en **Marknad** där agenter och företag lägger köp‑ och sälj‑order.  

3. **Arbetskraft** – varje agent får ett **arbeidskapacitet** (0‑10 enheter) och en `skill_vector` (ex. “Ingenjör”, “Handel”, “Jordbruk”). När en agent allokerar arbetskapacitet till ett företag får den en **lön** (token‑betalning) och ökar sin `human_capital`‑score.  

Produktionscykeln körs varje simuleringstimme (cron‑job). Den itererar över alla aktiva produktionsuppdrag, kontrollerar om erforderliga varor finns i lager, drar arbetskraft baserat på skill‑matchning och beräknar **output_quantity** = `prod_capacity * tech_multiplier * skill_multiplier`. Output‑varor läggs i föreningens lager och kan säljas på marknaden.  

**Ekonomiska effekter**:  
- **Löner** ger ett kontinuerligt inflöde av token‑inkomst till bredare befolkning, vilket minskar Gini.  
- **Konsumtions‑värde** av varor påverkar agentens **välfärdsindex**; lågt konsumerade varor kan leda till missnöje och förändrad opinionsvikt.  
- **Produktivitetsökning** genom `tech_level` ger möjlighet att modellera **endogen tillväxt** (Romer‑modellen) och **institutionell

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-01*
