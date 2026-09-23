-- Orakelexperimentet: civilisationens hjärna som prediction market-rådgivare.
--
-- En rad per (market, arm). Arm 'a' = dagens fallback-kedja (Groq Llama m.fl.),
-- arm 'b' = Claude (anthropic_post i ai_klient.py). Båda armarna får identiskt
-- underlag och identisk prompt — skillnaden isolerar ren modellintelligens.
-- Kohorttilldelning (kontroll / orakel-a / orakel-b) är deterministisk i kod
-- (orakel_kohort i supabase_utils.py + app/lib/orakel.js) — ingen tabell behövs.
--
-- Kör i Supabase SQL Editor.

create table if not exists hjarna_rad (
  id           bigserial primary key,
  market_id    bigint not null references markets(id) on delete cascade,
  arm          text   not null check (arm in ('a', 'b')),
  sannolikhet  integer not null check (sannolikhet between 0 and 100),
  motivering   text,
  model        text,
  skapad       timestamptz default now(),
  unique (market_id, arm)
);

create index if not exists hjarna_rad_market_idx on hjarna_rad (market_id);

alter table hjarna_rad enable row level security;

drop policy if exists "hjarna_rad_public_select" on hjarna_rad;
create policy "hjarna_rad_public_select" on hjarna_rad
  for select using (true);

-- INSERT sker med SUPABASE_SERVICE_ROLE_KEY (kringgår RLS) — ingen
-- anon-INSERT-policy. Anon-nyckeln är publik i Next-appen och en öppen
-- policy skulle låta vem som helst pre-seeda (market_id, arm) och
-- permanent förgifta orakelbedömningen tack vare UNIQUE-constrainten.
drop policy if exists "hjarna_rad_anon_insert" on hjarna_rad;

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
grant select on hjarna_rad to anon;
grant select, insert, update, delete on hjarna_rad to service_role;
