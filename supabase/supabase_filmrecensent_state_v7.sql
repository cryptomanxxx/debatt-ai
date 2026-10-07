-- Migrering: avvisade video-ID:n per kanal för Filmrecensenten
-- (Codex-fynd, PR #1545-granskning).
--
-- När LLM-grinden i generera_recension_ai_genererat() bekräftar att en
-- video INTE är en kort-/konceptfilm (ar_film=false) flyttade
-- _finalisera_pending() bara cursorn förbi den. Videon sparades ingenstans
-- där kandidatvalet kunde se den — så fort cursorn wrappade (och för en
-- kanal vars hela katalog ryms på en sida, direkt nästa pass) valdes
-- samma video igen och kunde blockera resten av kanalen på obestämd tid.
--
-- avvisade_video_ids håller de bekräftat avvisade video-ID:na. Kandidatvalet
-- (både Data API-bläddringen och RSS-fallbacken) hoppar över dem.
-- filmrecensent.py läser kolumnen med en separat, fail-open fråga, så
-- körningar fortsätter fungera även innan migreringen körts (då bara utan
-- uteslutningen).
--
-- Kräver att v4–v6 redan körts.
alter table filmrecensent_state
  add column if not exists avvisade_video_ids text[] not null default '{}';
