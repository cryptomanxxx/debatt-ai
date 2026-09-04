-- Historik för /fraga-anna-och-peter — sparar varje gång en besökare låter
-- Anna eller Peter läsa upp fri text/en nyhetsartikel, eller låter dem
-- diskutera den tillsammans i studion. Skrivs server-side i
-- app/api/fraga-anna-och-peter/route.js med service role (RLS saknar
-- anon-skrivpolicy, samma mönster som labb_log/nyhetsanalys) — läsning sker
-- direkt mot PostgREST med anon-nyckeln från sidan (publik SELECT nedan).

create table if not exists fraga_anna_peter_log (
  id             bigserial primary key,
  typ            text not null check (typ in ('fritext', 'url')),
  aktion         text not null check (aktion in ('anna_sager', 'peter_sager', 'diskussion')),
  input_text     text,
  kalla_url      text,
  titel          text,
  sammanfattning text,
  dialog         jsonb,
  skapad         timestamptz not null default now()
);

create index if not exists fraga_anna_peter_log_skapad_idx on fraga_anna_peter_log (skapad desc);

alter table fraga_anna_peter_log enable row level security;

drop policy if exists "fraga_anna_peter_log_select" on fraga_anna_peter_log;
create policy "fraga_anna_peter_log_select" on fraga_anna_peter_log for select using (true);
