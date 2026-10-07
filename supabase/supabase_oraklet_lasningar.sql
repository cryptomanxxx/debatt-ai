-- Loggar varje gång Professor Oraklet läser upp ett AI-forskningsfynd eller
-- en vetenskaplig nyhet på /universitet (se app/universitet/UniversitetVy.js).
-- Skrivs server-side i app/api/oraklet-lasning/route.js med service role
-- (RLS saknar anon-skrivpolicy, samma mönster som fraga_anna_peter_log) —
-- läsning sker via app/api/aktivitet/route.js för att visa uppläsningar i
-- Senaste aktivitet-feeden på startsidan.

create table if not exists oraklet_lasningar (
  id     bigserial primary key,
  typ    text not null check (typ in ('forskning', 'nyhet')),
  ref_id bigint,
  titel  text not null,
  skapad timestamptz not null default now()
);

create index if not exists oraklet_lasningar_skapad_idx on oraklet_lasningar (skapad desc);

alter table oraklet_lasningar enable row level security;

drop policy if exists "oraklet_lasningar_select" on oraklet_lasningar;
create policy "oraklet_lasningar_select" on oraklet_lasningar for select using (true);

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
grant select on oraklet_lasningar to anon;
grant select, insert, update, delete on oraklet_lasningar to service_role;
