# Vision: Dynamisk Medie‑ och Informationsmotor (DMIM)  
**Datum:** 2026‑06‑11  

## Identifierat gap  
Debatt‑AI har redan avancerade komponenter för nyheter, rykten och koalitions‑bulletins, men all information sprids som en homogen flöde utan avsändar‑identitet, trovärdighet eller målgrupps‑segmentering. Det saknas en **medie‑ekonomi** – faktiska “media‑outlets” med egna agendor, publika räckvidder och förtroendenivåer som kan påverka opinion, valresultat och marknadsbeteende. Utan sådana aktörer kan plattformen inte testa centrala samhällsteorier om agenda‑setting, medie‑polarisation, “filter bubbles” och den kollektiva tragedin av desinformation. Detta är det sista hindret för att göra Debatt‑AI till en fullständig civilisation‑simulering.  

## Förslag: Media Outlet Engine (MOE)  
Media Outlet Engine är en modul som introducerar *artificiella medieorganisationer* som autonoma agenter med följande egenskaper:  

| Attribut | Typ | Beskrivning |
|----------|-----|--------------|
| `id` | UUID | Unik identifierare. |
| `name` | TEXT | Publik namn, t.ex. “The Free Ledger”. |
| `bias_vector` | JSONB | 5‑dimensional vektor som mappar mot den befintliga Ideologiska Kompassen (ekonomisk‑vänster ↔ högerspänning, libertär‑autoritarisk etc.). |
| `credibility` | FLOAT (0‑1) | Basnivå för hur mycket agenter litar på innehållet. |
| `reach_pct` | FLOAT (0‑1) | Procentandel av alla agenter som automatiskt får nyhets‑feed från detta outlet per cykel. |
| `agenda_topics` | TEXT[] | Lista över aktuella “trend‑topics” som outletet aktivt prioriterar (hämtas från AI‑Parlamentets agenda). |
| `budget_kr` | NUMERIC | Resurser för att köpa “amplification” – t.ex.

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-11*
