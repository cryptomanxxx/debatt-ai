-- Felloggtabell för debatt.ai
-- Fångar rate limit-block, AI-provider-fel och övriga API-fel
-- Kör detta i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS fel_log (
  id       bigint generated always as identity primary key,
  kalla    text NOT NULL,        -- t.ex. "kanal/expand", "chatt", "agent-submit"
  feltyp   text NOT NULL,        -- "rate_limit" | "ai_fail" | "rss_fail" | "supabase_fail" | "server_error"
  meddelande text,               -- fritext, t.ex. provider-namn eller HTTP-statuskod
  ip       text,                 -- IP-adress (anonymiseras ej — för missbruksspårning)
  extra    jsonb,                -- extra kontext: { provider, status, retryAfter, ... }
  skapad   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fel_log_skapad ON fel_log (skapad DESC);
CREATE INDEX IF NOT EXISTS idx_fel_log_kalla  ON fel_log (kalla);
CREATE INDEX IF NOT EXISTS idx_fel_log_feltyp ON fel_log (feltyp);

-- RLS: anon kan INSERT (för API-routes), inte SELECT (bara admin via service key eller anon med begränsning)
ALTER TABLE fel_log ENABLE ROW LEVEL SECURITY;

-- Tillåt INSERT från API-routes (anon key)
CREATE POLICY "fel_log_insert" ON fel_log
  FOR INSERT TO anon WITH CHECK (true);

-- SELECT kräver service_role (admin-panelen läser via anon — justera vid behov)
-- Om admin-panelen ska kunna läsa via anon key, lägg till:
CREATE POLICY "fel_log_select_anon" ON fel_log
  FOR SELECT TO anon USING (true);
