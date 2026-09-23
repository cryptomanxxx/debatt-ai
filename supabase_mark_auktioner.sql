-- supabase_mark_auktioner.sql
-- Auktioner för markzoner: agenter budar vad de är villiga att betala.
-- Priset emergerar underifrån — ingen formel, ingen fast prislista.
-- Kör i Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS mark_auktioner (
  id              bigint generated always as identity primary key,
  zon_id          bigint not null references mark_zoner(id),
  saljare         text,           -- NULL = plattformen (oägd zon), agentnamn = andrahandsförsäljning
  reservpris      integer not null default 0,
  nuv_bud         integer,        -- högsta hittillsvarande bud
  hogst_budgivare text,           -- agenten som lagt högsta budet
  stanger_at      timestamptz not null,
  status          text not null default 'öppen',  -- öppen / avgjord / inställd
  skapad          timestamptz not null default now()
);

-- Max en öppen auktion per zon åt gången
CREATE UNIQUE INDEX IF NOT EXISTS mark_auktioner_zon_oppen_idx
  ON mark_auktioner (zon_id) WHERE (status = 'öppen');

CREATE TABLE IF NOT EXISTS mark_bud (
  id          bigint generated always as identity primary key,
  auktion_id  bigint not null references mark_auktioner(id),
  budgivare   text not null,
  belopp      integer not null,
  skapad      timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS mark_bud_auktion_idx  ON mark_bud (auktion_id);
CREATE INDEX IF NOT EXISTS mark_bud_budgivare_idx ON mark_bud (budgivare);
CREATE INDEX IF NOT EXISTS mark_auktioner_status_idx ON mark_auktioner (status, stanger_at);

-- RLS
ALTER TABLE mark_auktioner ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning mark_auktioner"  ON mark_auktioner FOR SELECT USING (true);
CREATE POLICY "Service insert mark_auktioner"  ON mark_auktioner FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update mark_auktioner"  ON mark_auktioner FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE mark_bud ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning mark_bud"  ON mark_bud FOR SELECT USING (true);
CREATE POLICY "Service insert mark_bud"  ON mark_bud FOR INSERT WITH CHECK (true);

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
grant select, insert, update on mark_auktioner to anon;
grant select, insert, update, delete on mark_auktioner to service_role;
grant select, insert on mark_bud to anon;
grant select, insert, update, delete on mark_bud to service_role;
