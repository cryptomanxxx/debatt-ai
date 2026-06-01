-- === MARK: Territoriell ekonomi i AI-civilisationen ===
-- Kör detta i Supabase SQL Editor
-- OBS: Befintlig data? Kör supabase_mark_v2.sql för att uppdatera veckoinkomst.

CREATE TABLE mark_zoner (
  id bigserial PRIMARY KEY,
  namn text NOT NULL,
  typ text NOT NULL CHECK (typ IN ('energi','jordbruk','industri','gruva','stad','kust','skog')),
  hex_col integer NOT NULL,
  hex_row integer NOT NULL,
  veckoinkomst integer NOT NULL,
  koppris integer NOT NULL,
  beskrivning text,
  skapad timestamptz DEFAULT now()
);

CREATE TABLE mark_agare (
  id bigserial PRIMARY KEY,
  zon_id bigint REFERENCES mark_zoner(id) ON DELETE CASCADE,
  agent text NOT NULL,
  kopt_pris integer NOT NULL,
  kopt_datum timestamptz DEFAULT now(),
  UNIQUE(zon_id)
);

CREATE TABLE mark_transaktioner (
  id bigserial PRIMARY KEY,
  zon_id bigint REFERENCES mark_zoner(id),
  zon_namn text NOT NULL,
  kop_agent text NOT NULL,
  salj_agent text,
  pris integer NOT NULL,
  skapad timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE mark_zoner ENABLE ROW LEVEL SECURITY;
ALTER TABLE mark_agare ENABLE ROW LEVEL SECURITY;
ALTER TABLE mark_transaktioner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Publik läsning mark_zoner" ON mark_zoner FOR SELECT USING (true);
CREATE POLICY "Publik insert mark_zoner" ON mark_zoner FOR INSERT WITH CHECK (true);
CREATE POLICY "Publik update mark_zoner" ON mark_zoner FOR UPDATE USING (true);

CREATE POLICY "Publik läsning mark_agare" ON mark_agare FOR SELECT USING (true);
CREATE POLICY "Publik insert mark_agare" ON mark_agare FOR INSERT WITH CHECK (true);
CREATE POLICY "Publik update mark_agare" ON mark_agare FOR UPDATE USING (true);
CREATE POLICY "Publik delete mark_agare" ON mark_agare FOR DELETE USING (true);

CREATE POLICY "Publik läsning mark_transaktioner" ON mark_transaktioner FOR SELECT USING (true);
CREATE POLICY "Publik insert mark_transaktioner" ON mark_transaktioner FOR INSERT WITH CHECK (true);

-- === 35 ZONER — yield-kurva 10-20% (differentierad efter typ) ===
-- Daglig inkomst = veckoinkomst / 7 (betalas ut av mark_test.py)
INSERT INTO mark_zoner (namn, typ, hex_col, hex_row, veckoinkomst, koppris, beskrivning) VALUES
-- Row 0 (cols 1-4) — Skog 10%, Gruva 17-18%, Energi 15%
('Nordskogen',          'skog',     1, 0,  80,  800, 'Tät barrskog i norr, levererar timmer och syre'),
('Järngruvan',          'gruva',    2, 0, 320, 1800, 'Rik järnmalmsgruva, ryggraden i stålindustrin'),
('Koppargruvan',        'gruva',    3, 0, 270, 1600, 'Historisk koppargruva med djupa schakt'),
('Vindkraftpark Nord',  'energi',   4, 0, 195, 1300, 'Stormigt höjdläge, optimal för vindkraft'),
-- Row 1 (cols 0-4) — Skog 10%, Stad 14%, Gruva 18-20%, Skog 10%
('Gränsskogen',         'skog',     0, 1,  70,  700, 'Vildmark vid gränsen, rik biodiversitet'),
('Gruvstaden',          'stad',     1, 1, 155, 1100, 'Stad byggd kring gruvnäringen, råbarkad kultur'),
('Sällsynta Metaller',  'gruva',    2, 1, 440, 2200, 'Kritiska mineraler för batterier och elektronik'),
('Kolgruvan',           'gruva',    3, 1, 250, 1400, 'Kontroversiell kolgruva — hög inkomst, hög kostnad'),
('Bergsplatån',         'skog',     4, 1,  85,  850, 'Kuperat skogslandskap, svårtillgängligt'),
-- Row 2 (cols 0-5) — Industri 15-19%, Stad 15-17%, Energi 15%
('Industrihamnen',      'industri', 0, 2, 220, 1450, 'Stor industrihamn med containerterminal'),
('Stålverket',          'industri', 1, 2, 265, 1600, 'Tung metallindustri, slukar energi men ger avkastning'),
('Universitetsstad',    'stad',     2, 2, 190, 1250, 'Kunskapsnav med forskning och innovation'),
('Storstaden',          'stad',     3, 2, 305, 1800, 'Landets folkrikaste stad, service och finans'),
('Teknologipark',       'industri', 4, 2, 320, 1800, 'Kluster av tech-bolag och startups'),
('Solpark Öst',         'energi',   5, 2, 205, 1350, 'Storskalig solcellspark, ren och lönsam'),
-- Row 3 (cols 0-5) — Kust 12-13%, Stad 14-15%, Industri 19%, Energi 20%
('Djuphamnen',          'kust',     0, 3, 155, 1200, 'Naturlig djuphamn för storfartyg'),
('Handelsstaden',       'stad',     1, 3, 215, 1400, 'Historiskt handelscentrum, högt i tak'),
('Kulturcentrum',       'stad',     2, 3, 170, 1200, 'Museer, teatrar och kreativa industrier'),
('Datacenterparken',    'industri', 3, 3, 380, 2000, 'Kylda serverhallar, extremt lönsam digital infrastruktur'),
('Kärnkraftspark',      'energi',   4, 3, 480, 2400, 'Kontroversiell men extremt lönsam kraftkälla (20% yield)'),
('Solpark Väst',        'energi',   5, 3, 190, 1250, 'Solpaneler längs sluttningen, stabila intäkter'),
-- Row 4 (cols 0-5) — Kust 12%, Jordbruk 10-11%, Industri 16%, Energi 14%, Kust 14%
('Fiskerihamnen',       'kust',     0, 4, 120, 1000, 'Traditionell fiskehamn, kamp mot överfisket'),
('Bördiga Dalen',       'jordbruk', 1, 4, 100,  950, 'Bördig dalgång, idealisk för spannmål'),
('Jordbruksslätten',    'jordbruk', 2, 4, 115, 1050, 'Vidsträckt odlingsmark, kornkammare'),
('Bilfabriken',         'industri', 3, 4, 240, 1500, 'Fordonsindustri i pågående strukturomvandling'),
('Vindkraftpark Syd',   'energi',   4, 4, 165, 1150, 'Kustnära vindkraft, konstant havsbris'),
('Havsenergi',          'kust',     5, 4, 200, 1400, 'Experimentell vågkraft och havsbaserad vindkraft'),
-- Row 5 (cols 0-4) — Kust 12%, Jordbruk 10%, Industri 17%, Kust 12%
('Turistkust',          'kust',     0, 5, 140, 1100, 'Populärt turistmål, sommarsäsong exploderar'),
('Betesmark',           'jordbruk', 1, 5,  75,  750, 'Extensiv djurhållning, fritt böljande marker'),
('Fruktodlingar',       'jordbruk', 2, 5,  90,  850, 'Äpplen och bär, ekologiskt certifierat'),
('Läkemedelsindustrin', 'industri', 3, 5, 290, 1700, 'Farmaceutisk produktion, patent-driven avkastning'),
('Marina',              'kust',     4, 5, 115,  950, 'Lyxmarina och seglarsällskap'),
-- Row 6 (cols 1-3) — Kust 13%, Skog 10%, Energi 14%
('Vattenverket',        'kust',     1, 6, 165, 1250, 'Kommunalt vattenreningsverk, naturmonopol'),
('Söderskogen',         'skog',     2, 6,  85,  850, 'Lövskog i söder, populärt strövområde'),
('Bioenergiverket',     'energi',   3, 6, 155, 1100, 'Biogasproduktion från jordbruksrester');
