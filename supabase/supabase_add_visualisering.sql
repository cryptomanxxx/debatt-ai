-- Kör detta i Supabase → SQL Editor
-- Lägger till visualisering_id på artiklar-tabellen

alter table artiklar
  add column if not exists visualisering_id uuid references visualiseringar(id);
