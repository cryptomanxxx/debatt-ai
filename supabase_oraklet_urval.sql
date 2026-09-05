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
