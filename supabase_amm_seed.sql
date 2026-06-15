-- AMM-seed: Ge Börskassan token-inventarie + startkapital för bids
-- Kör detta i Supabase SQL Editor (en gång).
-- Börskassan auto-fyller på sitt inventarie vid varje körning (AMM_REFILL_TROSKEL),
-- men denna fil ger en bra startpunkt och undviker en extra DB-tur vid första körningen.

-- 1. Ge Börskassan 50 tokens per noterad symbol
INSERT INTO bors_portfoljer (agent, symbol, antal, genomsnittspris, uppdaterad)
SELECT
  'Börskassan' AS agent,
  symbol,
  50            AS antal,
  senaste_pris  AS genomsnittspris,
  now()         AS uppdaterad
FROM bors_tillgangar
ON CONFLICT (agent, symbol) DO UPDATE
  SET antal      = GREATEST(bors_portfoljer.antal, 50),
      uppdaterad = now();

-- 2. Se till att Börskassan har minst 1 000 kr för bid-ordrar
UPDATE agent_planbocker
SET saldo      = GREATEST(saldo, 1000),
    uppdaterad = now()
WHERE agent = 'Börskassan';
