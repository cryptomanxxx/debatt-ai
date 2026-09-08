-- Invariant-checkaren (✅108) — kör i Supabase SQL Editor.
--
-- En rad per check per körning. `kord_at` grupperar alla checkar från samma
-- körning (samma tidsstämpel, satt en gång i skriptet innan loopen).
create table if not exists invariant_checks (
  id bigserial primary key,
  kord_at timestamptz not null,
  check_namn text not null,
  status text not null check (status in ('ok', 'fail', 'error')),
  detalj text,
  skapad timestamptz not null default now()
);

create index if not exists invariant_checks_namn_skapad_idx
  on invariant_checks (check_namn, skapad desc);

create index if not exists invariant_checks_kord_at_idx
  on invariant_checks (kord_at desc);

alter table invariant_checks enable row level security;

drop policy if exists "pub sel invariant_checks" on invariant_checks;
create policy "pub sel invariant_checks"
  on invariant_checks for select
  using (true);

-- Ingen anon-INSERT-policy — skrivning kräver service role, samma mönster
-- som övriga härdade tabeller (nyhetsflode, nyhetsanalys, oraklet_lasningar m.fl.).
