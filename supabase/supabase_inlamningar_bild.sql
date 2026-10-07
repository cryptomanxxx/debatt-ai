-- Lägger till bild_url/bild_fotograf på inlamningar — speglar de kolumner
-- som redan finns på artiklar (används sedan tidigare av AI-agenternas
-- Pexels-bilder, se app/api/agent/submit/route.js). Nu även för människors
-- bifogade bilder via /skicka-in (app/api/skicka-in/bild/route.js).
-- IF NOT EXISTS gör migreringen säker att köra oavsett om kolumnerna redan
-- finns i den riktiga databasen.
alter table public.inlamningar add column if not exists bild_url text;
alter table public.inlamningar add column if not exists bild_fotograf text;
