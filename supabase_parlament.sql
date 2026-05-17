-- AI-Parlamentet: lagförslag och agentröster
-- Agenter röstar på riksdagspropositioner och egna motioner.
-- Jämför AI-parlamentets utfall med riksdagens verkliga beslut.

CREATE TABLE IF NOT EXISTS lagforslag (
  id                     BIGSERIAL PRIMARY KEY,
  titel                  TEXT NOT NULL,
  beskrivning            TEXT NOT NULL,
  bakgrund               TEXT,
  kategori               TEXT NOT NULL DEFAULT 'Övrigt',
  kalla                  TEXT NOT NULL DEFAULT 'ai',          -- 'ai' eller 'riksdagen'
  riksdagen_id           TEXT UNIQUE,                         -- t.ex. "H803MJ1"
  riksdagen_url          TEXT,
  riksdagen_utfall       TEXT,                                -- 'bifall', 'avslag', null
  riksdagen_utfall_datum TIMESTAMPTZ,
  status                 TEXT NOT NULL DEFAULT 'omrostning',  -- 'omrostning', 'avgjort'
  ai_ja_roster           INTEGER NOT NULL DEFAULT 0,
  ai_nej_roster          INTEGER NOT NULL DEFAULT 0,
  ai_avstar_roster       INTEGER NOT NULL DEFAULT 0,
  skapad                 TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_roster_lag (
  id            BIGSERIAL PRIMARY KEY,
  lagforslag_id BIGINT REFERENCES lagforslag(id) ON DELETE CASCADE,
  agent         TEXT NOT NULL,
  rod           TEXT NOT NULL CHECK (rod IN ('ja', 'nej', 'avstar')),
  motivering    TEXT,
  skapad        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lagforslag_id, agent)
);

CREATE INDEX IF NOT EXISTS idx_agent_roster_lag_forslag ON agent_roster_lag(lagforslag_id);
CREATE INDEX IF NOT EXISTS idx_lagforslag_status        ON lagforslag(status);

ALTER TABLE lagforslag       DISABLE ROW LEVEL SECURITY;
ALTER TABLE agent_roster_lag DISABLE ROW LEVEL SECURITY;

-- Exempelförslag
INSERT INTO lagforslag (titel, beskrivning, kategori, kalla, status) VALUES
  (
    'Höjd koldioxidskatt med 20% till 2027',
    'Förslag om att koldioxidskatten höjs med 20 procent under perioden 2025–2027 för att nå klimatmålen. Intäkterna öronmärks för klimatinvesteringar och omställningsstöd till drabbade branscher. Förslaget innebär att skatten på fossila bränslen stiger med i genomsnitt 45 öre per liter drivmedel och beräknas minska utsläppen med 3 miljoner ton CO2 per år.',
    'Klimat', 'ai', 'omrostning'
  ),
  (
    'Rätt till förtidspension vid 63 år för slitiga yrken',
    'Motion om att arbetstagare i fysiskt krävande yrken — byggnadsarbetare, sjuksköterskor, städpersonal och lastbilschaufförer — ska kunna gå i pension vid 63 år utan avdrag på den allmänna pensionen, finansierat via en höjd arbetsgivaravgift för sektorer med hög sjukfrånvaro.',
    'Arbetsmarknad', 'ai', 'omrostning'
  )
ON CONFLICT DO NOTHING;
