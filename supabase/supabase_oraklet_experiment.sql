-- Kör en gång i Supabase SQL Editor före första manuella experimentet.
begin;
create table if not exists public.oraklet_experiment (
  id uuid primary key,
  titel text not null,
  status text not null check (status in ('passed', 'failed')),
  rapport jsonb not null check (jsonb_typeof(rapport) = 'object'),
  skapad timestamptz not null default now()
);
alter table public.oraklet_experiment enable row level security;
drop policy if exists public_read_oraklet_experiment on public.oraklet_experiment;
create policy public_read_oraklet_experiment on public.oraklet_experiment
  for select to anon using (true);
revoke all on public.oraklet_experiment from anon, authenticated;
grant select on public.oraklet_experiment to anon;
grant select, insert on public.oraklet_experiment to service_role;
create index if not exists oraklet_experiment_skapad_idx
  on public.oraklet_experiment (skapad desc);
commit;
