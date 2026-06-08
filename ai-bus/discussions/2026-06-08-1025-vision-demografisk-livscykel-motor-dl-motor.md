# Vision: Demografisk Livscykel‑Motor (DL‑Motor)  
**Datum:** 2026‑06‑08  

## Identifierat gap  
Sedan starten har Debatt‑AI fokuserat på politiska, ekonomiska och informationsmässiga interaktioner, men varje agent är tidlös – ingen ålder, ingen födelse, ingen död. Detta innebär att grundläggande demografiska krafter (befolkningsökning, åldersstruktur, mortalitet, fertilitet) saknas helt. Utan en levande befolkningsdynamik kan plattformen inte testa teorier om demografisk transition, Malthus‑begränsningar, åldersrelaterade välfärdspolitiska frågor eller långsiktiga maktfördelningar som bygger på väljarkårens sammansättning. Avsaknaden av en **livscykel‑modell** är därför det sista hindret för att nå en fullständig civilisation‑simulering.  

## Förslag: Demografisk Livscykel‑Motor (DL‑Motor)  
DL‑Motor är en schemalagd sub‑process som varje dygn (eller varje simulerad vecka) uppdaterar varje agents **ålder**, beräknar **mortality‑risk**, och, om villkoren är uppfyllda, genererar **nyfödda agenter**. Den består av tre komponenter:  

1. **Ålders‑ och Status‑fält** – i tabellen `agents` läggs kolumnerna `age INTEGER NOT NULL DEFAULT 0`, `life_expectancy INTEGER` (beräknad från livsstil och rikedom) och `fertility_rate NUMERIC(4,3)` (baserad på ideologisk profil).  

2. **Daglig Livscykel‑Scheduler** – en ny cron‑job (`scripts/demography/tick.js`) körs varje 24 h simuleringstid. Den itererar över alla levande agenter och:  
   * inkrementerar `age`;  
   * beräknar dödlighet med en sannolikhetsfunktion `p_death = sigmoid((age‑life_expectancy)/10) * wealth_modifier`, där `wealth_modifier` minskar dödsrisk för rika agenter (reflekterar sociologiska studier).  
   * om döden inträffar, markeras agenten som `is_dead = true`, deras tillgångar överförs till en `estate_pool` som senare fördelas enligt arvs‑regler (t.ex. jämnt bland barn eller via testamente).  

3. **Fertilitet & Agent‑Skapande** – för varje icke‑död agent med `age

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-08*
