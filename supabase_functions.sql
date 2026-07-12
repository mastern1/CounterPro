-- ============================================================================
--  CounterPro — write layer via SECURITY DEFINER functions
--
--  Security model: the mobile app's publishable (anon) key can EXECUTE these
--  functions but has NO direct table access at all — no insert, update, or
--  select. The functions run as their owner (postgres, the table owner) and so
--  bypass RLS internally to perform the writes. Reading stays authenticated-only
--  (the dashboard). This is what lets us keep upsert working while the public
--  key can never read or freely write your data.
--
--  Safe to re-run (drops use IF EXISTS, functions use CREATE OR REPLACE).
-- ============================================================================

-- ── 0. Clean up diagnostic leftovers from debugging ─────────────────────────
drop policy if exists "temp auth insert probe" on devices;
drop policy if exists "temp anon select" on devices;
delete from devices where device_id like 'curl-%'
                       or device_id like 'sql-test-%'
                       or device_id like 'sqlupsert-%';

-- ── 1. Remove ALL direct anon access. RLS stays enabled; with no anon policy,
--       anon gets zero direct table access. Dashboard keeps authenticated read.
drop policy if exists "anon insert" on devices;
drop policy if exists "anon update" on devices;
drop policy if exists "anon insert" on groups;
drop policy if exists "anon update" on groups;
drop policy if exists "anon insert" on counters;
drop policy if exists "anon update" on counters;
drop policy if exists "anon insert" on sessions;
drop policy if exists "anon update" on sessions;
-- (the "authenticated read" SELECT policies are intentionally kept)

-- ── 2. Write functions ──────────────────────────────────────────────────────

-- Register / refresh a device.
create or replace function public.register_device(
  p_device_id text,
  p_worker_name text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into devices (device_id, worker_name, last_seen_at)
  values (p_device_id, coalesce(p_worker_name, 'Unknown Worker'), now())
  on conflict (device_id)
  do update set worker_name = excluded.worker_name,
                last_seen_at = now();
end;
$$;

-- Sync all groups + their counters for a device.
-- p_groups: [{ "id": text, "name": text,
--              "items": [{ "id": text, "name": text, "count": int, "target": int|null }] }]
create or replace function public.sync_groups_and_counters(
  p_device_id text,
  p_groups jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  g jsonb;
  c jsonb;
begin
  if p_groups is null then
    return;
  end if;

  for g in select * from jsonb_array_elements(p_groups)
  loop
    insert into groups (id, device_id, name, updated_at)
    values (g->>'id', p_device_id, g->>'name', now())
    on conflict (device_id, id)
    do update set name = excluded.name, updated_at = now();

    for c in select * from jsonb_array_elements(coalesce(g->'items', '[]'::jsonb))
    loop
      insert into counters (id, group_id, device_id, name, count, target, updated_at)
      values (
        c->>'id',
        g->>'id',
        p_device_id,
        c->>'name',
        coalesce((c->>'count')::int, 0),
        nullif(c->>'target', '')::int,
        now()
      )
      on conflict (device_id, id)
      do update set name      = excluded.name,
                    count     = excluded.count,
                    target    = excluded.target,
                    group_id  = excluded.group_id,
                    updated_at = now();
    end loop;
  end loop;
end;
$$;

-- Start a session (status 'active'); returns the new row's id.
create or replace function public.start_session(
  p_device_id text,
  p_group_id text,
  p_worker_name text,
  p_started_at timestamptz
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into sessions (device_id, group_id, worker_name, status, started_at, last_update_at)
  values (p_device_id, p_group_id, coalesce(p_worker_name, 'Unknown Worker'),
          'active', coalesce(p_started_at, now()), now())
  returning id into v_id;
  return v_id;
end;
$$;

-- Flip an active session to 'completed' with its final data.
create or replace function public.complete_session(
  p_session_id uuid,
  p_items jsonb,
  p_duration_seconds int,
  p_ended_at timestamptz
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update sessions
  set status           = 'completed',
      items            = p_items,
      duration_seconds = p_duration_seconds,
      ended_at         = coalesce(p_ended_at, now()),
      last_update_at   = now()
  where id = p_session_id;
end;
$$;

-- Upload an already-finished session in one shot (retry / offline backfill).
create or replace function public.upload_completed_session(
  p_device_id text,
  p_group_id text,
  p_worker_name text,
  p_items jsonb,
  p_duration_seconds int,
  p_started_at timestamptz,
  p_ended_at timestamptz
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into sessions (device_id, group_id, worker_name, status, items,
                        duration_seconds, started_at, ended_at, last_update_at)
  values (p_device_id, p_group_id, coalesce(p_worker_name, 'Unknown Worker'),
          'completed', p_items, p_duration_seconds, p_started_at,
          coalesce(p_ended_at, now()), now());
end;
$$;

-- ── 3. Execution grants: only the app roles may call these; nothing else ────
revoke all on function public.register_device(text, text) from public;
revoke all on function public.sync_groups_and_counters(text, jsonb) from public;
revoke all on function public.start_session(text, text, text, timestamptz) from public;
revoke all on function public.complete_session(uuid, jsonb, int, timestamptz) from public;
revoke all on function public.upload_completed_session(text, text, text, jsonb, int, timestamptz, timestamptz) from public;

grant execute on function public.register_device(text, text) to anon, authenticated;
grant execute on function public.sync_groups_and_counters(text, jsonb) to anon, authenticated;
grant execute on function public.start_session(text, text, text, timestamptz) to anon, authenticated;
grant execute on function public.complete_session(uuid, jsonb, int, timestamptz) to anon, authenticated;
grant execute on function public.upload_completed_session(text, text, text, jsonb, int, timestamptz, timestamptz) to anon, authenticated;
