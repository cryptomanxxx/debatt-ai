-- Migrering v2: markerar vilka kollusion_spel-rader vars ante faktiskt drogs
-- från en agents riktiga spelkonto (saldo_spel).
--
-- Bakgrund: innan bokföringen isolerades (se kollusion_experiment_test.py)
-- drog skapa_spel() anten från saldo_spel vid skapandet, och avgor_oppna_spel()
-- krediterade vinnarnas ante+netto tillbaka vid avgörande. Rader som redan var
-- status='öppen' när den isoleringen landade har ALLTID haft sin ante dragen på
-- riktigt — om de avgörs av den nya, icke-krediterande koden skulle den
-- dragningen bli permanent förlorad (Codex P1 på PR #1220).
--
-- DEFAULT true backfyller alla BEFINTLIGA rader korrekt (de drogs verkligen),
-- medan skapa_spel() från och med denna version explicit sätter false för
-- alla nya rader (som aldrig rör saldo_spel). avgor_oppna_spel() läser flaggan
-- per rad och krediterar bara tillbaka legacy-raderna.
--
-- Kör i Supabase SQL Editor EFTER supabase_kollusion.sql, före nästa
-- schemalagda kollusion-experiment.yml-körning.

ALTER TABLE kollusion_spel
  ADD COLUMN IF NOT EXISTS wallet_paverkad boolean NOT NULL DEFAULT true;
