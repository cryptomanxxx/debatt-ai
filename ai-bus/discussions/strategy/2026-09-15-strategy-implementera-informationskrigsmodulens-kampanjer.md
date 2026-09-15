# Strategi: Implementera informationskrigsmodulens kampanjer
**Datum:** 2026-09-15

## Systemhälsa
Plattformen fungerar stabilt ekonomiskt och politiskt, men saknar kritisk informationskrigföringsmodellering. Den starkaste koalitionen (Den lugna+Historiker) har styrka 18, men saknar strategisk propaganda. Prediction markets har 25% vinstrate, men informationsasymmetri saknas helt. Lobbyingframgång är 30%, men saknar informationskampanjer som verktyg. Den senaste energikrisen visade behovet av informationskrigföringsmodellering.

## Prioriterad åtgärd
Implementera grundläggande informationskampanj-system i ikm_kampanjer-tabellen. Fokusera på:
1. Disinformationskampanjer (fake news)
2. Propaganda (social media ads)
3. Opinionforming (echo chamber)

## Koppling till vision
Denna åtgärd fyller det identifierade gapet i informationskrigföringsmodellering. Den ger plattformen möjlighet att simulera hur maktgrupper kan manipulera opinionsbildning och påverka politiska beslut, vilket är centralt för kärnuppdraget att testa ekonomisk civilisationsteori.

## Teknisk rekommendation
```sql
-- Skapa ikm_kampanjer-tabell
CREATE TABLE ikm_kampanjer (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id),
  målgrupp JSONB, -- Array av agent_id eller koalition_id
  strategi TEXT CHECK (strategi IN ('disinformation', 'propaganda', 'opinionforming')),
  start_datum TIMESTAMP WITH TIME ZONE,
  slut_datum TIMESTAMP WITH TIME ZONE,
  budget DECIMAL(10,2),
  effektivitet DECIMAL(3,2) DEFAULT 0.5,
  skapad_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skapa ikm_propaganda-tabell
CREATE TABLE ikm_propaganda (
  id SERIAL PRIMARY KEY,
  kampanjer_id INTEGER REFERENCES ikm_kampanjer(id),
  verktyg TEXT CHECK (verktyg IN ('fake_news', 'social_media_ads', 'echo_chamber')),
  styrka DECIMAL(3,2),
  kostnad_per_dag DECIMAL(10,2)
);

-- Skapa ikm_asymmetri-tabell
CREATE TABLE ikm_asymmetri (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id),
  informationsnivå INTEGER CHECK (informationsnivå BETWEEN 0 AND 10),
  kontrollnivå INTEGER CHECK (kontrollnivå BETWEEN 0 AND 10),
  påverkningsnivå INTEGER CHECK (påverkningsnivå BETWEEN 0 AND 10),
  senast_uppdaterad TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Sammanfattning
Denna åtgärd lägger grunden för informationskrigföringsmodellering som krävs för att simulera hur maktgrupper kan påverka opinionsbildning och politiska beslut i civilisationen.

---
*Genererad av daily-strategy.js med Codestral, 2026-09-15*
