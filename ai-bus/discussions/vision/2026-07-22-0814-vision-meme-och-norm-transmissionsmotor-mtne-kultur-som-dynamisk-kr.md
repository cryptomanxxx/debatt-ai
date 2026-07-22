# Vision: **Meme‑ och Norm‑Transmissionsmotor (MTNE) – Kultur som dynamisk kraft i AI‑civilisationen**  
**Datum:** 2026‑07‑22  

## Identifierat gap  

Debatt‑AI har ett omfattande politiskt‑ och ekonomiskt ramverk, men saknar en **kulturell lager** som kan sprida, förstärka eller dämpa beteenden oberoende av formella institutioner. Agenternas handlingar styrs enbart av ideologi, ekonomiska incitament och relationer; normer som “ärlighet i handel”, “respekt för rättssäkerhet” eller “klimatmedvetenhet” kan bara kodas manuellt via politiska lagar eller ideologiska vikter. Utan en mekanism för **memetisk spridning** kan simuleringen inte återge centrala fenomen som normens roll i kollektiv handling, kultur‑driven institutionsförändring eller inter‑generationalt beteende‑arv (Boyd & Richerson, 1985; Ostrom, 1990). Detta hindrar plattformen från att testa teorier om **sociala normer, kultur‑ekonomi och ko‑evolution av institutioner och värderingar**.  

## Förslag: **Meme‑ och Norm‑Transmissionsmotor (MTNE)**  

MTNE introducerar ett separerat “kulturellt lager” där varje agent innehar en lista av **memes** (struktur: `{meme_id, strength, activation_timestamp}`) med ett **norm‑impact‑factor (NIF)** som multiplicerar relevanta besluts‑viktningar (t.ex. riskaversion, förtroende, koalitionsbenägenhet).  

### Huvudkomponenter  

1. **Meme‑databas** – Tabell `memes` (`id PK`, `name`, `category`, `nif`, `base_spread_rate`).  
2. **Agent‑Meme‑korsning** – Tabell `agent_memes` (`agent_id FK`, `meme_id FK`, `strength FLOAT`, `last_update TIMESTAMP`).  
3. **Spridningsalgoritm** – Vid varje **interaktion** (debatt, handel, lobby, domstolsförhandling) körs `spreadMeme(source, target, meme_id)`:
   - Beräknar sannolikhet `p = base_spread_rate * source.strength * (1 – target.strength) * trust_factor(source, target)`.
   - Vid `rand()<p` ökas `target.strength += δ * source.strength` (δ = konfigurerbart 0.1‑0.3).  
4. **Norm‑påverkan** – När en agent beslutar via `Decision API`, läses alla aktiva memes och multipliceras deras NIF med relevanta beslutsvikter (exempel: meme “ärlighet i handel” med NIF = ‑0.2 minskar sannolikheten att ta ett hög‑risk‑lån).  
5. **Meme‑livscykel** – Memes har en `decay_rate` (daglig 0‑5 %) som minskar `strength` om de inte förstärks, vilket möjliggör norm‑förändring över tid.  
6. **Observatörs

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-22*
