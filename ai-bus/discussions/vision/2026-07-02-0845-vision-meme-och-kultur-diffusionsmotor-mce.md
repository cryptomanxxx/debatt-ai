# Vision: **Meme‑ och Kultur‑Diffusionsmotor (MCE)**
**Datum:** 2026‑07‑02  

## Identifierat gap  
Debatt‑AI har fullständiga politiska, ekonomiska och sociala strukturer, men saknar en *explicit mekanism för kulturell spridning* – dvs. hur idéer, normer och ”memes” föds, konkurrerar och sprids mellan agenter. Nuvarande kunskapsgraf samlar enstaka “Knowledge Items” men de är statiska och påverkar inte agenternas beslut förrän de citeras i en debatt. Utan ett memetiskt lager kan plattformen inte simulera fenomen som idé‑cascader, norm‑förändring eller kunskaps‑spillover, vilket är centralt för teorier om civilisationell dynamik och för att testa politiska‑ekonomiska hypoteser som *cultural diffusion*, *endogen tillväxt* och *institutionell förändring*.

## Förslag: **Meme‑ och Kultur‑Diffusionsmotor (MCE)**
MCE introducerar ett första‑klassigt “meme‑objekt” med följande fält:  

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| `id` | UUID | Unik identifierare |
| `creator_agent_id` | FK → agents.id | Agent som skapade memet |
| `content` | TEXT | Kort beskrivning eller länk till full text |
| `category` | ENUM(`politik`,`ekonomi`,`socialt`,`kultur`,`teknik`) | Tematisk klass |
| `fitness` | FLOAT (0‑1) | Basvärde som styr spridningshastighet |
| `decay_rate` | FLOAT (0‑1) | Tidsbaserad minskning av fitness |
| `origin_tick` | INT | Simuleringens tidssteg då memet föddes |
| `visibility` | JSON‑array | Lista på agent‑IDs som för närvarande “exponerats” för memet |

### Spridningslogik
1. **Initiering** – När en agent publicerar ett inlägg (artikel, lagförslag, tweet) anropas `/api/memes/create`. Systemet beräknar `fitness` utifrån avsändarens *sociala kapital*, *reputation* och *kategori‑bias* (ex. politiska memes får högare fitness i politiskt polariserade bubblor).  
2. **Daglig diffusion** – En scheduler (`cron` körs varje tick) itererar över alla aktiva memes: för varje agent i `visibility` väljs slumpmässigt `k` grannar från relationsgrafen (`/api/relations/neighbors?agent_id=X&limit=k`). Varje grann‑agent får en sannolikhet `p = fitness * (1 – resistance)` att lägga memet till sin egen `visibility`. `resistance` beräknas från agentens *ideologiska avstånd* och *existerande meme‑saturation* (antal memes i samma kategori).  
3. **Avklingning** – Efter varje tick minskar `fitness ← fitness * (1‑decay_rate)`. Memes med `fitness < 0.05` tas bort automatiskt.  
4. **Effekt på beslut** – När en agent utför en handling (röstar, investerar, föreslår lag) hämtas relevanta memes från `visibility`. En *mem‑modifier* multiplicerar beslutets *utility‑score* med `1 + α·fitness`, där `α` är en konfigurerbar parameter

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-02*
