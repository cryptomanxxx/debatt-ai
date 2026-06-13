# Vision: **Public Goods & Infrastruktur‑Motor (PGIM)**  
**Datum:** 2026‑06‑09  

## Identifierat gap  
Debatt‑AI har ett komplett politiskt‑ och ekonomiskt ramverk: skatter, grundinkomst, lån, börs, koalitioner och en konstitutionell domstol. Vad som saknas är en **mekanism för kollektiva investeringar i offentliga varor** – t.ex. infrastruktur, utbildning, hälso‑ och sjukvård, eller klimatåtgärder. I den nuvarande simuleringen kan agenter bara samla rikedom, låna och handla; de kan inte samordna resurser för att skapa gemensamma tillgångar som ökar produktiviteten eller minskar ojämlikheten. Detta hindrar plattformen från att testa teorier om hur offentliga investeringar påverkar ekonomisk tillväxt, institutionell kvalitet och maktbalans i en civilisation.  

## Förslag: **Public Goods & Infrastruktur‑Motor (PGIM)**  
PGIM introducerar en ny typ av “policy‑objekt” – **offentliga projekt** – som kan föreslås, röstas fram i AI‑Parlamentet och finansieras genom skatt eller gemensamma lån. Varje projekt har:  

1. **Kostnad (kr)** – krävs från statens budget eller från ett sammanslaget “infrastruktur‑fond”.  
2. **Produktivitets‑effekt (β)** – multiplicerar alla agents produktions‑faktor (ex. `income = base_income * (1 + β * infra_index)`).  
3. **Fördelnings‑profil** – definierar hur nyttan fördelas geografiskt (via den befintliga `Markartan`‑modulen) och över socio‑ekonomiska klasser.  
4. **Livslängd & underhållskostnad** – efter `T` veckor genereras återkommande underhållskostnad.  

### Flöde  
1. **Initiativ** – vilken agent (oftast en “politiker”‑persona) skickar ett `POST /api/public-goods/proposal` med JSON‑payload `{title, description, cost, beta, distribution, duration}`.  
2. **Parlament‑process** – förslaget läggs in i `ai-parlamentet`‑queue. Alla agenter får en omröstnings‑prompt med sin *ideologiska kompass* och *förtroendegraf*‑vikt. Resultatet lagras i `public_goods_votes`.  
3. **Finansiering** – om röstad igenom dras kostnaden från den centrala skattepotten (`state_budget`) eller från ett `infrastructure_fund` som kan ha egna contributions‑regler.  
4. **Effekt‑uppdatering** – varje tick (`/api/tick`) räknar upp `infra_index` med `β` och justerar alla agents `wealth`, `production_rate` och `social_capital`. Detta sker via en ny funktion `applyInfrastructureEffects()` i `economyEngine.js`.  
5. **Underhåll** – varje vecka kontrolleras om projektets livslängd löpt ut; om så är f

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-09*
