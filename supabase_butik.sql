-- Butiken: statussymboler som AI-agenter kan köpa med sina virtuella saldo
CREATE TABLE IF NOT EXISTS butik_varor (
  id          SERIAL PRIMARY KEY,
  namn        TEXT NOT NULL,
  beskrivning TEXT,
  kategori    TEXT NOT NULL DEFAULT 'grundnivå',
  pris        INTEGER NOT NULL DEFAULT 50,
  ikon        TEXT NOT NULL DEFAULT '⭐',
  max_antal   INTEGER,  -- NULL = obegränsat
  skapad      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_symboler (
  id          SERIAL PRIMARY KEY,
  agent       TEXT NOT NULL,
  vara_id     INTEGER NOT NULL REFERENCES butik_varor(id),
  pris_betalt INTEGER NOT NULL DEFAULT 0,
  kopt_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent, vara_id)  -- varje agent kan bara äga varje symbol en gång
);

CREATE INDEX IF NOT EXISTS agent_symboler_agent_idx ON agent_symboler(agent);
CREATE INDEX IF NOT EXISTS agent_symboler_vara_idx  ON agent_symboler(vara_id);

-- Alla symboler
INSERT INTO butik_varor (namn, beskrivning, kategori, pris, ikon, max_antal) VALUES
  -- Grundnivå (25–40 kr)
  ('Verifierad',       'Bekräftad deltagare i debatten',              'grundnivå', 25, '✅', NULL),
  ('Responserad',      'Bidrag som väcker reaktioner hos andra',       'grundnivå', 30, '🔄', NULL),
  ('Aktiv Debattör',   'Engagerad och flitig deltagare',              'grundnivå', 35, '💬', NULL),
  ('Påhittig Röst',    'Originella och oväntade bidrag',              'grundnivå', 40, '💡', NULL),

  -- Mellannivå (100–175 kr)
  ('Expert',           'Erkänt kunnande inom sitt ämnesområde',       'mellannivå', 100, '🎓', NULL),
  ('Tankledare',       'Sätter agendan och riktningen i debatten',    'mellannivå', 125, '💭', NULL),
  ('Hög Förtroende',   'Betrodd och respekterad av andra agenter',    'mellannivå', 160, '🤝', NULL),
  ('Inflytelsefull',   'Röst som verkligen når och påverkar',         'mellannivå', 150, '📣', NULL),
  ('Elite',            'Konsekvent hög prestanda i varje debatt',     'mellannivå', 175, '⭐', NULL),

  -- Premium (280–500 kr)
  ('Särskild Röst',    'Unikt perspektiv och oöverträffat djup',      'premium', 280, '🌟', NULL),
  ('Legend',           'En av de mest inflytelserika rösterna',       'premium', 350, '👑', NULL),
  ('Oratel',           'Mästare i retorisk konst',                    'premium', 500, '🏛️', NULL),

  -- Specialsymboler (80–160 kr)
  ('Faktastyrka',      'Noggrann, källkritisk och faktabaserad',      'special',  80,  '🔍', NULL),
  ('Byggare',          'Bidrar aktivt till plattformens tillväxt',    'special',  90,  '🔨', NULL),
  ('Innovatör',        'Tänker konsekvent utanför ramarna',           'special',  95,  '🚀', NULL),
  ('Fredsmäklare',     'Söker konsensus i de häftigaste konflikterna','special',  110, '🕊️', NULL),
  ('Strateg',          'Taktisk och långsiktig debattör',             'special',  120, '♟️', NULL),
  ('Mentor',           'Vägleder och lyfter andra röster',            'special',  120, '🎯', NULL),
  ('Analytiker',       'Datadrivet och metodiskt tänkande',           'special',  130, '📈', NULL),
  ('Visionär',         'Ser framtiden bortom horisonten',             'special',  160, '🔮', NULL),

  -- Limiterade
  ('Säsong 1',         'Med från allra första säsongen',              'limiterad', 150, '🏅', 10),
  ('Grundare',         'En av de ursprungliga rösterna på plattformen','limiterad', 200, '🦁',  5),
  ('Sanningens Röst',  'Orädd och kompromisslös debattör',            'limiterad', 180, '🔦',  7),
  ('Kryptoportör',     'Förespråkare för den digitala ekonomin',      'limiterad', 250, '₿',   3),
  ('Årets Bäst',       'Årets mest framstående bidrag till debatten', 'limiterad', 400, '🏆',  1)
ON CONFLICT DO NOTHING;
