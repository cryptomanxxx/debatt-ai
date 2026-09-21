-- filmrecensent_state: håller reda på var i @BoxofficeMoviesScenes hela
-- uppladdningskatalog (~9000+ videor) Filmrecensenten senast befann sig,
-- så varje körning kan fortsätta framåt genom hela historiken istället
-- för att bara känna till kanalens allra senaste video (kräver
-- YouTube Data API v3, se filmrecensent.py → hamta_video_kandidat()).
-- Alltid en enda rad: id='current'.
create table if not exists filmrecensent_state (
  id text primary key default 'current',
  next_page_token text,
  uppdaterad timestamptz not null default now()
);

-- RLS: publik läsning, skrivning kräver service role (samma mönster som
-- nyhetsflode/nyhetsanalys m.fl. sedan RLS-härdningen — ingen anon-policy
-- för INSERT/UPDATE).
alter table filmrecensent_state enable row level security;

create policy "publik läsning filmrecensent_state"
  on filmrecensent_state for select using (true);
