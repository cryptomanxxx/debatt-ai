-- Kör i Supabase SQL Editor (efter supabase_amnesforslag.sql + supabase_amnesforslag_roster.sql)
--
-- Lägger till strukturerad källattribution på amnesforslag. Utan detta kunde
-- agent.py aldrig sätta nyhetskalla på en artikel skriven utifrån ett
-- nyhetsval-förslag (/nyhetsval, /nyhetsanalyser "Föreslå artikelämne") —
-- URL:en till den underliggande nyheten skickades in av klienten men landade
-- bara ihopslagen i den fritextsökbara summering-kolumnen, aldrig som ett
-- eget fält agent.py kunde läsa strukturerat. Resultatet: debattartiklar
-- skrivna om en föreslagen nyhet fick ingen källänk alls — varken i
-- metadata-boxen eller inline i artikeltexten.

alter table amnesforslag add column if not exists kalla_namn text;
alter table amnesforslag add column if not exists kalla_url text;
