-- Migrering: tre nya AI-genererade källkanaler för Filmrecensenten
-- (ägarbeslut, okt 2026): @Karloff_AI, @HistoryReforgedYT, @xyronth.
--
-- Alla tre postar egna AI-genererade koncept-/kortfilmer (ingen
-- existerande långfilm att identifiera), samma typ av material som
-- @RescueMechAnimals/@Meysamderees — så de klassificeras som
-- 'ai_genererat' och recenseras via generera_recension_ai_genererat()
-- (se supabase_filmrecensent_state_v5.sql och CLAUDE.md ✅123).
--
-- Raden skapas i förväg MED rätt klassificering, så den allra första
-- körningen som slumpmässigt väljer kanalen redan vet vilken
-- recensionsväg som gäller. Utan raden faller koden tillbaka på
-- fail-safe-defaulten 'riktig_film' (videor hoppas då oftast över, men
-- recenseras aldrig felaktigt som en riktig film). kanal_id lämnas tomt
-- — filmrecensent.py slår upp det ur handtaget vid första körningen och
-- cachar det (resolv_kanal_id()).
--
-- Kräver att v4 + v5 redan körts.
insert into filmrecensent_state (id, innehallstyp)
values
  ('@Karloff_AI', 'ai_genererat'),
  ('@HistoryReforgedYT', 'ai_genererat'),
  ('@xyronth', 'ai_genererat')
on conflict (id) do update set innehallstyp = excluded.innehallstyp;
