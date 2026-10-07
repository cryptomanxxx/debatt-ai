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

-- Data API-grants (Supabase-krav från 30 okt 2026 — se CLAUDE.md): nya
-- tabeller i public-schemat behöver explicita GRANT-satser för att vara
-- nåbara via Data API (PostgREST/supabase-js) efter det datumet, annars
-- "permission denied" trots korrekta RLS-policies — Supabase slutar
-- auto-bevilja grundrättigheter på nya tabeller från och med då. GRANT
-- och RLS är två separata lager: GRANT avgör om ett anrop överhuvudtaget
-- tillåts nå tabellen, RLS-policies avgör sedan vilka RADER som är
-- synliga/skrivbara. anon beviljas här exakt de operationer som
-- tabellens egna RLS-policies redan tillåter (ingen ändring av
-- säkerhetsmodellen — bara att göra det GRANT auto-gav tidigare
-- explicit) — service_role beviljas alltid full CRUD, eftersom BYPASSRLS
-- bara kringgår radpolicies, inte detta grundläggande GRANT-lager.
-- Ingen grant till authenticated: plattformen har ingen Supabase Auth /
-- inloggade användare, så rollen är aldrig i bruk här.
grant select on filmrecensent_state to anon;
grant select, insert, update, delete on filmrecensent_state to service_role;
