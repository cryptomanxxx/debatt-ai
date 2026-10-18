-- RLS-härdning av inlamningar och skrivskydd för artiklar (✅154)
--
-- KÖR FÖRST NÄR KODEN ÄR DRIFTSATT. Före den här ändringen skrev webbläsaren
-- direkt till inlamningar/artiklar med den publika anon-nyckeln. Körs SQL:en
-- innan den nya koden är ute slutar inlämning och adminpanelens inkorg att
-- fungera tills deployen är klar.
--
-- Vad den gör:
--   inlamningar: RLS på, inga policies för anon. Opublicerade texter och
--                författarnamn kan bara läsas/skrivas med service role
--                (/api/skicka-in, /api/skicka-in/publicera,
--                /api/admin/inlamningar, /api/agent/submit, /redaktion).
--   artiklar:    publik läsning behålls. anon förlorar INSERT/UPDATE/DELETE,
--                så ingen kan publicera förbi AI-redaktören.
--
-- Ingen data raderas. Kontrollfrågor finns längst ned.

-- ── inlamningar ─────────────────────────────────────────────────────────────
alter table inlamningar enable row level security;

do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'inlamningar' loop
    execute format('drop policy if exists %I on public.inlamningar', p.policyname);
  end loop;
end $$;

revoke all on inlamningar from anon, authenticated;
grant select, insert, update, delete on inlamningar to service_role;

-- ── artiklar ────────────────────────────────────────────────────────────────
alter table artiklar enable row level security;

-- Ta bort alla policies som tillåter något annat än läsning (inkl. "ALL",
-- som även täcker läsning — därför skapas läspolicyn på nytt nedan).
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'artiklar'
             and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL') loop
    execute format('drop policy if exists %I on public.artiklar', p.policyname);
  end loop;
end $$;

drop policy if exists "Publik läsning artiklar" on artiklar;
create policy "Publik läsning artiklar" on artiklar for select using (true);

revoke insert, update, delete on artiklar from anon, authenticated;
grant select on artiklar to anon;
grant select, insert, update, delete on artiklar to service_role;

-- Sekvenserna behöver service role för INSERT (id-kolumnerna).
grant usage, select on all sequences in schema public to service_role;

-- ── Kontroll (kör efteråt) ──────────────────────────────────────────────────
-- select relname, relrowsecurity from pg_class where relname in ('inlamningar','artiklar');
-- select tablename, policyname, cmd, roles from pg_policies where tablename in ('inlamningar','artiklar');
-- select table_name, privilege_type from information_schema.role_table_grants
--  where grantee = 'anon' and table_name in ('inlamningar','artiklar') order by 1,2;
-- Förväntat: RLS på båda, en SELECT-policy på artiklar, ingen på inlamningar,
-- och anon har bara SELECT på artiklar.
