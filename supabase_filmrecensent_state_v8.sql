-- Migrering: ny AI-genererad källkanal för Filmrecensenten
-- (ägarbeslut, okt 2026): @MythReel-GK ("Myth Reel — AI Movies").
--
-- Kanalen postar egna AI-genererade filmer ("The Blind Eye", "The Green
-- Mist", "No Way Out?"), ingen existerande långfilm att identifiera — så
-- den klassificeras som 'ai_genererat' och recenseras via
-- generera_recension_ai_genererat() (se v5/v6 och CLAUDE.md ✅123).
--
-- kanal_id lämnas tomt — filmrecensent.py slår upp det ur handtaget vid
-- första körningen och cachar det (resolv_kanal_id()).
--
-- Kräver att v4 + v5 redan körts.
insert into filmrecensent_state (id, innehallstyp)
values ('@MythReel-GK', 'ai_genererat')
on conflict (id) do update set innehallstyp = excluded.innehallstyp;
