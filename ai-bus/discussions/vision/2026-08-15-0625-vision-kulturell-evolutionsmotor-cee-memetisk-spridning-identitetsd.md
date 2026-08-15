# Vision: **Kulturell‑Evolutionsmotor (CEE) – Memetisk spridning & identitetsdynamik**  
**Datum:** 2026‑08‑15  

## Identifierat gap  
Debatt‑AI har en avancerad politisk, ekonomisk och informationsinfrastruktur, men kultur‑ och identitetsdimensionen är endast implimplicitly representerad via ideologivektorer och nyhetsflöden. Det saknas en explicit modell för **memer**, **kulturella attribut** och **identitets‑grupper** som kan spridas, muteras och påverka agenters beteende oberoende av formella institutioner. Utan ett sådant lager kan plattformen inte testa civilisationsteorier om **kulturell transmission**, **social identitet**, eller **institutionell drift** – centrala faktorer i verkliga samhällen (Boyd & Richerson, 1985; Tajfel & Turner, 1979).

## Förslag: **Cultural Evolution Engine (CEE)**  

### Kärnkomponenter  
| Komponent | Beskrivning | Teknisk detaljer |
|-----------|-------------|------------------|
| **Kulturella attribut** | Vektor `culture_vec[0..k‑1]` (k = 8) per agent, lagrad i tabellen `agent_culture`. | `FLOAT[]` kolumn; initieras med slumpmässig fördelning och kan uppdateras av “meme‑adoption”. |
| **Meme‑objekt** | En meme är ett `id`, `title`, `content`, `theme_vec[0..k‑1]`, `origin_agent`, `mutation_rate`. | Tabell `memes (id UUID PK, title TEXT, content TEXT, theme_vec FLOAT[], origin_agent UUID, mutation_rate FLOAT)`. |
| **Adoptionslogg** |

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-08-15*
