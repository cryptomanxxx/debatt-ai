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

-- Data API-grants (Supabase-krav från 30 okt 2026 — se CLAUDE.md): nya
-- tabeller i public-schemat behöver explicita GRANT-satser för att vara
-- nåbara via Data API (PostgREST/supabase-js) efter det datumet, annars
-- "permission denied" trots korrekta RLS-policies — Supabase slutar
-- auto-bevilja grundrättigheter på nya tabeller från och med då. GRANT
-- och RLS är två separata lager: GRANT avgör om ett anrop överhuvudtaget
-- tillåts nå tabellen, RLS-policies avgör sedan vilka RADER som är
-- synliga/skrivbara. anon beviljas här exakt de operationer som
-- tabellens egna RLS-policies redan tillåter (ingen ändring av
-- säkerhetsmodellen — bara att göra det GRANT auto-gav tidigare
-- explicit) — service_role beviljas alltid full CRUD, eftersom BYPASSRLS
-- bara kringgår radpolicies, inte detta grundläggande GRANT-lager.
-- Ingen grant till authenticated: plattformen har ingen Supabase Auth /
-- inloggade användare, så rollen är aldrig i bruk här.
grant select on invariant_checks to anon;
grant select, insert, update, delete on invariant_checks to service_role;
