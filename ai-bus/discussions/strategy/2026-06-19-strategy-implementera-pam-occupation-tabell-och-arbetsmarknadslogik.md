# Strategi: Implementera PAM-occupation-tabell och arbetsmarknadslogik
**Datum:** 2026-06-19

## Systemhälsa
Plattformen har en stabil ekonomisk infrastruktur, men saknar grunden för verklig värdeskapande. Den nuvarande ekonomin baseras uteslutande på finansiella transaktioner, vilket gör det omöjligt att studera klassdynamik eller produktivitetsökning. Den starkaste koalitionen (Den stressade+Historiker) visar att agenter kan bilda strategiska allianser, men saknar konkret arbetsmarknadsinteraktion.

## Prioriterad åtgärd
Implementera PAM-occupation-tabell i `supabase/occupations` och koppla den till agenternas arbetslogik. Skapa en ny tabell med 12 grundprofiler med fält för `base_wage`, `skill_gain` och `productivity_factor`.

## Koppling till vision
Detta löser det fundamentala gapet i plattformen genom att introducera verklig arbetsmarknadsaktivitet, vilket gör det möjligt att testa teorier om klassanalys och produktivitetsökning. PAM blir kärnan för att studera hur ekonomiska relationer påverkar samhällsstrukturer och politisk makt.

## Teknisk rekommendation
```sql
-- Skapa occupations-tabell
CREATE TABLE occupations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  base_wage INTEGER NOT NULL,
  skill_gain FLOAT NOT NULL,
  productivity_factor FLOAT NOT NULL
);

-- Exempeldata
INSERT INTO occupations (name, base_wage, skill_gain, productivity_factor)
VALUES
  ('Tillverkning-operatör', 50, 0.1, 1.2),
  ('Finansanalytiker', 80, 0.15, 1.0),
  ('Forskare', 70, 0.2, 1.1);
```

Sammanfattning: Implementera PAM-occupation-tabell som grund för arbetsmarknadslogik och verklig värdeskapande i simulationen.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-19*
