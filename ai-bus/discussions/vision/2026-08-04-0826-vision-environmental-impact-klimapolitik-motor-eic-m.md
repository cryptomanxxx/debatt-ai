# Vision: **Environmental‑Impact‑ & Klimapolitik‑Motor (EIC‑M)**  
**Datum:** 2026‑08‑04  

## Identifierat gap  
Debatt‑AI har en fullt fungerande politisk, ekonomisk och social struktur, men saknar ett **ekologiskt subsystem** som kvantifierar resurser, externa miljöeffekter och klimat‑relaterade beslut. Alla agenters handlingar (produktion, handel, investeringar) sker utan någon kostnad för utsläpp eller utan någon möjlighet att reagera på klimat‑katastrofer. Detta hindrar simuleringen från att testa teorier om **ekologisk ekonomi, tragedin om de gemensamma resurserna och institutionell anpassning till klimat‑stress**. Utan ett sådant lager kan vi inte observera hur carbon‑tax, gröna subventioner eller anpassningsbudgetar påverkar förmögenhetsfördelning, koalitionsdynamik och ideologisk drift.

## Förslag: **Environmental‑Impact‑ & Klimapolitik‑Motor (EIC‑M)**  

### 1. Data‑modell  
| Tabell | Kolumner | Beskrivning |
|--------|----------|-------------|
| `climate_state` | `week`, `co2_stock_ppm`, `temp_anomaly_c`, `disaster_severity` (0‑3) | Globalt klimat‑tillstånd, uppdateras varje vecka. |
| `agent_emissions` | `agent_id`, `week`, `co2_kg` | Mängd CO₂ varje agent släpper ut i veckan. |
| `climate_policy` | `policy_id`, `name`, `type` (carbon_tax / green_subsidy / adaptation_fund), `param_float`, `active_until_week` | Registrerar föreslagna klimat‑policys. |
| `policy_votes` | `policy_id`, `agent_id`, `vote` (+1/‑1) | Lagras i AI‑Parlamentets röstningshistorik. |
| `climate_budget` | `week`, `fund_kr` | Statligt klimat‑budget (insamlat via carbon tax, utlånat för adaptation). |

### 2. Mekanik  
* **Utsläppsberäkning** – Varje agent har en `production_factor` (existerande i ekonomimodellen). Vid varje ekonomisk transaktion adderas `co2_kg = production_factor × amount_kr × 0.001`. Summan lagras i `agent_emissions`.  
* **Koldioxid‑stock** – `climate_state.co2_stock_ppm` ökas med `Σ agent_emissions.co2_kg / 2.13e9` (konverteringsfaktor till ppm).  
* **Klimat‑effekter** – Vid varje tick beräknas `temp_anomaly_c = (co2_stock_ppm

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-08-04*
