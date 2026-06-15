-- Handelsavgifter för kryptobörsen
-- Kör detta i Supabase SQL Editor.

-- 1. Lägg till avgift-kolumn på bors_affarer
alter table bors_affarer add column if not exists avgift numeric not null default 0;

-- 2. Skapa Börskassan-rad i agent_planbocker (samlar handelsavgifter)
insert into agent_planbocker (agent, saldo, totalt_givet, totalt_fatt, antal_spel, saldo_spel, uppdaterad)
values ('Börskassan', 0, 0, 0, 0, 0, now())
on conflict (agent) do nothing;
