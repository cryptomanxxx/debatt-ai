-- provider_benchmark_log: historik över alla benchmark-körningar
create table if not exists provider_benchmark_log (
  id bigserial primary key,
  provider text not null,
  label text,
  lyckade integer not null default 0,
  totalt integer not null default 0,
  snitt_latens_s numeric not null default 0,
  parsade integer not null default 0,
  forsta_429_vid_anrop integer,
  kord_at timestamptz not null default now()
);

-- provider_config: aktuell rankad fallback-ordning (alltid en rad: id='current')
create table if not exists provider_config (
  id text primary key default 'current',
  ranked_order jsonb not null,
  uppdaterad timestamptz not null default now()
);

-- Sätt standardordning baserad på senaste benchmark
insert into provider_config (id, ranked_order) values (
  'current',
  '["mistral","sambanova","deepseek","groq","cloudflare","gemini","github_models","cerebras"]'
) on conflict (id) do nothing;

-- provider_429_passive: passiv spårning av 429-fel i produktion
create table if not exists provider_429_passive (
  id bigserial primary key,
  provider text not null,
  loggad timestamptz not null default now()
);

-- RLS-policies: publik läsning, anon-skrivning för passiv loggning
alter table provider_benchmark_log enable row level security;
alter table provider_config enable row level security;
alter table provider_429_passive enable row level security;

create policy "publik läsning provider_benchmark_log"
  on provider_benchmark_log for select using (true);

create policy "publik läsning provider_config"
  on provider_config for select using (true);

create policy "anon insert provider_429_passive"
  on provider_429_passive for insert with check (true);
create policy "anon insert provider_benchmark_log"
  on provider_benchmark_log for insert with check (true);
create policy "anon insert provider_config"
  on provider_config for insert with check (true);
create policy "anon update provider_config"
  on provider_config for update using (true);

create policy "publik läsning provider_429_passive"
  on provider_429_passive for select using (true);

-- Index för snabb aggregering
create index if not exists provider_429_passive_loggad_idx
  on provider_429_passive (provider, loggad desc);

create index if not exists provider_benchmark_log_kord_at_idx
  on provider_benchmark_log (provider, kord_at desc);
