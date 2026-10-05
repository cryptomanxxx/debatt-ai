-- Migrering: flera YouTube-kanaler för Filmrecensenten (ägarbeslut, okt 2026).
--
-- filmrecensent_state var hittills en enda rad (id='current') som höll
-- katalogbläddringens cursor för EN hårdkodad kanal (@BoxofficeMoviesScenes).
-- Filmrecensenten bevakar nu flera kanaler (se filmrecensent.py → KANALER) —
-- varje kanal behöver sin EGEN cursor/pending-state, så tabellens id-kolumn
-- (redan fri text, ingen schemaändring krävs för själva nyckeln) används nu
-- som kanalens handtag (t.ex. '@BoxofficeMoviesScenes') istället för den
-- fasta strängen 'current'.
--
-- Två saker krävs:
-- 1. En ny kanal_id-kolumn som cachar det numeriska YouTube-kanal-ID:t
--    (UC...) som filmrecensent.py → resolv_kanal_id() slår upp dynamiskt
--    ur handtaget (via YouTube Data API:s channels.list?forHandle=, med
--    sidscrapning som fallback) — ingen kanal-ID behöver vara känt i
--    förväg eller hårdkodas i Python längre.
-- 2. Den BEFINTLIGA produktionsraden (id='current') döps om till
--    '@BoxofficeMoviesScenes' så dess redan ackumulerade bläddringsframsteg
--    (next_page_token, ett eventuellt pending-tillstånd) bevaras exakt —
--    och backfylls med dess redan kända kanal-ID direkt i SQL:en nedan
--    (samma värde som redan stod hårdkodat i filmrecensent.py sedan ✅123),
--    så Python slipper slå upp det på nytt vid nästa körning.
alter table filmrecensent_state
  add column if not exists kanal_id text;

update filmrecensent_state
  set id = '@BoxofficeMoviesScenes',
      kanal_id = 'UCfk4Df9QxO267wlFbStSyAw'
  where id = 'current';

-- De två nya kanalerna (@RescueMechAnimals "Cine Drop", @Meysamderees
-- "Last Sumerian") behöver INGEN egen rad här — filmrecensent.py skapar
-- den lazy vid första körningen som väljer dem (samma mönster som den
-- ursprungliga 'current'-raden alltid skapades lazy).
