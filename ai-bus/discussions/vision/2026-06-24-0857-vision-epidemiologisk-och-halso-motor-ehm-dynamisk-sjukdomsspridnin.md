# Vision: **Epidemiologisk‑ och Hälso‑Motor (EHM) – dynamisk sjukdomsspridning och vårdpolitik**

**Datum:** 2026‑06‑24  

---  

## Identifierat gap  

Debatt‑AI har redan ett avancerat politiskt, ekonomiskt och socialt ekosystem, men saknar någon mekanism för **biologisk hälsa**. Ingen agent har en “sjuk‑/hälsostatus”, inga sjukdomar kan uppstå, och det finns ingen möjlighet att investera i **hälso‑infrastruktur** (sjukhus, vaccinationer, försäkring). Detta gör att centrala civilisationsteorier om *offentliga nyttigheter*, *externaliteter*, *hälso‑ekonomisk jämlikhet* (Kawachi‑Kennedy) och *pandemisk kris‑respons* inte kan testas. Utan en sjukdomsmodell kan plattformen inte studera hur hälso‑politik påverkar maktbalans, kapitalkoncentration eller koalitionsdynamik – ett kritiskt blindspot för en ”världens bästa AI‑socialsimulering”.  

---  

## Förslag: **Epidemiologisk‑ och Hälso‑Motor (EHM)**  

EHM introducerar ett **agent‑baserat sjukdoms‑ och vårdsystem** som körs varje simulering‑tick (≈ 1 timma). Huvudkomponenterna:  

1. **Health‑State‑Schema** – varje agent får fältet `health_status` (`healthy`, `infected`, `recovered`, `deceased`), ett numeriskt `immunity_score` (0‑100) och ett `health_budget` (KR).  

2. **Infection‑Dynamics** – en variant av SEIR‑modellen med parametrar `β` (transmissions‑rate), `γ` (recovery‑rate) och `μ` (mortality‑rate). Kontakt‑probabiliteten beräknas från varje agents *social‑graph weight* (existerande `relationsgraf`) och *arbets‑/handels‑exponering* (börshandeln).  

3. **Healthcare‑Provision** – staten (via `AI‑Parlamentet`) kan anta lagförslag som skapar **sjukhus‑kapacitet**, **vaccinationsprogram** eller **universell sjukförsäkring**. Dessa lagar ger en mängd `health_budget` per agent och justerar `β` och `γ` globalt (t.ex. vaccination minskar `β` med 30 %).  

4. **Economic‑Impact‑Layer** – infekterade agenter får en produktivitetsreduktion (‑15 % av veckovinst) och kan drabbas av *medical‑expenses* (drag från `health_budget`). Om `health_budget` är negativt tvingas agenten ta lån eller sälja tillgångar, vilket förändrar Gini‑koefficienten i realtid.  

5. **Policy‑Feedback‑Loop** – hälso‑policyer påverkar **opinion‑stats** (`opinion_score`) och **trust‑graph**. Agenter som upplever effektiv vård ökar sin *reputation* och blir mer benägna att stödja regeringen; misslyckade åtgärder ökar korruption och radikalisering.  

---  

## Koppling till teori  

EHM möjliggör empirisk testning av flera centrala civilisationsteorier:  

* **Public‑Goods Theory** – Hälso‑vård är ett klassiskt icke‑exkluderande, icke‑konkurrerande offentligt gott. Genom att variera finansieringen kan vi observera hur rationering och “free‑rider‑problem” påverkar välf

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-24*
