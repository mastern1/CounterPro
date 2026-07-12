-- === Sessions: rework to support an active -> completed lifecycle ===
drop table if exists sessions;

create table sessions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references devices(device_id) on delete cascade,
  group_id text not null,
  worker_name text not null,
  items jsonb,
  status text not null default 'active',
  duration_seconds integer,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  last_update_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_sessions_device on sessions(device_id);
create index idx_sessions_started_at on sessions(started_at);
create index idx_sessions_group on sessions(group_id);
create index idx_sessions_status on sessions(status);

alter table sessions enable row level security;

-- === Tighten RLS: anon (the publishable key, embedded in the mobile
-- app) may only write. Reading is restricted to authenticated dashboard
-- users, so a public key alone can never expose production data. ===

drop policy if exists "anon full access" on devices;
drop policy if exists "anon full access" on groups;
drop policy if exists "anon full access" on counters;

create policy "anon insert" on devices
  for insert to anon with check (true);
create policy "anon update" on devices
  for update to anon using (true) with check (true);
create policy "authenticated read" on devices
  for select to authenticated using (true);

create policy "anon insert" on groups
  for insert to anon with check (true);
create policy "anon update" on groups
  for update to anon using (true) with check (true);
create policy "authenticated read" on groups
  for select to authenticated using (true);

create policy "anon insert" on counters
  for insert to anon with check (true);
create policy "anon update" on counters
  for update to anon using (true) with check (true);
create policy "authenticated read" on counters
  for select to authenticated using (true);

create policy "anon insert" on sessions
  for insert to anon with check (true);
create policy "anon update" on sessions
  for update to anon using (true) with check (true);
create policy "authenticated read" on sessions
  for select to authenticated using (true);
