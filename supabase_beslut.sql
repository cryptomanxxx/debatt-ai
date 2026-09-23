-- Decision API: API-nycklar och request-logg

-- API-nycklar för B2B-kunder
create table if not exists api_nycklar (
  id         bigserial primary key,
  key        text unique not null,
  name       text not null,
  rate_limit integer not null default 100,  -- requests per hour
  aktiv      boolean not null default true,
  skapad     timestamptz not null default now()
);

alter table api_nycklar enable row level security;

-- Bara service role kan läsa nycklar (aldrig anon)
create policy "Service kan läsa nycklar" on api_nycklar
  for select using (false);  -- blockeras för anon, service role bypasses RLS

-- Request-logg per API-anrop
create table if not exists beslut_log (
  id             bigserial primary key,
  api_key        text,       -- null = IP-baserat (fri tier)
  ip             text,
  question       text not null,
  agents_used    text[],
  recommendation text,
  probability    float,
  latency_ms     integer,
  skapad         timestamptz not null default now()
);

create index if not exists beslut_log_skapad     on beslut_log (skapad desc);
create index if not exists beslut_log_api_key    on beslut_log (api_key, skapad desc);

alter table beslut_log enable row level security;

-- API-routen loggar via service role
create policy "Service kan infoga logg" on beslut_log
  for insert with check (true);

-- Admin kan läsa loggar (via service role)
create policy "Service kan läsa logg" on beslut_log
  for select using (false);  -- blockeras för anon

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
grant select, insert, update, delete on api_nycklar to service_role;
grant insert on beslut_log to anon;
grant select, insert, update, delete on beslut_log to service_role;
