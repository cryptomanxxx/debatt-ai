-- supabase_rls_fix.sql
-- Aktiverar RLS på tabeller som Supabase Advisor flaggar som CRITICAL.
-- Policyn är "public full access" — samma beteende som utan RLS, men
-- nu med explicit kontroll och utan Advisor-varningar.
-- Kör i Supabase SQL Editor.

-- Hjälpmakro: används inte direkt, men kommenterar mönstret
-- ALTER TABLE t ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "pub sel" ON t FOR SELECT USING (true);
-- CREATE POLICY "pub ins" ON t FOR INSERT WITH CHECK (true);
-- CREATE POLICY "pub upd" ON t FOR UPDATE USING (true);
-- CREATE POLICY "pub del" ON t FOR DELETE USING (true);

-- ── krypto_historik ──────────────────────────────────────────────────────────
ALTER TABLE krypto_historik ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='krypto_historik' AND policyname='pub sel krypto_historik') THEN
    CREATE POLICY "pub sel krypto_historik" ON krypto_historik FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='krypto_historik' AND policyname='pub ins krypto_historik') THEN
    CREATE POLICY "pub ins krypto_historik" ON krypto_historik FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='krypto_historik' AND policyname='pub upd krypto_historik') THEN
    CREATE POLICY "pub upd krypto_historik" ON krypto_historik FOR UPDATE USING (true);
  END IF;
END $$;

-- ── markets ──────────────────────────────────────────────────────────────────
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='markets' AND policyname='pub sel markets') THEN
    CREATE POLICY "pub sel markets" ON markets FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='markets' AND policyname='pub ins markets') THEN
    CREATE POLICY "pub ins markets" ON markets FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='markets' AND policyname='pub upd markets') THEN
    CREATE POLICY "pub upd markets" ON markets FOR UPDATE USING (true);
  END IF;
END $$;

-- ── agent_bets ───────────────────────────────────────────────────────────────
ALTER TABLE agent_bets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_bets' AND policyname='pub sel agent_bets') THEN
    CREATE POLICY "pub sel agent_bets" ON agent_bets FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_bets' AND policyname='pub ins agent_bets') THEN
    CREATE POLICY "pub ins agent_bets" ON agent_bets FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_bets' AND policyname='pub upd agent_bets') THEN
    CREATE POLICY "pub upd agent_bets" ON agent_bets FOR UPDATE USING (true);
  END IF;
END $$;

-- ── backtest_resultat ────────────────────────────────────────────────────────
ALTER TABLE backtest_resultat ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='backtest_resultat' AND policyname='pub sel backtest_resultat') THEN
    CREATE POLICY "pub sel backtest_resultat" ON backtest_resultat FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='backtest_resultat' AND policyname='pub ins backtest_resultat') THEN
    CREATE POLICY "pub ins backtest_resultat" ON backtest_resultat FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='backtest_resultat' AND policyname='pub upd backtest_resultat') THEN
    CREATE POLICY "pub upd backtest_resultat" ON backtest_resultat FOR UPDATE USING (true);
  END IF;
END $$;

-- ── ohlcv_cache ──────────────────────────────────────────────────────────────
ALTER TABLE ohlcv_cache ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ohlcv_cache' AND policyname='pub sel ohlcv_cache') THEN
    CREATE POLICY "pub sel ohlcv_cache" ON ohlcv_cache FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ohlcv_cache' AND policyname='pub ins ohlcv_cache') THEN
    CREATE POLICY "pub ins ohlcv_cache" ON ohlcv_cache FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ohlcv_cache' AND policyname='pub upd ohlcv_cache') THEN
    CREATE POLICY "pub upd ohlcv_cache" ON ohlcv_cache FOR UPDATE USING (true);
  END IF;
END $$;

-- ── nyhetslog ────────────────────────────────────────────────────────────────
ALTER TABLE nyhetslog ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nyhetslog' AND policyname='pub sel nyhetslog') THEN
    CREATE POLICY "pub sel nyhetslog" ON nyhetslog FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nyhetslog' AND policyname='pub ins nyhetslog') THEN
    CREATE POLICY "pub ins nyhetslog" ON nyhetslog FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ── ai_log ───────────────────────────────────────────────────────────────────
ALTER TABLE ai_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_log' AND policyname='pub sel ai_log') THEN
    CREATE POLICY "pub sel ai_log" ON ai_log FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_log' AND policyname='pub ins ai_log') THEN
    CREATE POLICY "pub ins ai_log" ON ai_log FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ── agent_koalitioner ────────────────────────────────────────────────────────
ALTER TABLE agent_koalitioner ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_koalitioner' AND policyname='pub sel agent_koalitioner') THEN
    CREATE POLICY "pub sel agent_koalitioner" ON agent_koalitioner FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_koalitioner' AND policyname='pub ins agent_koalitioner') THEN
    CREATE POLICY "pub ins agent_koalitioner" ON agent_koalitioner FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_koalitioner' AND policyname='pub upd agent_koalitioner') THEN
    CREATE POLICY "pub upd agent_koalitioner" ON agent_koalitioner FOR UPDATE USING (true);
  END IF;
END $$;

-- ── agent_utmaningar ─────────────────────────────────────────────────────────
ALTER TABLE agent_utmaningar ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_utmaningar' AND policyname='pub sel agent_utmaningar') THEN
    CREATE POLICY "pub sel agent_utmaningar" ON agent_utmaningar FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_utmaningar' AND policyname='pub ins agent_utmaningar') THEN
    CREATE POLICY "pub ins agent_utmaningar" ON agent_utmaningar FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_utmaningar' AND policyname='pub upd agent_utmaningar') THEN
    CREATE POLICY "pub upd agent_utmaningar" ON agent_utmaningar FOR UPDATE USING (true);
  END IF;
