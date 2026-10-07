-- Migration v2: lägg till kalltyp på civilisation_log
-- Kör detta i Supabase SQL Editor om du redan kört supabase_civilisation_log.sql
ALTER TABLE civilisation_log ADD COLUMN IF NOT EXISTS kalltyp text DEFAULT 'besökare';
