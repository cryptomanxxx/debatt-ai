-- Tabell för frågor till AI-agenter
create table if not exists agent_fragor (
  id        bigserial primary key,
  agent     text not null,
  fraga     text not null,
  svar      text not null,
  offentlig boolean not null default false,
  skapad    timestamptz not null default now()
);

create index if not exists agent_fragor_offentlig_skapad
  on agent_fragor (offentlig, skapad desc);

create index if not exists agent_fragor_agent_offentlig
  on agent_fragor (agent, offentlig, skapad desc);

alter table agent_fragor enable row level security;

-- Alla kan läsa offentliga frågor
create policy "Läs offentliga frågor" on agent_fragor
  for select using (offentlig = true);

-- API-routen infogar via service role — anon insert stängs av
-- (insert hanteras server-side med SUPABASE_SERVICE_KEY eller anon key)
create policy "Infoga frågor" on agent_fragor
  for insert with check (true);

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
grant select, insert on agent_fragor to anon;
grant select, insert, update, delete on agent_fragor to service_role;
