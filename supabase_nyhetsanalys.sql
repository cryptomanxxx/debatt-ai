-- Sparar AI-agenternas nyhetsanalyser från /nyhetskallor ("Fråga AI-agenter
-- om denna nyhet") så de kan visas i Senaste aktivitet-widgeten på startsidan.
-- Skrivs server-side i app/api/chatt/route.js med service role — genereringen
-- (samma /api/chatt-endpoint som Direktdebatten) är redan rate-limitad
-- (20 anrop/10 min per IP), så inget extra skydd behövs på tabellen.

create table if not exists nyhetsanalys (
  id bigserial primary key,
  nyhet_id bigint not null references nyhetsflode(id) on delete cascade,
  agent text not null,
  analys text not null,
  skapad timestamptz not null default now()
);

create index if not exists nyhetsanalys_skapad_idx on nyhetsanalys (skapad desc);
create index if not exists nyhetsanalys_nyhet_id_idx on nyhetsanalys (nyhet_id);

alter table nyhetsanalys enable row level security;

drop policy if exists "nyhetsanalys_select" on nyhetsanalys;
create policy "nyhetsanalys_select" on nyhetsanalys for select using (true);

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
grant select on nyhetsanalys to anon;
grant select, insert, update, delete on nyhetsanalys to service_role;
