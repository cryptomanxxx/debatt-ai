-- Handelsimperium: Handelsspel för besökare och AI-agenter
-- Kör detta i Supabase SQL Editor

CREATE TABLE IF NOT EXISTS handel_städer (
  id   bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  namn text   NOT NULL UNIQUE,
  svg_x int  NOT NULL,
  svg_y int  NOT NULL
);

CREATE TABLE IF NOT EXISTS handel_varor (
  id   bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  namn text   NOT NULL UNIQUE,
  ikon text   NOT NULL
);

CREATE TABLE IF NOT EXISTS handel_priser (
  id        bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  stad_id   bigint REFERENCES handel_städer(id) ON DELETE CASCADE,
  vara_id   bigint REFERENCES handel_varor(id)  ON DELETE CASCADE,
  kop_pris  int    NOT NULL,
  salj_pris int    NOT NULL,
  uppdaterad timestamptz DEFAULT now(),
  UNIQUE(stad_id, vara_id)
);

CREATE TABLE IF NOT EXISTS handel_spelare (
  id          bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  smeknamn    text   NOT NULL UNIQUE,
  mynt        int    NOT NULL DEFAULT 1000,
  stad_id     bigint REFERENCES handel_städer(id),
  last_vara_id bigint REFERENCES handel_varor(id),
  last_mangd  int    NOT NULL DEFAULT 0,
  spelare_typ text   NOT NULL DEFAULT 'besokare' CHECK (spelare_typ IN ('besokare','agent')),
  skapad      timestamptz DEFAULT now(),
  uppdaterad  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS handel_logg (
  id          bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  spelare_id  bigint REFERENCES handel_spelare(id) ON DELETE CASCADE,
  typ         text   NOT NULL CHECK (typ IN ('resa','kop','salj','registrering')),
  beskrivning text   NOT NULL,
  mynt_delta  int    NOT NULL DEFAULT 0,
  skapad      timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE handel_städer  ENABLE ROW LEVEL SECURITY;
ALTER TABLE handel_varor   ENABLE ROW LEVEL SECURITY;
ALTER TABLE handel_priser  ENABLE ROW LEVEL SECURITY;
ALTER TABLE handel_spelare ENABLE ROW LEVEL SECURITY;
ALTER TABLE handel_logg    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read handel_städer"  ON handel_städer  FOR SELECT USING (true);
CREATE POLICY "public read handel_varor"   ON handel_varor   FOR SELECT USING (true);
CREATE POLICY "public read handel_priser"  ON handel_priser  FOR SELECT USING (true);
CREATE POLICY "public read handel_spelare" ON handel_spelare FOR SELECT USING (true);
CREATE POLICY "public read handel_logg"    ON handel_logg    FOR SELECT USING (true);

CREATE POLICY "public insert handel_spelare" ON handel_spelare FOR INSERT WITH CHECK (true);
CREATE POLICY "public update handel_spelare" ON handel_spelare FOR UPDATE USING (true);
CREATE POLICY "public insert handel_logg"    ON handel_logg    FOR INSERT WITH CHECK (true);
CREATE POLICY "public update handel_priser"  ON handel_priser  FOR UPDATE USING (true);

-- Seed: städer (SVG-koordinater i 340×520-rymd)
INSERT INTO handel_städer (namn, svg_x, svg_y) VALUES
  ('Kiruna',     195,  48),
  ('Umeå',       238, 158),
  ('Sundsvall',  232, 222),
  ('Stockholm',  262, 312),
  ('Visby',      288, 348),
  ('Linköping',  238, 362),
  ('Göteborg',   164, 422),
  ('Malmö',      192, 492);

-- Seed: varor
INSERT INTO handel_varor (namn, ikon) VALUES
  ('Fisk',     '🐟'),
  ('Trä',      '🪵'),
  ('Järn',     '⚙️'),
  ('Spannmål', '🌾'),
  ('Tyg',      '🧵'),
  ('Kryddor',  '🌶️');

-- Seed: priser (kop_pris / salj_pris per stad och vara)
-- Kiruna:    billigt järn, dyrt spannmål/tyg
-- Umeå:      billig fisk och trä
-- Sundsvall: billigt trä
-- Stockholm: mellanklass, billiga kryddor relativt
-- Visby:     billigt tyg och spannmål
-- Linköping: billigt spannmål
-- Göteborg:  billig fisk, dyra kryddor
-- Malmö:     billigt spannmål och tyg
WITH pd (sn, vn, k, s) AS (VALUES
  ('Kiruna','Fisk',     18, 23), ('Kiruna','Trä',      22, 27), ('Kiruna','Järn',     12, 16),
  ('Kiruna','Spannmål', 30, 36), ('Kiruna','Tyg',      40, 48), ('Kiruna','Kryddor',  72, 85),

  ('Umeå','Fisk',       10, 14), ('Umeå','Trä',        14, 18), ('Umeå','Järn',       38, 44),
  ('Umeå','Spannmål',   24, 29), ('Umeå','Tyg',        38, 44), ('Umeå','Kryddor',    65, 75),

  ('Sundsvall','Fisk',  11, 15), ('Sundsvall','Trä',   15, 19), ('Sundsvall','Järn',  35, 41),
  ('Sundsvall','Spannmål',22,27),('Sundsvall','Tyg',   36, 42), ('Sundsvall','Kryddor',60,70),

  ('Stockholm','Fisk',  20, 25), ('Stockholm','Trä',   28, 33), ('Stockholm','Järn',  42, 48),
  ('Stockholm','Spannmål',18,22),('Stockholm','Tyg',   34, 40), ('Stockholm','Kryddor',52,62),

  ('Visby','Fisk',      14, 18), ('Visby','Trä',       30, 36), ('Visby','Järn',      45, 52),
  ('Visby','Spannmål',  16, 20), ('Visby','Tyg',       20, 25), ('Visby','Kryddor',   55, 64),

  ('Linköping','Fisk',  22, 27), ('Linköping','Trä',   26, 31), ('Linköping','Järn',  40, 46),
  ('Linköping','Spannmål',10,13),('Linköping','Tyg',   32, 38), ('Linköping','Kryddor',58,67),

  ('Göteborg','Fisk',    8, 11), ('Göteborg','Trä',    25, 30), ('Göteborg','Järn',   44, 50),
  ('Göteborg','Spannmål',20,24), ('Göteborg','Tyg',    36, 42), ('Göteborg','Kryddor',80,92),

  ('Malmö','Fisk',      16, 20), ('Malmö','Trä',       24, 29), ('Malmö','Järn',      43, 49),
  ('Malmö','Spannmål',   9, 12), ('Malmö','Tyg',       22, 27), ('Malmö','Kryddor',   75, 86)
)
INSERT INTO handel_priser (stad_id, vara_id, kop_pris, salj_pris)
SELECT s.id, v.id, pd.k, pd.s
FROM pd
JOIN handel_städer s ON s.namn = pd.sn
JOIN handel_varor  v ON v.namn = pd.vn;
