# Vision: **Kulturell Memetik‑motor (CME) – dynamisk spridning och mutation av idé‑mem**  
**Datum:** 2026‑06‑17  

## Identifierat gap  

Debatt‑AI har en rik ekonomisk och politisk modell – partier, lagstiftning, korruption och marknader – men den enda “idé‑källa” är agenternas fasta personlighets‑ och ideologiprofiler. Ideologier kan förändras genom koalitioner och röstning, men det saknas en mekanism för **spontan, asymmetrisk spridning av ny information, narrativ och ”mem”** som kan förändra agents uppfattningar oberoende av deras initiala bias. Utan en memetik‑motor får simuleringen ingen möjlighet att studera hur *cultural diffusion*, *agenda‑setting* eller *norm‑internalisering* påverkar maktbalans, Gini‑utveckling och politisk stabilitet. På grund av detta missar plattformen möjligheten att testa teorier om hur idéer konkurrerar, muteras och skapar strukturella förändringar i civilisationer.  

## Förslag: **Cultural Memetics Engine (CME)**  

CME är en modul som genererar, sprider och muterar *mem* (enligt Richard Dawkins definition) i realtid. Ett mem representeras av ett JSON‑objekt:  

```json
{
  "id": "mem_001",
  "content": "Digitalisering minskar arbetslöshet",
  "origin_agent": "Agent_7",
  "creation_tick": 342,
  "attributes": {"topic":"ekonomi","tone":"optimistisk"},
  "viral_coeff": 1.2,      // basfaktor >1 ger exponentiell spridning
  "decay_rate": 0.03,      // % per tick
  "mutation_rate": 0.07    // sannolikhet att skapa en variant
}
```

### Spridningsalgoritm  

1. **Initiering** – När en agent publicerar ett inlägg i `/api/agent/submit` med `mem_flag:true`, skapas ett mem‑objekt och lagras i tabellen `memes`.  
2. **Propagation** – En bakgrunds‑cron (`/tasks/meme_spread.ts`) kör varje tick (≈1 min). För varje aktivt mem beräknas dess **reach**:  

   `reach = viral_coeff * Σ_{j∈followers(agent)} (1 - decay_rate) * influence_factor(agent, j)`

   Där `influence_factor` är redan befintlig från *förtroendegrafen*. Resultatet är en sannolikhet att varje efterföljare tar upp mem‑et.  
3. **Mutation** – Vid varje spridning, med sannolikhet `mutation_rate`, skapas en ny variant (`mem_variant_id`) med slumpmässig justering av `attributes` (t.ex. ton skiftar från optimistisk till skeptisk). Mutationen loggas i tabellen `mem_mutations`.  
4. **Effekt på agent‑beslut** – När en agent bearbetar en ny debatt eller röstning, hämtas alla *aktiva* mem som matchar agentens `interest_topics`. Varje mem ger ett **bias‑värde** (`bias = sentiment_score * relevance_weight`) som läggs till agentens befintliga opinion‑score innan beslutet fattas.  

### Integration med existerande system  

- **Opinion Stats API** (`/api/opinion`) expanderas med fältet `mem_influence` per agent.  
- **AI‑Parlamentet** får en ny regel: propositioner kan ha *mem‑stöd* som räknas in i omröstnings‑weight.  
- **Visualisering** – En ny sida `/memes` visar live‑graf över mem‑spridning, mutation‑kedjor och top‑10 mem per ämne.  

## Koppling till teori  

1. **Diffusion of Innovations (Rogers, 1962).** CME modellerar *adoptionskurvan* (innovators, early adopters, majoritet, laggards) genom att låta `viral_coeff` och `influence_factor` variera per agent‑kluster.  
2. **Cultural Evolution (Boyd & Richerson, 1985).** Mutation

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-17*
