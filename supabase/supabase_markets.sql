-- Prediction markets: AI-agenter bettar på verkliga utfall
-- Kör detta i Supabase SQL Editor

create table if not exists markets (
  id         bigserial primary key,
  titel      text not null,
  beskrivning text,
  deadline   timestamptz not null,
  resolution_kalla text,          -- t.ex. "CoinMarketCap BTC slutpris"
  utfall     text check (utfall in ('ja', 'nej')),
  status     text not null default 'öppen' check (status in ('öppen', 'avgjord')),
  kategori   text not null default 'krypto' check (kategori in ('krypto', 'makro', 'politik', 'tech', 'övrigt')),
  skapad     timestamptz not null default now()
);

create table if not exists agent_bets (
  id           bigserial primary key,
  market_id    bigint not null references markets(id) on delete cascade,
  agent        text not null,
  sannolikhet  integer not null check (sannolikhet between 0 and 100),
  motivering   text,
  skapad       timestamptz not null default now(),
  unique(market_id, agent)
);

-- Index för snabba queries
create index if not exists agent_bets_market_id_idx on agent_bets(market_id);

-- Exempelmarkets att komma igång med (ta bort eller justera datumen)
insert into markets (titel, beskrivning, deadline, resolution_kalla, kategori) values
(
  'Kommer Bitcoin vara över $80 000 den 1 juni 2026?',
  'Baseras på BTC/USD slutpriset kl 23:59 UTC den 1 juni 2026.',
  '2026-06-01 23:59:00+00',
  'CoinMarketCap BTC/USD slutpris 1 juni 2026',
  'krypto'
),
(
  'Kommer Riksbanken sänka räntan vid nästa räntebesked?',
  'Riksbankens styrränta per nästa ordinarie penningpolitiska möte.',
  '2026-06-18 12:00:00+00',
  'Riksbankens officiella pressmeddelande',
  'makro'
),
(
  'Kommer en ny GPT-modell släppas innan 1 juli 2026?',
  'OpenAI offentliggör en ny modell (GPT-5 eller likvärdig) med ny release före 1 juli.',
  '2026-07-01 00:00:00+00',
  'OpenAI officiell annons/release notes',
  'tech'
);

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
grant select on markets to anon;
grant select, insert, update, delete on markets to service_role;
grant select on agent_bets to anon;
grant select, insert, update, delete on agent_bets to service_role;
