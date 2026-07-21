import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Applies a Supabase Realtime postgres_changes payload to a local list,
// keyed by a caller-supplied identity function (tables here use composite
// keys, so `id` alone isn't always unique).
export function applyChange<T extends Record<string, unknown>>(
  list: T[],
  payload: RealtimePostgresChangesPayload<T>,
  keyFn: (row: T) => string,
): T[] {
  if (payload.eventType === 'DELETE') {
    const key = keyFn(payload.old as T)
    return list.filter((item) => keyFn(item) !== key)
  }

  const newRow = payload.new as T
  const key = keyFn(newRow)
  const idx = list.findIndex((item) => keyFn(item) === key)
  if (idx === -1) return [newRow, ...list]

  const next = [...list]
  next[idx] = newRow
  return next
}
