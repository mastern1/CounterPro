/*(START)--------------------------------------------------------------------*/
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
 ----------------------------------------------------------------------
 /*-(2)-------------------------------------------------------------------*/
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

create policy "anon insert" on sessions
  for insert to anon with check (true);

create policy "anon read" on sessions
  for select to anon using (true);

create policy "anon update" on sessions
  for update to anon using (true) with check (true);
  /*---------------------------------------------------------------------*/
  /*-(3)-------------------------------------------------------------------*/
  -- Devices: one row per phone/worker
create table devices (
  device_id text primary key,
  worker_name text not null,
  last_seen_at timestamptz not null default now()
);

-- Groups: mirrors a local group. Composite PK because local ids
-- (Date.now()-based) are only unique per device, not globally.
create table groups (
  id text not null,
  device_id text not null references devices(device_id) on delete cascade,
  name text not null,
  updated_at timestamptz not null default now(),
  primary key (device_id, id)
);

-- Counters: mirrors a local counter item, updated live while tapping.
create table counters (
  id text not null,
  group_id text not null,
  device_id text not null references devices(device_id) on delete cascade,
  name text not null,
  count integer not null default 0,
  target integer,
  updated_at timestamptz not null default now(),
  primary key (device_id, id),
  foreign key (device_id, group_id) references groups(device_id, id) on delete cascade
);

-- Sessions: finished session records, for history + monthly summaries.
create table sessions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references devices(device_id) on delete cascade,
  group_id text not null,
  worker_name text not null,
  items jsonb not null,
  duration_seconds integer not null,
  status text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Indexes for dashboard queries
create index idx_groups_device on groups(device_id);
create index idx_counters_group on counters(device_id, group_id);
create index idx_sessions_device on sessions(device_id);
create index idx_sessions_started_at on sessions(started_at);
create index idx_sessions_group on sessions(group_id);

-- RLS: no Supabase Auth, device identity only, so anon role gets
-- full read/write on the live tables and insert+read on sessions.
alter table devices enable row level security;
alter table groups enable row level security;
alter table counters enable row level security;
alter table sessions enable row level security;

create policy "anon full access" on devices
  for all to anon using (true) with check (true);

create policy "anon full access" on groups
  for all to anon using (true) with check (true);

create policy "anon full access" on counters
  for all to anon using (true) with check (true);

create policy "anon insert" on sessions
  for insert to anon with check (true);

create policy "anon read" on sessions
  for select to anon using (true);
/*---------------------*/
/*-(END)-------------------------------------------------------------------*/