END $$;

-- ── argument_roster ──────────────────────────────────────────────────────────
ALTER TABLE argument_roster ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='argument_roster' AND policyname='pub sel argument_roster') THEN
    CREATE POLICY "pub sel argument_roster" ON argument_roster FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='argument_roster' AND policyname='pub ins argument_roster') THEN
    CREATE POLICY "pub ins argument_roster" ON argument_roster FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ── labb_log ─────────────────────────────────────────────────────────────────
ALTER TABLE labb_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='labb_log' AND policyname='pub sel labb_log') THEN
    CREATE POLICY "pub sel labb_log" ON labb_log FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='labb_log' AND policyname='pub ins labb_log') THEN
    CREATE POLICY "pub ins labb_log" ON labb_log FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ── platform_stamning ────────────────────────────────────────────────────────
ALTER TABLE platform_stamning ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='platform_stamning' AND policyname='pub sel platform_stamning') THEN
    CREATE POLICY "pub sel platform_stamning" ON platform_stamning FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='platform_stamning' AND policyname='pub upd platform_stamning') THEN
    CREATE POLICY "pub upd platform_stamning" ON platform_stamning FOR UPDATE USING (true);
  END IF;
END $$;

-- ── lagforslag ───────────────────────────────────────────────────────────────
ALTER TABLE lagforslag ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lagforslag' AND policyname='pub sel lagforslag') THEN
    CREATE POLICY "pub sel lagforslag" ON lagforslag FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lagforslag' AND policyname='pub ins lagforslag') THEN
    CREATE POLICY "pub ins lagforslag" ON lagforslag FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lagforslag' AND policyname='pub upd lagforslag') THEN
    CREATE POLICY "pub upd lagforslag" ON lagforslag FOR UPDATE USING (true);
  END IF;
END $$;

-- ── agent_roster_lag ─────────────────────────────────────────────────────────
ALTER TABLE agent_roster_lag ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_roster_lag' AND policyname='pub sel agent_roster_lag') THEN
    CREATE POLICY "pub sel agent_roster_lag" ON agent_roster_lag FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_roster_lag' AND policyname='pub ins agent_roster_lag') THEN
    CREATE POLICY "pub ins agent_roster_lag" ON agent_roster_lag FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_roster_lag' AND policyname='pub upd agent_roster_lag') THEN
    CREATE POLICY "pub upd agent_roster_lag" ON agent_roster_lag FOR UPDATE USING (true);
  END IF;
END $$;

-- ── ekonomi_spel ─────────────────────────────────────────────────────────────
ALTER TABLE ekonomi_spel ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ekonomi_spel' AND policyname='pub sel ekonomi_spel') THEN
    CREATE POLICY "pub sel ekonomi_spel" ON ekonomi_spel FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ekonomi_spel' AND policyname='pub ins ekonomi_spel') THEN
    CREATE POLICY "pub ins ekonomi_spel" ON ekonomi_spel FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ekonomi_spel' AND policyname='pub upd ekonomi_spel') THEN
    CREATE POLICY "pub upd ekonomi_spel" ON ekonomi_spel FOR UPDATE USING (true);
  END IF;
END $$;

-- ── agent_transaktioner ──────────────────────────────────────────────────────
ALTER TABLE agent_transaktioner ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_transaktioner' AND policyname='pub sel agent_transaktioner') THEN
    CREATE POLICY "pub sel agent_transaktioner" ON agent_transaktioner FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_transaktioner' AND policyname='pub ins agent_transaktioner') THEN
    CREATE POLICY "pub ins agent_transaktioner" ON agent_transaktioner FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ── agent_positioner ─────────────────────────────────────────────────────────
ALTER TABLE agent_positioner ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_positioner' AND policyname='pub sel agent_positioner') THEN
    CREATE POLICY "pub sel agent_positioner" ON agent_positioner FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_positioner' AND policyname='pub ins agent_positioner') THEN
    CREATE POLICY "pub ins agent_positioner" ON agent_positioner FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_positioner' AND policyname='pub upd agent_positioner') THEN
    CREATE POLICY "pub upd agent_positioner" ON agent_positioner FOR UPDATE USING (true);
  END IF;
END $$;

-- ── agent_planbocker ─────────────────────────────────────────────────────────
ALTER TABLE agent_planbocker ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_planbocker' AND policyname='pub sel agent_planbocker') THEN
    CREATE POLICY "pub sel agent_planbocker" ON agent_planbocker FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_planbocker' AND policyname='pub ins agent_planbocker') THEN
    CREATE POLICY "pub ins agent_planbocker" ON agent_planbocker FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='agent_planbocker' AND policyname='pub upd agent_planbocker') THEN
    CREATE POLICY "pub upd agent_planbocker" ON agent_planbocker FOR UPDATE USING (true);
  END IF;
END $$;

-- ── lobbying_log ─────────────────────────────────────────────────────────────
ALTER TABLE lobbying_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lobbying_log' AND policyname='pub sel lobbying_log') THEN
    CREATE POLICY "pub sel lobbying_log" ON lobbying_log FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lobbying_log' AND policyname='pub ins lobbying_log') THEN
    CREATE POLICY "pub ins lobbying_log" ON lobbying_log FOR INSERT WITH CHECK (true);
  END IF;
END $$;
