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
