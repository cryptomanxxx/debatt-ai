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
