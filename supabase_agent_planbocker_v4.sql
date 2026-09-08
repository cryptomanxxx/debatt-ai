-- Migrering v4: justera_agent_planbok() returnerar nu även saldot FÖRE
-- justeringen (saldo_fore/saldo_spel_fore), atomiskt inom samma operation.
--
-- Codex-fynd (PR #1423-granskning): domstol_test.py → verkstall_straff()
-- läste agentens saldo med en separat GET INNAN RPC-anropet, för att
-- beräkna "faktiskt uttaget bötesbelopp" (böterna golvas vid agentens
-- saldo — en fattig agent kan inte betala mer än den har). Om ett annat
-- samtidigt anrop (agent.py, ett annat dagligt experiment-skript, m.fl. —
-- se schematabellen i CLAUDE.md) ändrade AGENTENS saldo mellan den GET:en
-- och det atomiska RPC-anropet blev "saldot innan" inaktuellt medan "saldot
-- efter" (RPC-svaret) var korrekt — differensen mellan dem (faktisk_bot)
-- kunde då bli fel, eller rentav NEGATIV om en samtidig kreditering hann
-- ske emellan. En negativ faktisk_bot skickades sedan rakt in som
-- saldo_delta till Statskassans _justera_planbok()-anrop, vilket i så fall
-- hade DEBITERAT Statskassan istället för att kreditera den.
--
-- Lösningen är att låta RPC:n själv rapportera saldot både före och efter
-- — inom EN atomisk operation, radlåst med FOR UPDATE innan uppdateringen,
-- så det inte finns någon lucka där ett samtidigt anrop kan hinna emellan.
-- Anropande kod som (som verkstall_straff()) behöver veta exakt hur mycket
-- som faktiskt drogs kan då räkna saldo_fore - saldo ur SAMMA svar, istället
-- för att blanda en tidigare separat läsning med RPC-resultatet.
--
-- Kräver DROP + CREATE (inte bara CREATE OR REPLACE) eftersom RETURNS
-- TABLE-kolumnlistan ändras — Postgres tillåter inte att en funktions
-- returtyp ändras med REPLACE.
--
-- Kör i Supabase SQL Editor EFTER supabase_agent_planbocker_v3.sql.

DROP FUNCTION IF EXISTS justera_agent_planbok(text, numeric, numeric, integer, integer, integer, boolean);

CREATE FUNCTION justera_agent_planbok(
  p_agent               text,
  p_saldo_delta         numeric DEFAULT 0,
  p_saldo_spel_delta    numeric DEFAULT 0,
  p_totalt_givet_delta  integer DEFAULT 0,
  p_totalt_fatt_delta   integer DEFAULT 0,
  p_antal_spel_delta    integer DEFAULT 0,
  p_golv_noll           boolean DEFAULT true
)
RETURNS TABLE (
  agent            text,
  saldo            integer,
  saldo_spel       integer,
  totalt_givet     integer,
  totalt_fatt      integer,
  antal_spel       integer,
  saldo_fore       integer,
  saldo_spel_fore  integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saldo_fore      integer;
  v_saldo_spel_fore integer;
BEGIN
  -- Radlås raden och läs "saldot innan" FÖRST — FOR UPDATE blockerar andra
  -- samtidiga skrivningar mot SAMMA agent tills den här transaktionen är
  -- klar, så värdena vi läser här kan aldrig bli inaktuella av att ett
  -- annat anrop hinner emellan.
  SELECT ap.saldo, ap.saldo_spel INTO v_saldo_fore, v_saldo_spel_fore
  FROM agent_planbocker ap WHERE ap.agent = p_agent FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE agent_planbocker AS ap
  SET
    saldo = CASE WHEN p_golv_noll
              THEN GREATEST(0, ap.saldo + p_saldo_delta)
              ELSE ap.saldo + p_saldo_delta
            END,
    saldo_spel = CASE WHEN p_golv_noll
              THEN GREATEST(0, COALESCE(ap.saldo_spel, 0) + p_saldo_spel_delta)
              ELSE COALESCE(ap.saldo_spel, 0) + p_saldo_spel_delta
            END,
    totalt_givet = ap.totalt_givet + p_totalt_givet_delta,
    totalt_fatt  = ap.totalt_fatt + p_totalt_fatt_delta,
    antal_spel   = ap.antal_spel + p_antal_spel_delta,
    uppdaterad   = now()
  WHERE ap.agent = p_agent
  RETURNING ap.agent, ap.saldo, ap.saldo_spel, ap.totalt_givet, ap.totalt_fatt, ap.antal_spel,
            v_saldo_fore, v_saldo_spel_fore;
END;
$$;

-- Matchar tabellens RLS (skrivning kräver service role) — anon får aldrig
-- exekvera funktionen, bara den skyddade service-role-nyckeln.
REVOKE ALL ON FUNCTION justera_agent_planbok(text, numeric, numeric, integer, integer, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION justera_agent_planbok(text, numeric, numeric, integer, integer, integer, boolean) TO service_role;
