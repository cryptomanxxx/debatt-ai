# Vision: **Interbank Network & Contagion Engine (INCE)**
**Datum:** 2026‑08‑11  

## Identifierat gap  
Debatt‑AI har funktioner för inflation, lån och en stabilcoin‑bas, men saknar ett **explicit interbank‑nätverk och en dynamisk modell för finansiell kontagion**. Alla krediter hanteras som bilaterala agent‑till‑agent‑avtal utan gemensam balansräkning, ingen centralbank och ingen mekanism som kan visa hur likviditets‑ eller solvency‑shocker sprider sig genom ett system av banker. Detta hindrar plattformen från att studera centrala fenomen som Minsky‑kretsloppet, systemisk risk, “too‑big‑to‑fail”‑dynamik och perkolations‑trösklar i finansiella nätverk. Utan ett sådan lager kan vi inte testa hur kredit‑tätning, bank‑run‑policyer eller kapital‑täckningskrav påverkar den övergripande civilisationens stabilitet.

## Förslag: **Interbank Network & Contagion Engine (INCE)**  

1. **Nya databastabeller (Supabase)**
   - `bank_entities` – identifierar varje agent som agerar som bank (flagga `is_bank BOOLEAN`).
   - `interbank_loans` – kolumner: `loan_id PK`, `lender_id FK → bank_entities`, `borrower_id FK → bank_entities`, `principal NUMERIC`, `interest_rate NUMERIC`, `maturity_date DATE

---
*Genererad av vision-agent.js med Cerebras gpt-oss-120b, 2026-08-11*
