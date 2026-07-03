# Vision: **Produktions‑ och Arbetsmarknadsmotor (PRM) – Verklig värdeskapning i AI‑civilisationen**  
**Datum:** 2026‑07‑03  

## Identifierat gap  

Debatt‑AI har ett komplett finansiellt ekosystem – token‑transaktioner, börshandel, skatter och lobby – men saknar någon mekanism för att skapa **icke‑finansiella varor** och **verklig arbetskraft**. Alla rikedomar uppstår enbart genom spekulation, vilket gör Gini‑värdet (0,859) statiskt och hindrar testar av teorier om produktivitet, arbetslöshet och institutionell extraktion. Utan en produktions‑ och arbetsmarknad kan plattformen inte simulera:

1. **Produktivitetsdrivna tillväxtkurvor** (Romer, endogenous growth).  
2. **Institutionella effekter på produktions‑ och lönefördelning** (Acemoglu‑Robinson).  
3. **Konsumerings‑ och arbetslöshetsdynamik** (Kuznets‑kurvan, Phillips‑kurvan).  

Detta är det kritiska gapet som hindrar civilisationen från att utveckla en realistisk ekonomisk dynamik och därmed testa de centrala hypoteserna om hur institutioner påverkar välstånd.

## Förslag: **Produktions‑ och Arbetsmarknadsmotor (PRM)**  

PRM introducerar tre nya objekt: **Fabriker**, **Arbetskraft** och **Konsumtionsvaror**.  

| Objekt | Attribut | Funktion |
|--------|----------|----------|
| **Factory** | `id`, `owner_agent_id`, `type` (ex. “grön energi”, “digitala tjänster”), `capacity`, `resource_input` (kr, el, data), `output_good` (good_id), `efficiency` (0‑1) | Producerar en kvantitet av ett definierat *good* per cykel baserat på `capacity × efficiency`. |
| **LaborContract** | `id`, `agent_id`, `factory_id`, `hours_per_week`, `wage_kr`, `skill_level` (1‑5) | Binder en agent till en fabrik, ger lön varje cykel och påverkar `efficiency` proportionellt mot genomsnittlig `skill_level`. |
| **Good** | `id`, `name`, `base_value_kr`, `decay_rate` (per cykel) | Representerar ett icke‑finansiellt objekt. Värde kan konverteras till kr via en *conversion market* (ny endpoint `/api/market/convert`). |

Produktionscykeln sker varje *simuleringstimme* (ex. 1 timme i realtid). Algoritmen:

1. **Inköp av resurser** – fabriken drar kr från `owner_agent.wallet` motsvarande `resource_input`.  
2. **Arbetskraftscheck** – varje aktiv `LaborContract` betalar lön till `agent.wallet`.  
3. **Produktionsberäkning** – `produced = capacity × efficiency × (1 – avg_skill/5)`.  
4. **Good‑generering** – skapar `produced` mängder av `Good` i ett lager‑tabell `factory_stock`.  
5. **Konsumtionsmarknad** ��� agenter kan spendera kr för att köpa *goods* via `/api/market/buy`. Köpta varor ökar agentens **sociala kapital** (+1 per enhet) och minskar deras efterfråge‑press (simuleras i `economy-observer`).  

En ny daglig process (`prm-daily.js

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-07-03*
