-- Migrering v2: aktiverar Row-Level Security på amnes_prenumeranter.
--
-- Tabellen innehåller riktiga e-postadresser och avprenumereringstoken.
-- Utan RLS kan vem som helst med den offentliga anon-nyckeln göra
-- GET .../rest/v1/amnes_prenumeranter?select=* och läsa ut alla
-- prenumeranters e-post och token, eller radera/manipulera raderna
-- (Supabase säkerhetslarm "rls_disabled_in_public", 12 jul 2026).
--
-- Ingen policy skapas för anon/authenticated — service role (som har
-- BYPASSRLS) är enda vägen in. Detta är medvetet: PostgREST/Postgres RLS
-- är radbaserad, inte kolumnbaserad — att tillåta anon SELECT på NÅGRA
-- rader hade exponerat email+token-kolumnerna på de raderna oavsett
-- filter. Publika API-routes (app/api/amne-prenumerera,
-- app/api/amne-avprenumerera, app/api/agent/submit) uppdaterades
-- samtidigt att använda SUPABASE_SERVICE_ROLE_KEY istället för
-- anon-nyckeln för läsning/skrivning mot denna tabell.
--
-- Kör i Supabase SQL Editor EFTER supabase_amnes_prenumeranter.sql.

ALTER TABLE amnes_prenumeranter ENABLE ROW LEVEL SECURITY;
