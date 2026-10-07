-- Logg över agenternas frågor till Civilisationens hjärna.
-- Möjliggör korrelationsanalys: frågefrekvens vs intelligens-proxies.
create table if not exists civilisation_fragor (
  id          bigserial primary key,
  agent       text        not null,
  fraga       text        not null,
  typ         text        not null default 'general',
  svar        text,
  latency_ms  integer,
  skapad      timestamptz not null default now()
);

create index if not exists civilisation_fragor_agent_idx
  on civilisation_fragor (agent, skapad desc);

create index if not exists civilisation_fragor_skapad_idx
  on civilisation_fragor (skapad desc);

alter table civilisation_fragor enable row level security;

create policy "Public read"
  on civilisation_fragor for select using (true);

create policy "Anon insert"
  on civilisation_fragor for insert with check (true);

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
grant select, insert on civilisation_fragor to anon;
grant select, insert, update, delete on civilisation_fragor to service_role;
