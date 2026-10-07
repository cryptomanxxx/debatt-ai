-- Rätta RLS-policies för oligarki_historik
-- Kör i Supabase SQL Editor
--
-- Problemet: de gamla policyerna gav anon-rollen (publik frontend-nyckel)
-- fri INSERT och UPDATE-access. service_role kringgår RLS automatiskt i
-- Supabase, så inga explicita policies behövs för backend-skript.

-- Ta bort de överdrivet tillåtande anon-policyerna
drop policy if exists "public insert oligarki_historik" on oligarki_historik;
drop policy if exists "public update oligarki_historik" on oligarki_historik;

-- Behåll (eller skapa) SELECT-policy för publik läsning
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'oligarki_historik'
      and policyname = 'public read oligarki_historik'
  ) then
    execute 'create policy "public read oligarki_historik"
      on oligarki_historik for select using (true)';
  end if;
end$$;
