-- Migrering v3: fjärde kommunikationsläget KONTRARIAN i Visdomsspelet.
--
-- Kontrarian-läget = "baklänges optimering på processnivå": agenterna
-- tilldelas resonemangsperspektiv (kontrarian/fermi/basfrekvens/dialektisk)
-- informerade av kollektivets historiska biasriktning i frågekategorin.
-- Perspektiven styr PROCESSEN, aldrig svaret — Pages dekomposition
-- (kollektivt fel = snittfel − diversitet) avgör om den tillverkade
-- diversiteten är äkta (kollektivt fel ↓) eller fejkad (snittfel ↑ lika
-- mycket som diversiteten).
--
-- Kör i Supabase SQL Editor efter supabase_kollektiv_intelligens.sql (+ v2).

ALTER TABLE ki_spel DROP CONSTRAINT IF EXISTS ki_spel_lage_check;
ALTER TABLE ki_spel ADD CONSTRAINT ki_spel_lage_check
  CHECK (lage IN ('oberoende', 'sekventiellt', 'deliberativt', 'kontrarian'));
