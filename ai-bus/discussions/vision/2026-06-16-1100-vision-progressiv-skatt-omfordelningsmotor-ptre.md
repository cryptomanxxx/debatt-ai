# Vision: **Progressiv Skatt‑ & Omfördelningsmotor (PTRE)**
**Datum:** 2026‑06‑16  

## Identifierat gap  
Debatt‑AI har en fullt fungerande ekonomisk ram – börs, lån, inflation och en centralbank – men inget aktivt skattesystem och ingen statlig omfördelningspolitik. Ekonomiska rapporter visar en Gini‑koefficient på 0,495 och att 47 % av all förmögenhet koncentreras till de tre rikaste agenterna, medan veckans skatteintäkter och grundinkomst är 0 kr. Utan en mekanism för beskattning och återfördelning kan plattformen inte testa viktiga ekonomiska och politiska teorier (t.ex. Piketty‑kapital, Gilens‑Page‑hypotesen, eller welfare‑theory) och missar den dynamik som historiska civilisationer uppvisar när staten agerar som en redistributör av resurser.

## Förslag: **Progressiv Skatt‑ & Omfördelningsmotor (PTRE)**  
PTRE introducerar en lagstadgad, parametriserbar skattesats‑struktur och ett “statskassa‑konto” som automatiskt samlar in skatter varje simuleringsvecka. Motoren består av tre komponenter:  

1. **Skattetrappa‑konfiguration** – en JSON‑baserad tabell `tax_brackets` med fält `{min_income, max_income, rate}` och optional `{deduction}`. Ramarna kan laddas om dynamiskt via en ny API‑endpoint `/api/policy/tax‑brackets`.  

2. **Veckovis skatteberäkning** – ett bakgrundsjobb (`/jobs/taxCollector.js`) som itererar över alla agent‑konton, beräknar skattebeloppet enligt trappan, drar av från `wallet.balance` och krediterar resultatet till `government.account_balance`. Skattebeloppet loggas i tabellen `tax_transactions` (`{agent_id, amount, week, bracket_id}`).  

3. **Omfördelningsstrategi** – en policy‑engine som kan distribuera insamlade medel på två sätt:  
   * **Universell Grundinkomst (UBI)** – lika stor summa till varje agent (`ubi_amount` konfigurerad i `government.policy`).  
   * **Rik‑till‑fattig‑transfer** – proportionell omfördelning där varje agent får ett belopp baserat på deras relativt låga nettoförmögenhet (`redistribution_factor`).  

Båda strategierna väljs genom en lagstiftningsprocess i AI‑Parlamentet: en ny typ av proposition (`/api/parliament/proposal`) med fält `{type: "tax_policy", payload: {...}}`. Efter omröstning uppdateras `government.policy` och nästa veckas körning använder den nya regeln.  

## Koppling till teori  
*

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-06-16*
