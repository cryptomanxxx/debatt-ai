-- AI call log table
-- Tracks every AI provider call from the backend routes
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ai_log (
  id          bigint       PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ts          timestamptz  NOT NULL DEFAULT now(),
  provider    text         NOT NULL, -- groq | gemini | openrouter | none
  model       text,
  source      text         NOT NULL, -- kanal | chatt
  status      text         NOT NULL, -- ok | error | timeout | rate_limited
  latency_ms  integer,
  input_tokens  integer,
  output_tokens integer
);

ALTER TABLE ai_log DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS ai_log_ts_idx             ON ai_log (ts DESC);
CREATE INDEX IF NOT EXISTS ai_log_provider_source_idx ON ai_log (provider, source, ts DESC);

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
grant select on ai_log to anon;
grant select, insert, update, delete on ai_log to service_role;
