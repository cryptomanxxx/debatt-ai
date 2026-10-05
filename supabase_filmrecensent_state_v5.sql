-- Migrering: filmkategorisering — riktiga filmklipp vs AI-genererat
-- koncept-/kortfilmsinnehåll (ägarbeslut, okt 2026).
--
-- De två nya kanalerna (@RescueMechAnimals "Cine Drop",
-- @Meysamderees "Last Sumerian") postar, till skillnad från
-- @BoxofficeMoviesScenes, egna AI-genererade koncept-/kortfilmer — det
-- finns ingen existerande långfilm att identifiera klippet ur.
-- generera_recension()s regel ("gissa aldrig på en film du inte känner
-- igen") gjorde att Filmrecensenten ofta hoppade över dessa kanalers
-- videor helt utan att publicera något (dokumenterat som en känd
-- begränsning när kanalerna lades till, se CLAUDE.md ✅123 "Flera
-- källkanaler").
--
-- Ägaren avvisade den begränsningen explicit och krävde att
-- klassificeringen av VILKEN typ av innehåll en kanal postar ska vara
-- en kolumn i Supabase — inte hårdkodad i Python — så att den kan
-- ändras/utökas (fler kanaltyper, en kanal som byter karaktär) utan en
-- kodändring. filmrecensent.py läser innehallstyp per kanal och väljer
-- recensionsväg:
--   'riktig_film'  → generera_recension() — kräver en identifierad
--                    riktig, existerande film (oförändrad, strikt regel)
--   'ai_genererat' → generera_recension_ai_genererat() — recenserar
--                    videons EGET koncept/premiss (titel + beskrivning
--                    ÄR verket), kräver ingen extern identifiering
--
-- Fail-safe default: 'riktig_film'. Om kolumnen eller en kanalrad
-- saknas (migreringen inte körd än, eller en helt ny kanal utan
-- förinställd rad) antar koden att det är riktiga filmklipp — vilket i
-- värsta fall bara kan leda till att en video HOPPAS ÖVER (den
-- befintliga, säkra "gissa aldrig"-regeln i generera_recension()),
-- ALDRIG till att en AI-genererad kortfilm av misstag recenseras som
-- om den vore en riktig, existerande film.
alter table filmrecensent_state
  add column if not exists innehallstyp text not null default 'riktig_film';

alter table filmrecensent_state
  drop constraint if exists filmrecensent_state_innehallstyp_check;
alter table filmrecensent_state
  add constraint filmrecensent_state_innehallstyp_check
  check (innehallstyp in ('riktig_film', 'ai_genererat'));

-- Sätter typen explicit för alla tre redan kända kanaler. De två nya
-- saknar ännu en egen rad (skapas annars lazy vid första körningen, se
-- supabase_filmrecensent_state_v4.sql) — insert ... on conflict skapar
-- dem nu i förväg MED rätt klassificering, så den allra första
-- körningen för var och en redan vet vilken recensionsväg som gäller,
-- utan att behöva falla tillbaka på default-värdet.
insert into filmrecensent_state (id, innehallstyp)
values
  ('@BoxofficeMoviesScenes', 'riktig_film'),
  ('@RescueMechAnimals', 'ai_genererat'),
  ('@Meysamderees', 'ai_genererat')
on conflict (id) do update set innehallstyp = excluded.innehallstyp;
