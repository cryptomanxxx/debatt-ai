-- Migrering v2: aktiverar Row-Level Security på agent_planbocker.
--
-- SISTA STEGET i det stora agent_planbocker-projektet (PR #1250–#1258).
-- Tabellen hade RLS explicit avstängd (ALTER TABLE agent_planbocker
-- DISABLE ROW LEVEL SECURITY i supabase_ekonomi.sql) och var en av de 18
-- tabellerna som fick theater-policyer av den nu borttagna
-- supabase_rls_fix.sql — droppas här explicit (additiva RLS-policyer,
-- se CLAUDE.md).
--
-- Till skillnad från alla tidigare tabeller i genomgången krävde denna
-- ett helt eget flerstegsprojekt eftersom ~40 anropsställen i
-- supabase_utils.py (25 funktioner) och 9 fristående skript skrev till
-- tabellen — samtliga fick verifieras och säkras INNAN denna migrering
-- kunde köras, annars hade saldo-flöden (löner, lån, ETF-köp, bailouts,
-- spel, skatt, ränta) slutat fungera i produktion samma dag SQL:en
-- kördes.
--
-- Kartläggning och fixar (i ordning):
--   #1250 supabase_utils.py — 12 delade funktioner (spel, bank, ETF m.fl.)
--   #1251 finans_test.py
--   #1252 feedback_test.py
--   #1253 agent_token_test.py
--   #1254 bors_test.py (+ guard-fix i finans_test.py/agent_token_test.py)
--   #1255 hedgefond_test.py
--   #1256 stablecoin_test.py
--   #1257 parti_ekonomi_test.py
--   #1258 inflation.py (rättade en vilseledande secret-mappning i
--         inflation.yml som gjorde att skriptet i praktiken alltid körde
--         på anon-nyckeln trots ett variabelnamn som antydde service role)
--   #1259 mark_test.py, mark_andrahand_test.py, domstol_test.py (Codex P1
--         på denna PR — missades av den ursprungliga kartläggningen
--         eftersom tabellnamnet stod som prefix i en f-string-query-path,
--         t.ex. f"agent_planbocker?agent=eq.{namn}", vilket varken
--         rest/v1/-sökningen eller den bar-citerade-tabellnamn-sökningen
--         fångade. Se "Tredje varianten av samma fälla" nedan.)
--
-- foretag_test.py var redan säkrad sedan tidigare (lobbying_log-fixen,
-- PR #1238, rebindar hela main()).
--
-- KÄNT PROBLEM (ej löst här, se CLAUDE.md): flera av skrivfunktionerna
-- använder read-modify-write (läs saldo → räkna nytt värde → PATCH
-- absolut tal) istället för atomiska increments, vilket kan tappa
-- uppdateringar vid samtidiga skrivningar mot samma agents saldo.
-- Pre-existing mönster, inte en regression från denna migrering — kräver
-- ett separat större refaktoreringsprojekt (atomiska Postgres RPC-anrop).
--
-- Läsare (många SSR-sidor + rapportskript) bevarar publik SELECT via
-- anon-nyckeln — ingen PII i tabellen (agentnamn + saldo, inga
-- personuppgifter).
--
-- Kör i Supabase SQL Editor EFTER supabase_ekonomi.sql, och EFTER att
-- PR #1250–#1259 är mergade.

ALTER TABLE agent_planbocker ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub sel agent_planbocker" ON agent_planbocker;
DROP POLICY IF EXISTS "pub ins agent_planbocker" ON agent_planbocker;
DROP POLICY IF EXISTS "pub upd agent_planbocker" ON agent_planbocker;

DROP POLICY IF EXISTS "agent_planbocker_select" ON agent_planbocker;
CREATE POLICY "agent_planbocker_select" ON agent_planbocker FOR SELECT USING (true);
