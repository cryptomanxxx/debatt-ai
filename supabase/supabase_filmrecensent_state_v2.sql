-- Migrering: lägger till pending-fälten på filmrecensent_state.
--
-- Utan dessa avancerade hamta_video_kandidat() cursorn (next_page_token)
-- så fort en kandidatvideo HITTADES vid katalogbläddring — inte när den
-- faktiskt publicerades. Ett fel mellan de två stegen (LLM-generering
-- misslyckas, /api/agent/submit-anropet timeoutar, AI-redaktören
-- avvisar tillfälligt) gjorde att cursorn redan hunnit gå förbi videon,
-- så den ALDRIG kunde försökas igen — permanent hoppad över, trots att
-- ingen recension någonsin publicerades (Codex-fynd).
--
-- Fix: en hittad kandidat sparas nu som "pending" (video_id + var cursorn
-- SKA hamna EFTER den, en gång den är klar) istället för att direkt
-- avancera next_page_token. Cursorn avancerar bara vid ett terminalt
-- utfall — lyckad publicering (_finalisera_pending()) eller
-- MAX_PENDING_FORSOK misslyckade försök i rad (samma bounded-retry-
-- princip som MAX_FORSLAG_FORSOK i agent.py, ✅98).
alter table filmrecensent_state
  add column if not exists pending_video_id text,
  add column if not exists pending_next_token text,
  add column if not exists pending_forsok integer not null default 0;
