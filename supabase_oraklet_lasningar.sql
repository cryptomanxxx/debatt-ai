-- Loggar varje gång Professor Oraklet läser upp ett AI-forskningsfynd eller
-- en vetenskaplig nyhet på /universitet (se app/universitet/UniversitetVy.js).
-- Skrivs server-side i app/api/oraklet-lasning/route.js med service role
-- (RLS saknar anon-skrivpolicy, samma mönster som fraga_anna_peter_log) —
-- läsning sker via app/api/aktivitet/route.js för att visa uppläsningar i
-- Senaste aktivitet-feeden på startsidan.

create table if not exists oraklet_lasningar (
  id     bigserial primary key,
  typ    text not null check (typ in ('forskning', 'nyhet')),
  ref_id bigint,
  titel  text not null,
  skapad timestamptz not null default now()
);

create index if not exists oraklet_lasningar_skapad_idx on oraklet_lasningar (skapad desc);

alter table oraklet_lasningar enable row level security;

drop policy if exists "oraklet_lasningar_select" on oraklet_lasningar;
create policy "oraklet_lasningar_select" on oraklet_lasningar for select using (true);
