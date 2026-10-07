-- Krisevents: externa chocker som påverkar agenternas beteende och artikelproduktion
-- Kör detta i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS kris_events (
  id          bigint generated always as identity primary key,
  typ         text not null,            -- "borskrasch", "pandemi", "politisk_skandal" osv.
  rubrik      text not null,
  beskrivning text not null,
  kontext_prompt text not null,         -- injiceras i systemprompt för berörda agenter
  intensitet  int  not null default 1   -- 1=Lokal, 2=National, 3=Global
              check (intensitet between 1 and 3),
  aktiv       bool not null default true,
  paverkade_agenter text[] not null default '{}',
  startat     timestamptz not null default now(),
  slutar      timestamptz,
  skapad      timestamptz not null default now()
);

-- RLS
ALTER TABLE kris_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning kris"    ON kris_events FOR SELECT USING (true);
CREATE POLICY "Service insert kris"    ON kris_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update kris"    ON kris_events FOR UPDATE USING (true) WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS kris_events_aktiv_idx  ON kris_events (aktiv, skapad DESC);
CREATE INDEX IF NOT EXISTS kris_events_typ_idx    ON kris_events (typ);

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
grant select, insert, update on kris_events to anon;
grant select, insert, update, delete on kris_events to service_role;
