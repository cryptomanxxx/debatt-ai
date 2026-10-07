-- supabase_mark_v2.sql
-- Ny yield-kurva: bryter den flata 12-13%/vecka till differentierad 10-20%
-- Skog/jordbruk ~10% (passiva resurser), kust 12-14%, stad 14-17%,
-- industri 15-19%, energi 14-20%, gruva 16-20%
-- Kör i Supabase SQL Editor

-- Skog (10%)
UPDATE mark_zoner SET veckoinkomst = 80  WHERE namn = 'Nordskogen';
UPDATE mark_zoner SET veckoinkomst = 70  WHERE namn = 'Gränsskogen';
UPDATE mark_zoner SET veckoinkomst = 85  WHERE namn = 'Bergsplatån';
UPDATE mark_zoner SET veckoinkomst = 85  WHERE namn = 'Söderskogen';

-- Jordbruk (10-11%)
UPDATE mark_zoner SET veckoinkomst = 75  WHERE namn = 'Betesmark';           -- 10.0%
UPDATE mark_zoner SET veckoinkomst = 90  WHERE namn = 'Fruktodlingar';        -- 10.6%
UPDATE mark_zoner SET veckoinkomst = 100 WHERE namn = 'Bördiga Dalen';        -- 10.5%
UPDATE mark_zoner SET veckoinkomst = 115 WHERE namn = 'Jordbruksslätten';     -- 11.0%

-- Kust (12-14%)
UPDATE mark_zoner SET veckoinkomst = 115 WHERE namn = 'Marina';               -- 12.1%
UPDATE mark_zoner SET veckoinkomst = 120 WHERE namn = 'Fiskerihamnen';        -- 12.0%
UPDATE mark_zoner SET veckoinkomst = 140 WHERE namn = 'Turistkust';           -- 12.7%
UPDATE mark_zoner SET veckoinkomst = 155 WHERE namn = 'Djuphamnen';           -- 12.9%
UPDATE mark_zoner SET veckoinkomst = 165 WHERE namn = 'Vattenverket';         -- 13.2% (naturmonopol)
UPDATE mark_zoner SET veckoinkomst = 200 WHERE namn = 'Havsenergi';           -- 14.3% (experimentell)

-- Stad (14-17%)
UPDATE mark_zoner SET veckoinkomst = 155 WHERE namn = 'Gruvstaden';           -- 14.1%
UPDATE mark_zoner SET veckoinkomst = 170 WHERE namn = 'Kulturcentrum';        -- 14.2%
UPDATE mark_zoner SET veckoinkomst = 190 WHERE namn = 'Universitetsstad';     -- 15.2%
UPDATE mark_zoner SET veckoinkomst = 215 WHERE namn = 'Handelsstaden';        -- 15.4%
UPDATE mark_zoner SET veckoinkomst = 305 WHERE namn = 'Storstaden';           -- 16.9%

-- Industri (15-19%)
UPDATE mark_zoner SET veckoinkomst = 220 WHERE namn = 'Industrihamnen';       -- 15.2%
UPDATE mark_zoner SET veckoinkomst = 240 WHERE namn = 'Bilfabriken';          -- 16.0%
UPDATE mark_zoner SET veckoinkomst = 265 WHERE namn = 'Stålverket';           -- 16.6%
UPDATE mark_zoner SET veckoinkomst = 290 WHERE namn = 'Läkemedelsindustrin';  -- 17.1%
UPDATE mark_zoner SET veckoinkomst = 320 WHERE namn = 'Teknologipark';        -- 17.8%
UPDATE mark_zoner SET veckoinkomst = 380 WHERE namn = 'Datacenterparken';     -- 19.0%

-- Energi (14-20%)
UPDATE mark_zoner SET veckoinkomst = 155 WHERE namn = 'Bioenergiverket';      -- 14.1%
UPDATE mark_zoner SET veckoinkomst = 165 WHERE namn = 'Vindkraftpark Syd';    -- 14.3%
UPDATE mark_zoner SET veckoinkomst = 190 WHERE namn = 'Solpark Väst';         -- 15.2%
UPDATE mark_zoner SET veckoinkomst = 195 WHERE namn = 'Vindkraftpark Nord';   -- 15.0%
UPDATE mark_zoner SET veckoinkomst = 205 WHERE namn = 'Solpark Öst';          -- 15.2%
UPDATE mark_zoner SET veckoinkomst = 480 WHERE namn = 'Kärnkraftspark';       -- 20.0% exakt

-- Gruva (16-20%)
UPDATE mark_zoner SET veckoinkomst = 250 WHERE namn = 'Kolgruvan';            -- 17.9%
UPDATE mark_zoner SET veckoinkomst = 270 WHERE namn = 'Koppargruvan';         -- 16.9%
UPDATE mark_zoner SET veckoinkomst = 320 WHERE namn = 'Järngruvan';           -- 17.8%
UPDATE mark_zoner SET veckoinkomst = 440 WHERE namn = 'Sällsynta Metaller';   -- 20.0% exakt
