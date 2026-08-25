# Vision: **Meme‑Diffusions‑ och Kultur‑Evolution‑Motor (MDCE)**  
**Datum:** 2026‑08‑25  

## Identifierat gap  
Debatt‑AI har en rik strukturell bas – parlament, marknad, lobby, förtroendegraf och till och med en emotion‑layer‑vision – men saknar en **kvantitativ modell för memetisk spridning**. I verkliga civilisationer idéer, normer och ”kulturella memes” rör sig genom sociala nätverk, förändrar värderingar, förändrar röstmönster och kan utlösa massrörelser (t.ex. protestvågor, populistiska svängningar). Utan ett memetiskt lager agerar agenter enbart på statiska nytta‑funktioner; de kan inte plötsligt anta nya ideologier, låta sig påverkas av viral propaganda eller skapa långsiktiga kultur‑shifts som i historien driver förändring av institutioner. Detta hindrar simuleringen från att reproducera centrala teorier om **kulturell evolution** (Boyd & Richerson), **social learning** (Rogers) och **normativ drift** (Macy‑Flam).  

## Förslag: **Meme‑Diffusions‑ och Kultur‑Evolution‑Motor (MDCE)**  
MDCE introducerar *memes* som första‑klassens objekt som kan **genereras**, **spridas** och **aktiveras** i agenters beslutsprocesser. En meme har:  

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| `id` | UUID | Unikt identifierare |
| `title` | TEXT | Kort namn (ex. “Skatte‑reform‑pro‑aktiv”) |
| `payload` | JSONB | Parametrar som kan modifiera besluts‑utility‑funktioner (ex. `{"tax_rate_delta": -0.02}`) |
| `origin_agent_id` | UUID | Agent som initierade memen |
| `creation_tick` | INTEGER | Simulerings‑tick då memen föddes |
| `lifespan` | INTEGER | Max antal ticks memen får existera |
| `virality` | FLOAT (0‑1) | Bas‑spridningsfaktor, justerbar av policy‑effekter |
| `tags` | TEXT[] | Kategorier (ekonomi, kultur, teknik) |

### Spridningsmekanik  
1. **Initiering** – En agent kan skapa en meme via `/api/meme/create`. Payload kan inkludera förändringar av parametrar som skatter, räntor, eller sociala normer.  
2. **Propagation Loop** – Vid varje tick körs en bakgrunds‑cron (`/tasks/meme_propagate.js`). För varje aktiv meme beräknas sannolikheten att den når en granne `j` från agent `i` enligt:  

```
P_ij = virality * trust(i,j)

---
*Genererad av vision-agent.js med Groq openai/gpt-oss-120b, 2026-08-25*
