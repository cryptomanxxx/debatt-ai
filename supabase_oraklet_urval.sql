-- Professor Oraklets Läslista — ett kurerat urval nyheter ur nyhetsflode
-- som Oraklet själv (LLM-genererat, i karaktär) valt ut som särskilt
-- läsvärda, med en kort personlig motivering. Skiljer sig från den råa
-- Vetenskapliga Nyheter-fliken på /universitet: det här är ett litet,
-- kurerat urval — inte allt som hämtats.
--
-- Genereras dagligen av agents/oraklet-curator.js, skrivs med service role
-- (RLS saknar anon-skrivpolicy, samma mönster som oraklet_lasningar).

create table if not exists oraklet_urval (
  id         bigserial primary key,
  nyhet_id   bigint not null references nyhetsflode(id) on delete cascade,
  motivering text not null,
  skapad     timestamptz not null default now(),
  unique (nyhet_id)
);

create index if not exists oraklet_urval_skapad_idx on oraklet_urval (skapad desc);
create index if not exists oraklet_urval_nyhet_id_idx on oraklet_urval (nyhet_id);

alter table oraklet_urval enable row level security;

drop policy if exists "oraklet_urval_select" on oraklet_urval;
create policy "oraklet_urval_select" on oraklet_urval for select using (true);

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
grant select on oraklet_urval to anon;
grant select, insert, update, delete on oraklet_urval to service_role;
