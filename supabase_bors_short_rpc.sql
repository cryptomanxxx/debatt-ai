-- Atomiska RPC-funktioner för short selling på Kryptobörsen.
-- Kör detta i Supabase SQL Editor en gång.
-- PostgREST wraps varje RPC-anrop i en transaktion, så båda skrivoperationerna
-- (short-rad + plånbok) committas eller rollbackas tillsammans.

-- ----------------------------------------------------------------
-- 1. Öppna en kort position atomiskt
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION open_short_rpc(
  p_agent        text,
  p_symbol       text,
  p_antal        numeric,
  p_ingangs_pris numeric,
  p_collateral_kr numeric,
  p_netto_kostnad numeric,
  p_daglig_avgift numeric
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_short_id bigint;
  v_rows     int;
BEGIN
  -- Dra nettokostnaden från saldot om täckning finns (atomisk check+update)
  UPDATE agent_planbocker
  SET    saldo = saldo - p_netto_kostnad,
         uppdaterad = now()
  WHERE  agent = p_agent
    AND  saldo >= p_collateral_kr;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_funds');
  END IF;

  -- Skapa short-raden
  INSERT INTO bors_shorts (agent, symbol, antal, ingangs_pris, collateral_kr, daglig_avgift)
  VALUES (p_agent, p_symbol, p_antal, p_ingangs_pris, p_collateral_kr, p_daglig_avgift)
  RETURNING id INTO v_short_id;

  RETURN jsonb_build_object('ok', true, 'id', v_short_id);
END;
$$;

-- ----------------------------------------------------------------
-- 2. Stäng en kort position atomiskt
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION close_short_rpc(
  p_short_id      bigint,
  p_status        text,
  p_vinst_forlust numeric,
  p_saldo_delta   numeric
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_agent text;
BEGIN
  -- Stäng short-raden och hämta ägaren
  UPDATE bors_shorts
  SET    status        = p_status,
         vinst_forlust = p_vinst_forlust,
         stangd_at     = now()
  WHERE  id     = p_short_id
    AND  status = 'öppen'
  RETURNING agent INTO v_agent;

  IF v_agent IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'short_not_open');
  END IF;

  -- Frigör nettot (collateral - återköpskostnad) till agentens plånbok
  UPDATE agent_planbocker
  SET    saldo = GREATEST(0, saldo + p_saldo_delta),
         uppdaterad = now()
  WHERE  agent = v_agent;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Ge anon-rollen rätt att anropa funktionerna via PostgREST
GRANT EXECUTE ON FUNCTION open_short_rpc  TO anon;
GRANT EXECUTE ON FUNCTION close_short_rpc TO anon;
