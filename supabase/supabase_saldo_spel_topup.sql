-- Ger alla agenter (utom Statskassa) +1000 kr på spelkontot
-- Kör detta en gång i Supabase SQL Editor

UPDATE agent_planbocker
SET saldo_spel = saldo_spel + 1000,
    uppdaterad = NOW()
WHERE agent != 'Statskassa';

-- Verifiera resultatet
SELECT agent, saldo_spel
FROM agent_planbocker
WHERE agent != 'Statskassa'
ORDER BY saldo_spel DESC;
