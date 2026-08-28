# Vision: **Meme‑Diffusions‑ och Kultur‑Evolution‑Motor (MDCE)**  
**Datum:** 2026‑08‑28  

## Identifierat gap  
Debatt‑AI har ett fullt utvecklat politiskt‑, ekonomiskt‑ och relationsnät, men saknar ett kvantitativt lager för **kulturell information** – idéer, normer och ”memes” som i verkliga samhällen sprids viralt, förändrar värderingar och omkullkastar institutioner. För närvarande påverkas en agents beslut enbart av statiska nytta‑funktioner, fasta ideologiska kompassvärden och den binära förtroendegrafen. Utan ett memetiskt lager kan simuleringen inte reproducera fenomen som populistiska vågor, moralpanik, teknologisk adoption eller långsiktiga kultur‑skiften – de viktigaste drivkrafterna bakom förändring i historiska civilisationer. Detta hindrar både emergenta beteenden och testning av teorier om hur idéer omvandlar makt‑ och ekonomiska strukturer.  

## Förslag: **Meme‑Diffusions‑ och Kultur‑Evolution‑Motor (MDCE)**  
MDCE introducerar tre nya komponenter:  

1. **Meme‑databas** – en tabell `memes` med fält `id`, `title`, `content`, `category`, `base_influence` (float 0‑1), `decay_rate` (per tick), `origin_agent_id`.  
2. **Agent‑Meme‑status** – en join‑tabell `agent_memes` med `agent_id`, `meme_id`, `exposure_score` (float), `adoption_state` (`latent`, `adopted`, `rejected`), `last_tick`.  
3. **Diffusions‑engine** – en bakgrundsprocess som kör varje simuleringstic (`/cron/memeDiffusion`) enligt en **independent‑cascade**‑modell:  
   - När en agent med `adopted`‑status interagerar (debatt, lobbying, handel) med en granne i förtroendegrafen, beräknas sannolikheten `p = meme.base_influence * edge_weight * (1‑agent_memes.exposure_score)`.  
   - Vid `rand() < p` sätts mottagarens `adoption_state` till `latent` och `exposure_score` ökas med `edge_weight`.  
   - En latent meme blir adopterad efter ett slumpmässigt antal ticks (`adoption_delay ~ Geometric(p_adopt)`).  
   - Varje tick minskar `exposure_score` med `decay_rate`; när den faller under `0.05` återgår agenten till `rejected`.  

**Effekter på agent‑beteende**  
- Vid beslut (`vote`, `lobby`, `investment`) läses agentens `adopted`‑memes och deras `category`‑modifierare läggs till i den interna nytta‑funktionen (`utility += meme.base_influence * weight`).  
- Memes kan ha **policy‑triggers**: ett meme med `category = "inflation_fear"` ökar agentens preferens för hög ränta i `Economy Observer`‑rapporter.  
- En ny endpoint `/api/memes/trending` returnerar de memes med högst `adoption_rate` och möjliggör UI‑visning av “viral” idéer.  

## Koppling till teori  
MDCE är rotad i två centrala civilisationsteorier:  

1. **Meme‑teorin (Dawkins, 1976)** – idéer sprids analogt med gener, med replikatorer, variation och selektion. Independent‑cascade‑modellen är en etablerad approximation av social contagion i nätverksteori (Kempe, Kleinberg & Tardos, 2003).  
2. **Kulturell‑evolutionär ekonomi (Aoki & Yoshikawa, 2007)** – kulturella normer påverkar produktivitet, riskbenägenhet och institutionell legitimitet. Genom att låta memes modulera nytta‑funktioner får vi en mätbar **Legitimitets‑ och Tillits‑Index (LTI)** där

---
*Genererad av vision-agent.js med Groq openai/gpt-oss-120b, 2026-08-28*
