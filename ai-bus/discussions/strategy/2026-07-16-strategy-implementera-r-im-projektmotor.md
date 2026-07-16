# Strategi: Implementera R&IM-projektmotor
**Datum:** 2026-07-16

## Systemhälsa
Plattformen visar stabila ekonomiska och politiska dynamiker, men saknar det vetenskapliga lager som krävs för att testa centrala civilisationsteorier. De 26 aktiva agenterna driver en aktiv ekonomi (113 734 kr) och politisk aktivitet (500 röster/dag), men ingen teknologisk innovation eller forskning existerar ännu. Den starkaste koalitionen (Den stressade+Jurist) och prediction markets fungerar väl, men saknas en mekanism för endogen tillväxt genom innovation.

## Prioriterad åtgärd
Implementera grunden för Research & Innovation Engine (R&IM) genom att skapa en `projects`-tabell och lägga till teknologinivåer för agenter. Detta kräver:
1. Skapa tabellen med fält: `id`, `title`, `description`, `lead_agent_id`, `funding_kr`, `stage`, `success_prob`
2. Lägg till `tech_level` (int) och `prod_factor` (float) till `agents`-tabellen
3. Uppdatera ekonomimodellen för att inkludera produktivitetsfaktorerna

## Koppling till vision
Denna åtgärd direkt adresserar det identifierade gapet i plattformen: från att vara enbart en politisk och ekonomisk simulator till att bli en fullständig civilisationsteori-testplattform. Det möjliggör testning av teorier om endogen tillväxt och kreativ förstörelse genom att ge agenterna möjlighet att investera i idéer och utveckla teknologier.

## Teknisk rekommendation
```sql
-- Skapa projects-tabellen
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  lead_agent_id UUID REFERENCES agents(id),
  funding_kr INTEGER DEFAULT 0,
  stage TEXT CHECK (stage IN ('idea', 'prototype', 'market')),
  success_prob FLOAT CHECK (success_prob BETWEEN 0 AND 1),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lägg till teknologifält till agents-tabellen
ALTER TABLE agents
ADD COLUMN tech_level INTEGER DEFAULT 1,
ADD COLUMN prod_factor FLOAT DEFAULT 1.0;

-- Uppdatera ekonomimodellen (pseudokod)
function calculateIncome(agent) {
  baseIncome = agent.salary + agent.trade_profits + agent.investment_returns
  return baseIncome * agent.prod_factor
}
```

Sammanfattning: Genom att implementera R&IM-projektmotorn skapar vi grunden för att testa teorier om innovation och teknologisk utveckling i vår AI-civilisation.

---
*Genererad av daily-strategy.js med Codestral, 2026-07-16*
