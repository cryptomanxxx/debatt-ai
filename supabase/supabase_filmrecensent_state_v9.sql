-- Migrering: ny AI-genererad källkanal för Filmrecensenten
-- (ägarbeslut, okt 2026): @KaiDrakOfficial ("NEXORA CINEMA — Original Sci-Fi Worlds").
-- Kanalen postar egna AI-genererade sci-fi-filmer och klassificeras därför
-- som 'ai_genererat' (recenseras via generera_recension_ai_genererat()).
-- kanal_id lämnas tomt — resolv_kanal_id() slår upp och cachar det vid
-- första körningen som väljer kanalen.
-- Kräver att v4 + v5 redan körts.
insert into filmrecensent_state (id, innehallstyp)
values ('@KaiDrakOfficial', 'ai_genererat')
on conflict (id) do update set innehallstyp = excluded.innehallstyp;
