-- Kör i Supabase SQL Editor
alter table artiklar add column if not exists forslag boolean default false;
