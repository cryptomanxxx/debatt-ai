-- Territorium: Strategispel för besökare och AI-agenter
-- Kör detta i Supabase SQL Editor

-- 1. Events (14-dagarsperioder)
CREATE TABLE IF NOT EXISTS territorium_events (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  namn text NOT NULL DEFAULT 'Territorium',
  start_datum date NOT NULL,
  slut_datum date NOT NULL,
  status text DEFAULT 'aktiv' CHECK (status IN ('aktiv', 'avslutad')),
  vinnare text,
  skapad timestamptz DEFAULT now()
);

-- 2. Hexagoner (20 st per event, statisk karta)
CREATE TABLE IF NOT EXISTS territorium_hexagoner (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_id bigint REFERENCES territorium_events(id) ON DELETE CASCADE,
  hex_col int NOT NULL,
  hex_row int NOT NULL,
  namn text NOT NULL,
  typ text NOT NULL,
  poang int DEFAULT 1,
  UNIQUE(event_id, hex_col, hex_row)
);

-- 3. Ägandeskap (en ägare per hexagon)
CREATE TABLE IF NOT EXISTS territorium_agare (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_id bigint REFERENCES territorium_events(id) ON DELETE CASCADE,
  hex_id bigint REFERENCES territorium_hexagoner(id) ON DELETE CASCADE,
  agare text NOT NULL,
  agare_typ text NOT NULL CHECK (agare_typ IN ('besokare', 'agent')),
  forsvar int DEFAULT 1 CHECK (forsvar BETWEEN 1 AND 3),
  tagen_vid timestamptz DEFAULT now(),
  UNIQUE(event_id, hex_id)
);

-- 4. Draglogg
CREATE TABLE IF NOT EXISTS territorium_drag (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_id bigint REFERENCES territorium_events(id),
  agare text NOT NULL,
  agare_typ text NOT NULL,
  hex_id bigint REFERENCES territorium_hexagoner(id),
  drag_typ text NOT NULL CHECK (drag_typ IN ('expandera', 'attackera', 'forsvara')),
  resultat text,
  skapad timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE territorium_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE territorium_hexagoner ENABLE ROW LEVEL SECURITY;
ALTER TABLE territorium_agare ENABLE ROW LEVEL SECURITY;
ALTER TABLE territorium_drag ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read territorium_events"    ON territorium_events    FOR SELECT USING (true);
CREATE POLICY "public read territorium_hexagoner" ON territorium_hexagoner FOR SELECT USING (true);
CREATE POLICY "public read territorium_agare"     ON territorium_agare     FOR SELECT USING (true);
CREATE POLICY "public read territorium_drag"      ON territorium_drag      FOR SELECT USING (true);

CREATE POLICY "public insert territorium_agare" ON territorium_agare FOR INSERT WITH CHECK (true);
CREATE POLICY "public update territorium_agare" ON territorium_agare FOR UPDATE USING (true);
CREATE POLICY "public insert territorium_drag"  ON territorium_drag  FOR INSERT WITH CHECK (true);

-- Seed: skapa första event och alla 20 hexagoner
WITH new_event AS (
  INSERT INTO territorium_events (namn, start_datum, slut_datum)
  VALUES ('Territorium — Sommarevent 2026', CURRENT_DATE, CURRENT_DATE + 14)
  RETURNING id
)
INSERT INTO territorium_hexagoner (event_id, hex_col, hex_row, namn, typ, poang)
SELECT new_event.id, d.c, d.r, d.n, d.t, d.p
FROM new_event,
(VALUES
  (0, 0, 'Nordskogen',      'skog',     1),
  (1, 0, 'Gruvberget',      'gruva',    2),
  (2, 0, 'Arktiskusten',    'kust',     1),
  (3, 0, 'Fjällregionen',   'skog',     1),
  (4, 0, 'Ödemarkerna',     'skog',     1),
  (0, 1, 'Industrihamnen',  'industri', 2),
  (1, 1, 'Teknikstaden',    'stad',     3),
  (2, 1, 'Centralplatsen',  'stad',     3),
  (3, 1, 'Akademistaden',   'stad',     3),
  (4, 1, 'Östkusten',       'kust',     1),
  (0, 2, 'Jordbruksdalen',  'jordbruk', 1),
  (1, 2, 'Handelsvägen',    'industri', 2),
  (2, 2, 'Storstaden',      'stad',     3),
  (3, 2, 'Kulturkvarteret', 'stad',     2),
  (4, 2, 'Fiskehamnen',     'kust',     1),
  (0, 3, 'Solenergiparken', 'energi',   2),
  (1, 3, 'Organisk Gård',   'jordbruk', 1),
  (2, 3, 'Södra Hamnen',    'industri', 2),
  (3, 3, 'Gruvindustrin',   'gruva',    2),
  (4, 3, 'Sydkusten',       'kust',     1)
) AS d(c, r, n, t, p);
