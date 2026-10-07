-- qa_snapshots_v4: RLS-härdning — skrivning kräver service role.
-- Kör i Supabase SQL Editor.
--
-- Tidigare tillät policyerna "Service insert"/"Service update" (WITH CHECK
-- (true) / USING (true)) vem som helst med den publika anon-nyckeln att
-- skriva och skriva över QA-historiken, trots namnen. Enda skrivaren är
-- agents/qa-observer.js, som nu bara skriver med SUPABASE_SERVICE_ROLE_KEY
-- (service role kringgår RLS, så ingen skrivpolicy behövs).
--
-- Publik läsning behålls: /qa-tidslinje och /api/qa-tidslinje-gif läser
-- tabellen med anon-nyckeln.

drop policy if exists "Service insert" on qa_snapshots;
drop policy if exists "Service update" on qa_snapshots;
-- Eventuella "public full access"-policyer från den borttagna
-- supabase_rls_fix.sql (se CLAUDE.md, RLS-härdning).
drop policy if exists "pub ins qa_snapshots" on qa_snapshots;
drop policy if exists "pub upd qa_snapshots" on qa_snapshots;

alter table qa_snapshots enable row level security;

drop policy if exists "Publik läsning" on qa_snapshots;
create policy "Publik läsning" on qa_snapshots for select using (true);

-- Data API-grants: anon får bara läsa, service role allt.
revoke insert, update, delete on qa_snapshots from anon;
grant select on qa_snapshots to anon;
grant select, insert, update, delete on qa_snapshots to service_role;

-- Kontroll efteråt (ska bara visa "Publik läsning", cmd = SELECT):
-- select policyname, cmd from pg_policies where tablename = 'qa_snapshots';
