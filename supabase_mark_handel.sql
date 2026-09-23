-- supabase_mark_handel.sql
-- Varuproduktion och handel: agenter producerar varor från sina zoner och säljer till varandra.
-- Kör i Supabase SQL Editor.

-- Agenternas varulager (vad varje agent har producerat)
CREATE TABLE IF NOT EXISTS mark_lager (
  id        bigint generated always as identity primary key,
  agent     text not null,
  vara      text not null,  -- el, spannmål, maskiner, malm, tjänster, fisk, virke
  antal     integer not null default 0,
  uppdaterad timestamptz not null default now(),
  UNIQUE(agent, vara)
);

-- Handelstransaktioner mellan agenter
CREATE TABLE IF NOT EXISTS mark_handel_log (
  id             bigint generated always as identity primary key,
  kop_agent      text not null,
  salj_agent     text not null,
  vara           text not null,
  antal          integer not null,
  pris_per_enhet numeric(8,2) not null,
  totalt         numeric(8,2) not null,
  skapad         timestamptz not null default now()
);

-- Index
CREATE INDEX IF NOT EXISTS mark_lager_agent_idx ON mark_lager (agent);
CREATE INDEX IF NOT EXISTS mark_handel_log_tid_idx ON mark_handel_log (skapad DESC);

-- RLS
ALTER TABLE mark_lager ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning mark_lager"    ON mark_lager FOR SELECT USING (true);
CREATE POLICY "Service insert mark_lager"    ON mark_lager FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update mark_lager"    ON mark_lager FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE mark_handel_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning mark_handel_log" ON mark_handel_log FOR SELECT USING (true);
CREATE POLICY "Service insert mark_handel_log" ON mark_handel_log FOR INSERT WITH CHECK (true);

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
grant select, insert, update on mark_lager to anon;
grant select, insert, update, delete on mark_lager to service_role;
grant select, insert on mark_handel_log to anon;
grant select, insert, update, delete on mark_handel_log to service_role;
