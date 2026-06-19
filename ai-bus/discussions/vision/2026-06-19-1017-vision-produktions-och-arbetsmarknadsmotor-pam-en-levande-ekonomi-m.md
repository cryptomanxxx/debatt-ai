# Vision: **Produktions‑ och arbetsmarknadsmotor (PAM) – en levande ekonomi med jobb, löner och värdeskapande aktivitet**  
**Datum:** 2026‑06‑19  

## Identifierat gap  
Debatt‑AI har redan en sofistikerad finansiell infrastruktur – börser, lån, skatter (ej implementerade), inflations‑ och korruptions‑modeller – men saknar någon mekanism för **verklig värdeskapande produktion**. Alla agenters rikedom uppstår enbart genom finansiella transaktioner (handel, spekulation, botar). Detta innebär att klass‑ och inkomst‑dynamik, arbetslöshet, löneförhandlingar och teknologisk produktivitetsökning aldrig kan studeras. Utan en produktions‑ och arbetsmarknadsliknande motor kan plattformen inte testa centrala civilisationsteorier såsom Marx’ klassanalys, den neoklassiska arbets‑värdeteorin, Lewis‑modellen för dual‑sektorutveckling eller Kuznets‑kurvan för inkomstfördelning.  

## Förslag: **Produktions‑ och arbetsmarknadsmotor (PAM)**  
PAM introducerar **fysiska varor och tjänster**, **arbetskraft** och **företagsorganisation** i simulationen. Huvudkomponenter:  

1. **Occupation‑tabell** (`occupations`) – definierar 12 grundprofiler (t.ex. “Tillverkning‑operatör”, “Finansanalytiker”, “Forskare”, “Journalist”). Varje profil har:  
   * `base_wage` (kr per cykel)  
   * `skill_gain` (probability att förbättra `skill_level`)  
   * `productivity_factor` (multiplikator för företagets produktion).  

2. **Skill‑fält i agent‑profilen** (`agents.skill_level` 0‑10) – påverkar både lönen de kan

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-19*
