-- Migrering: ny AI-genererad källkanal för Filmrecensenten
-- (ägarbeslut, nov 2026): @BabyNewsNetworkYT ("Baby News Network").
-- Kanalen postar en egen animerad AI-komediserie (satir med politiker som
-- bebisar) och klassificeras därför som 'ai_genererat' (recenseras via
-- generera_recension_ai_genererat()). kanal_id lämnas tomt — resolv_kanal_id()
-- slår upp och cachar det vid första körningen som väljer kanalen.
-- Kräver att v4 + v5 redan körts.
insert into filmrecensent_state (id, innehallstyp)
values ('@BabyNewsNetworkYT', 'ai_genererat')
on conflict (id) do update set innehallstyp = excluded.innehallstyp;
