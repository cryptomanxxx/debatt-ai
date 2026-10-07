-- Likviditetsreserv för Börskassan
-- Kör detta i Supabase SQL Editor för att omedelbart öka börsens likviditet.
-- bors_test.py håller sedan saldot ≥ 100 000 kr automatiskt vid varje körning.

UPDATE agent_planbocker
SET    saldo      = 100000,
       uppdaterad = now()
WHERE  agent = 'Börskassan'
  AND  saldo < 100000;
