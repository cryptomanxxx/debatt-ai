-- supabase_mark_v3.sql
-- Sänker de 6 billigaste zonerna till 350–550 kr för att fler agenter ska kunna köpa.
-- Inkomsten justeras proportionellt (~10% yield bibehålls).
-- Kör i Supabase SQL Editor.

-- Gränsskogen:    700 → 350 kr, veckoinkomst 70 → 35 (5 kr/dag)
UPDATE mark_zoner SET koppris = 350, veckoinkomst = 35 WHERE namn = 'Gränsskogen';

-- Nordskogen:     800 → 400 kr, veckoinkomst 80 → 40 (6 kr/dag)
UPDATE mark_zoner SET koppris = 400, veckoinkomst = 40 WHERE namn = 'Nordskogen';

-- Betesmark:      750 → 400 kr, veckoinkomst 75 → 40 (6 kr/dag)
UPDATE mark_zoner SET koppris = 400, veckoinkomst = 40 WHERE namn = 'Betesmark';

-- Bergsplatån:    850 → 500 kr, veckoinkomst 85 → 50 (7 kr/dag)
UPDATE mark_zoner SET koppris = 500, veckoinkomst = 50 WHERE namn = 'Bergsplatån';

-- Söderskogen:    850 → 500 kr, veckoinkomst 85 → 50 (7 kr/dag)
UPDATE mark_zoner SET koppris = 500, veckoinkomst = 50 WHERE namn = 'Söderskogen';

-- Fruktodlingar:  850 → 550 kr, veckoinkomst 90 → 55 (8 kr/dag)
UPDATE mark_zoner SET koppris = 550, veckoinkomst = 55 WHERE namn = 'Fruktodlingar';
