-- Statskassa: böter från AI-Domstolen samlas här och omfördelas som grundinkomst
-- Kör detta i Supabase SQL Editor

-- Lägg till Statskassa som en specialrad i agent_planbocker
INSERT INTO agent_planbocker (agent, saldo, totalt_givet, totalt_fatt, antal_spel, saldo_spel)
VALUES ('Statskassa', 0, 0, 0, 0, 0)
ON CONFLICT (agent) DO NOTHING;
