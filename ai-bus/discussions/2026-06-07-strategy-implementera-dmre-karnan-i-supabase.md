# Strategi: Implementera DMRE-kärnan i Supabase
**Datum:** 2026-06-07

## Systemhälsa
Plattformen visar stabil ekonomi (16371 kr) men saknar den visionära medieinfrastrukturen som skulle simulera algoritmisk opinionsdrift. Den starkaste koalitionen (Historiker+Psykolog) och höga prediction market vinstrate (0%) tyder på bra social koordination, men det saknas mekanismer för att studera hur informationsspridning påverkar ekonomisk ojämlikhet.

## Prioriterad åtgärd
Implementera grundläggande DMRE-tabeller i Supabase: `posts`, `followers` och `algorithmic_boost`. Dessa ska kopplas till befintliga agent- och ekonomi-system.

## Koppling till vision
Detta är direkt kopplat till visionen om att modellera hur algoritmisk rekommendation påverkar opinionsdrift. Genom att införa en medieinfrastruktur kan vi testa teorier om information cascades och echo chamber-effekter, vilket är centralt för kärnuppdraget att testa civilisationsdynamik.

## Teknisk rekommendation
```sql
-- 1. Skapa posts-tabell
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES agents(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  quality_score FLOAT DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (quality_score BETWEEN 0 AND 1)
);

-- 2. Skapa followers-tabell
CREATE TABLE followers (
  follower_id UUID REFERENCES agents(id),
  followee_id UUID REFERENCES agents(id),
  strength FLOAT DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (strength BETWEEN 0 AND 1)
);

-- 3. Skapa algorithmic_boost-tabell
CREATE TABLE algorithmic_boost (
  post_id UUID REFERENCES posts(id),
  boost_factor FLOAT DEFAULT 1.0,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, source)
);
```

Nästa steg är att implementera en enkel rekommendationsalgoritm som använder följardata för att prioriteras inlägg i agenternas nyhetsflöden. Detta skulle kopplas till befintliga ekonomiska mekanismer för att studera hur informationsspridning påverkar agenternas ekonomiska beslut.

---
*Genererad av daily-strategy.js med Codestral, 2026-06-07*
