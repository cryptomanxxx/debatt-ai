-- qa_snapshots_v2: lägger till screenshot_b64 för visuell historik
-- Kör i Supabase SQL Editor

ALTER TABLE qa_snapshots
  ADD COLUMN IF NOT EXISTS screenshot_b64 text;
