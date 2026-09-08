-- Migrering v3: atomisk saldo-justering för agent_planbocker.
--
-- Löser det race condition som dokumenterades som känt-men-oadresserat i
-- supabase_agent_planbocker_v2.sql och i CLAUDE.md ("agent_planbocker-
-- projektet — känt arkitekturproblem"): praktiskt taget alla saldo-
-- skrivande funktioner gjorde read-modify-write (GET aktuellt saldo →
-- räkna nytt värde i Python → PATCH ett ABSOLUT tal) istället för en
-- atomisk increment. Två samtidiga skrivningar mot SAMMA agents saldo
-- (fullt möjligt — flera GitHub Actions-workflows rör agent_planbocker
-- samma timme, se schematabellen i CLAUDE.md) kan då tappa en av
-- uppdateringarna: den som PATCHar sist vinner baserat på sin egen,
-- redan inaktuella läsning.
--
-- Denna funktion gör istället EN atomisk UPDATE per anrop:
--   saldo = saldo + p_saldo_delta
-- (och motsvarande för saldo_spel/totalt_givet/totalt_fatt/antal_spel).
-- Postgres radlas raden under hela UPDATE-satsen, så oavsett hur många
-- samtidiga anrop som träffar samma agent appliceras varje delta korrekt
-- ovanpå det senaste värdet — ingen läsning kan bli inaktuell mellan att
-- den görs och att skrivningen sker, eftersom det aldrig finns en separat
-- läsning att bli inaktuell: delta beräknas i Python (utifrån affärslogik
-- som ändå kräver LLM-svar, spelregler m.m.), men själva TILLÄMPNINGEN av
-- deltat på det lagrade värdet sker i en enda SQL-sats.
--
-- p_golv_noll (default true) speglar det befintliga mönstret i nästan all
-- kringliggande kod (t.ex. domstolsböter "drar från saldo (minimum 0)",
-- _uppdatera_saldo_spel: "nytt = max(0, saldo + delta)") — saldo/saldo_spel
-- tillåts aldrig bli negativa. Skulder hanteras i en helt separat tabell
-- (agent_lan.saldo_kvar), inte som negativt agent_planbocker.saldo.
--
-- Returnerar den uppdaterade raden så anropande kod (som ofta loggar eller
-- visar det nya saldot) slipper ett extra GET efteråt.
--
-- Kör i Supabase SQL Editor EFTER supabase_agent_planbocker_v2.sql.

-- p_saldo_delta/p_saldo_spel_delta är NUMERIC, inte integer — några anropare
-- (t.ex. ETF-köp/-sälj i supabase_utils.py, som räknar i kr-belopp härledda
-- ur USD-kryptopriser) skickar fraktionerade delta-belopp. saldo/saldo_spel
-- är fortfarande INTEGER-kolumner (supabase_ekonomi.sql), så UPDATE-satsens
-- assignment-cast avrundar automatiskt till närmaste heltal — exakt samma
-- avrundningsbeteende som den tidigare read-modify-write-koden fick när den
-- PATCHade ett avrundat flyttal till kolumnen. En ren `integer`-parameter
-- hade avvisat ett fraktionerat delta direkt vid RPC-anropet (PostgREST
-- binder parametervärden mot funktionens deklarerade typ, ingen implicit
-- numeric→integer-cast sker där — bara vid kolumntilldelning).
CREATE OR REPLACE FUNCTION justera_agent_planbok(
  p_agent               text,
  p_saldo_delta         numeric DEFAULT 0,
  p_saldo_spel_delta    numeric DEFAULT 0,
  p_totalt_givet_delta  integer DEFAULT 0,
  p_totalt_fatt_delta   integer DEFAULT 0,
  p_antal_spel_delta    integer DEFAULT 0,
  p_golv_noll           boolean DEFAULT true
)
RETURNS TABLE (
  agent         text,
  saldo         integer,
  saldo_spel    integer,
  totalt_givet  integer,
  totalt_fatt   integer,
  antal_spel    integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
  RETURNING ap.agent, ap.saldo, ap.saldo_spel, ap.totalt_givet, ap.totalt_fatt, ap.antal_spel;
END;
$$;

-- Matchar tabellens RLS (skrivning kräver service role) — anon får aldrig
-- exekvera funktionen, bara den skyddade service-role-nyckeln.
REVOKE ALL ON FUNCTION justera_agent_planbok(text, numeric, numeric, integer, integer, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION justera_agent_planbok(text, numeric, numeric, integer, integer, integer, boolean) TO service_role;
