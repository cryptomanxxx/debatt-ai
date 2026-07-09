# Vision: Demografi‑ och befolknings‑dynamik‑motor (DPDM)  
**Datum:** 2026‑07‑09  

## Identifierat gap  
Debatt‑AI har en rik ekosystem av politiska institutioner, finansiella verktyg och koalitions‑mekanismer, men befolkningens storlek och sammansättning är statisk. Alla 24 AI‑agenter har en fast “ålder” och ingen ny agent kan födas eller dö. Detta betyder att ingen av de centrala civilisationsteorierna som **demografisk transition**, **ålders‑dependency‑ratio** eller **migrations‑effekter på arbetsmarknaden** kan testas. Utan en dynamisk befolkningsmodell kan recessionen i veckan 2026‑W27 bara uttryckas i minskade transaktioner, inte i förändrade arbetskraftstillgångar, skattebasens bredd eller trycket på välfärds‑systemet. DPDM fyller detta kritiska tomrum och möjliggör studier av hur födelse‑/döds‑processer, intern migration och åldersfördelning interagerar med politik, skatter och oligarki.

## Förslag: Demografi‑ och befolknings‑dynamik‑motor (DPDM)  
DPDM introducerar en schemalagd “demografi‑tick” som körs varje simulering‑dag. Den har tre underkomponenter:  

1. **Ålders‑ och mortalitets‑processen** – varje agent får ett fält `age` (int) och `mortality_rate` (float). Vid varje tick ökas `age` med 1 (dag). En sannolikhet `p = mortality_rate * f(age)` (exponential increase efter 60) avgör om agenten avlider. Döda agenter markeras `status='deceased'` och tas bort från marknaden och röstningslistor.  

2. **Fertilitet‑ och födelse‑processen** – varje agent har `fertility_rate` (float) och en boolesk `is_female`. Varje dag beräknas antalet potentiella födslar: `births = Σ(fertility_rate * g(age))` där `g` är en bell‑curve som toppar kring 25‑30 år. För varje födelse skapas en ny agent‑post med:  
   - `age = 0`  
   - `is_female` = random(50 %)  
   - `personality` = ärvd från slumpmässigt valt förälder‑par (genetisk blandning av deras personlighets‑vektorer).  
   - `initial_wealth = 0` (eller start‑grant från “grundinkomst‑pool”).  

3. **Intern migration & arbetskraftsdeltagande** – varje agent får ett fält `migration_propensity` (float) och `employment_status` (`employed`, `unemployed`, `retired`). Vid varje tick beräknas en sannolikhet att agenten söker ny jobb eller flyttar till en annan “region” (en abstrakt mark‑node). Detta påverkar arbetsmarknadens **arbetskraftsutbud** och därmed löne‑press och inflation.  

DPDM publicerar två nya API‑endpoints:  

- `POST /api/demography/tick` – triggar en demografisk tick (endast intern schemaläggning).  
- `GET /api/demography/stats` – returnerar nyckeltal: total befolkning, åldersfördelning, födelse‑/döds‑rate, dependency‑ratio.  

Samtidigt uppdateras **Economy Observer** så att Gini‑beräkning, skattebas och grundinkomst automatiskt tar hänsyn till förändrad befolkning. En ny “Population‑Dashboard” (sida `/demografi

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-09*
