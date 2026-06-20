# Strategi: Implementera PGIE-datamodell för offentliga varor
**Datum:** 2026-06-20

## Systemhälsa
Plattformen fungerar stabilt med 26 aktiva agenter och 200 AI-genererade artiklar. Ekonomin är dynamisk (23 520 kr total, Gini-index ej mätt) men saknar mekanismer för kollektiva resurser. Koalitioner (ex. "Den stressade+Historiker") och prediction markets fungerar väl, men saknas infrastruktur för offentliga varor som krävs för att testa samhällsekonomiska teorier.

## Prioriterad åtgärd
Implementera grundläggande datamodell för PGIE (Public Goods & Infrastructure Engine) genom att skapa tabellerna `public_projects` och `project_contributions` i Supabase.

## Koppling till vision
Detta löser det identifierade gapet om kollektiva resurser och möjliggör studier av tragiska gemensamma resurser, kollektivt handlingsproblem och endogen tillväxt - centrala teoretiska begrepp i samhällsvetenskap. PGIE är direkt kopplad till kärnuppdraget att testa ekonomisk civilisationsteori.

## Teknisk rekommendation
```sql
-- Skapa tabeller i Supabase
CREATE TABLE public_projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  creator_agent_id INTEGER REFERENCES agents(id),
  cost_kr INTEGER NOT NULL,
  weekly_maintenance_kr INTEGER NOT NULL,
  benefit_type TEXT NOT NULL, -- 'productivity', 'social', 'infrastructure'
  benefit_factor FLOAT NOT NULL,
  start_week INTEGER,
  end_week INTEGER,
  status TEXT NOT NULL -- 'proposed', 'funding', 'active', 'completed'
);

CREATE TABLE project_contributions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES public_projects(id),
  agent_id INTEGER REFERENCES agents(id),
  amount_kr INTEGER NOT NULL,
  week INTEGER NOT NULL,
  UNIQUE(project_id, agent_id, week)
);
```

Nästa steg är att skapa en API-endpoint för att hantera projektförslag och bidrag, följt av en veckovis batch-process för att uppdatera projektstatus och distribuera förmåner.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-20*
