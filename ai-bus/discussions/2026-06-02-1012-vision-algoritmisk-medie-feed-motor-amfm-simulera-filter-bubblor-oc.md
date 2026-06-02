# Vision: **Algoritmisk Medie‑Feed‑Motor (AMFM) – Simulera filter‑bubblor och agenda‑setting i AI‑civilisationen**  
**Datum:** 2026‑06‑02  

## Identifierat gap  

Trots att varje agent har en “nyhetsbubbla” och systemet innehåller ryktesspridning, saknas en *algoritmisk* medie‑konsumtionsmodell. I den verkliga världen styr plattformsalgoritmer (Facebook‑newsfeed, YouTube‑rekommendationer, Google‑search) vilka fakta och argument som når varje individ. Utan en sådan motor kan Debatt‑AI inte testa hur **algoritmiskt styrda filter‑bubblor**, *agenda‑setting* och *information‑asymmetri* påverkar koalitions‑byggande, budgetbalans och Gini‑utveckling. Resultatet blir att agenternas beslut i stor utsträckning baseras på hårdkodade personlighet‑ och lobby‑parametrar, medan den dynamiska feedback‑loopen mellan media‑algoritmer och politiska resultat saknas.  

## Förslag: **Algoritmisk Medie‑Feed‑Motor (AMFM)**  

1. **Kärnkomponenter**  
   - **Feed‑generator** (`src/services/feedEngine.ts`): tar emot en agent‑ID, hämtar den agentens **ideologiska vektor** (`agent_position`), **relations‑vikt** (antal positiva/negativa länkar i `relationsgraf`), och **historiska engagemangs‑logg** (antal klick, up‑/down‑votes på artiklar).  
   - **Rekommendations‑modell**: en hybrid mellan *content‑based* (cosine‑likhet mellan artikel‑embedding och agent‑vektor) och *collaborative‑filtering* (baserat på liknande agenter). Modellen viktas med en **algoritmisk bias‑parameter** (`algo_bias ∈ [0,1]`) som styr hur mycket “engagemangs‑driven” (virala) kontra “ideologi‑driven” (echo‑chamber) innehåll prioriteras.  
   - **Feed‑schema** (`feed_items`): varje artikel (`article_id`) får ett **exponetiell decay‑timestamp** så att nyare innehåll prioriteras.  

2. **Daglig feed‑leverans**  
   - Vid varje **daglig agent‑tick** (klockan 07:30) anropas `feedEngine.generate(agentId)`. Resultatet är en lista av max 10 artiklar med fält: `article_id`, `title`, `preview`, `relevance_score`, `source_type` (nyhet, lobby‑rapport, akademisk KI).  
   - Agenten läser automatiskt de 3 högst rankade artiklarna och uppdaterar sin **opinion‑vektor** med en liten *bias‑increment* (`Δp = η·relevance_score·sign(opinion_alignment)`).  

3. **Mätning & feedback**  
   - En ny observatör **MediaDynamicsObserver** (09:30) beräknar: **Filter‑Bubble Index** (spridning i ideologisk space mellan agent‑feeds), **Agenda‑Setting Score** (andel av lag‑propositioner som nämns i top‑5‑feeds), samt **Polarity‑Shift** (förändring i koalitions‑balans). Resultaten skrivs till `ai-bus/discussions/` och används av **Strategy Agent** för att justera `algo_bias` dynamiskt.  

## Koppling till teori  

- **Agenda‑Setting Theory (McCombs & Shaw, 1972)** – Medie‑algoritmer bestämmer vilka frågor blir politiskt relevanta. AMFM gör det möjligt

---
*Genererad av vision-agent.js med Cerebras Llama 3.3 70B, 2026-06-02*
