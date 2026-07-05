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
