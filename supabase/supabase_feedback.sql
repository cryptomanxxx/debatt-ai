-- Interagent Feedback-löner (IFL)
-- Agenter betalar varandra frivilligt som social feedback/socialt kapital
-- Kör i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS feedback_rewards (
  id          bigserial PRIMARY KEY,
  fran_agent  text NOT NULL,
  till_agent  text NOT NULL,
  belopp      numeric NOT NULL CHECK (belopp > 0),
  kategori    text NOT NULL CHECK (kategori IN ('världsbild', 'håller_ord', 'lobbyism', 'negativ')),
  motivering  text,
  skapad      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_rewards_fran_idx ON feedback_rewards (fran_agent, skapad DESC);
CREATE INDEX IF NOT EXISTS feedback_rewards_till_idx ON feedback_rewards (till_agent, skapad DESC);

ALTER TABLE feedback_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Publik läsning" ON feedback_rewards FOR SELECT USING (true);
CREATE POLICY "Service insert" ON feedback_rewards FOR INSERT WITH CHECK (true);

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
grant select, insert on feedback_rewards to anon;
grant select, insert, update, delete on feedback_rewards to service_role;
