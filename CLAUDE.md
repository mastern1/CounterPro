# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**CounterPro** is an offline-first Expo / React Native app for tracking factory worker
productivity. Workers organize production lines into *groups*, each containing *counter
items* they tap to increment during timed work *sessions*. AsyncStorage is the local
source of truth; on top of it, completed data is mirrored to **Supabase** (implemented —
see "Cloud sync" below). A **web admin dashboard** that reads the Supabase data lives in
`/dashboard` as a separate app within this repo (own `package.json`/tooling) — see "Web
dashboard" below. Live device/session/production monitoring is built; monthly production
summaries and Excel export are still roadmap.

## Commands

```bash
npm install            # install dependencies
npx expo start -c      # start Metro with a cleared cache (preferred for dev)
npm start              # expo start (no cache clear)
npm run android        # launch on Android
npm run ios            # launch on iOS
npm run web            # launch in browser
npm run lint           # expo lint (eslint-config-expo, flat config)
```

There is **no test framework** configured — no `npm test`, no Jest/Vitest. Verify changes
by running the app.

## Tech notes

- Expo SDK 57, React 19, React Native 0.86, new architecture with `reactCompiler: true`
  (see `app.json`). Because the React Compiler enforces the Rules of React, keep render
  pure: no side effects, ref writes, or impure calls (`Date.now()`, `Math.random()`)
  during render — `npm run lint` reports these as **errors**, not warnings.
- Plain JavaScript (`.js`), not TypeScript, despite `typescript` being a dev dependency.
- Code comments across `src/` and `App.js` are in **English** (translated from the
  original Arabic). Keep new comments in English.
- The UI is **dark-only** — there is no light mode or theme toggle.
- Dependencies are kept lean on purpose: `expo-constants`, `expo-font`,
  `react-native-reanimated`, and `react-native-worklets` were removed after an audit found
  zero usage (no imports, no peer-dependency requirement from `react-native-screens` or
  `@react-navigation/native-stack`, no custom fonts). Don't re-add a package without
  confirming it's actually imported somewhere — unused native modules measurably slow down
  navigation. Never run `npm audit fix` / `--force` in this repo — versions are deliberately
  pinned to what the current Expo SDK supports.
- There is **no `babel.config.js`** in this project (removed — it only contained the
  default `babel-preset-expo` preset with no customization). Expo SDK 54+ applies
  `babel-preset-expo` automatically, including the React Compiler transform driven by
  `experiments.reactCompiler` in `app.json` — confirmed via official Expo docs and a live
  `expo export` bundle check. Only add the file back if a Babel customization is actually
  needed (run `npx expo customize babel.config.js` at that point).
- Supabase keys live in a gitignored **`.env`** (`EXPO_PUBLIC_SUPABASE_URL`,
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`). Expo's CLI loads `.env` and inlines `EXPO_PUBLIC_*`
  vars automatically (no `dotenv` package). Because they're inlined at **bundle time**, a
  `.env` change needs a Metro restart (`npx expo start -c`) to take effect. The anon key
  is the newer `sb_publishable_...` format — safe to embed because RLS + the write-only
  function layer (see Cloud sync) mean it can't read data.

## Architecture

Entry: `index.js` → `App.js` wraps the tree in `GestureHandlerRootView` →
`SafeAreaProvider` → `ProjectProvider` → `NavigationContainer` → `AppNavigator`.

### Memoization pattern (`CounterCard` / `GroupCard`)
Both are wrapped in `React.memo`, so they only re-render when their own props actually
change. That guarantee depends on two things holding at every call site:
1. The handlers passed in as props must be genuinely stable across renders — wrapping a
   function in `useCallback` is not enough if its dependency array includes something that
   changes on every relevant update (e.g. the `items`/`groups` array itself, which gets a
   new reference on every edit via `.map()`/`.filter()`). `DashboardScreen.js` keeps
   `handleIncrement/Decrement/Reset/Delete/Move` stable by reading the latest items from an
   `itemsRef` (kept in sync via a `useEffect`, same pattern as `useSessionManager`'s
   `latestItemsRef`) instead of closing over `items` directly.
2. Per-item binding (turning a stable `(item) => ...` handler into the specific button's
   `onPress`) must happen **inside** the memoized child, not in the parent's `renderItem`.
   `CounterCard` does `onPress={() => onIncrement(item.id)}` itself; `GroupCard` does
   `onPress={() => onPress(item)}` itself. If the parent's `renderItem` pre-binds the item
   (`onPress={() => handler(item)}`) it creates a brand-new function on every call,
   defeating the child's `memo` regardless of how stable the underlying handler is.

When adding a new prop to either card, wire it the same way — pass the raw stable handler
down and let the card bind the item itself.

The same rule applies to hook arguments: `DashboardScreen` passes **memoized** objects
(`sessionGroup` / `sessionUser`) into `useSessionManager`, because inline object literals
there would change identity every render → recreate `startSession`/`endSession` (their
`useCallback` deps) → defeat `React.memo(SessionTimer)` on every counter tap.

### State — single source of truth
`src/context/ProjectContext.js` holds **all** app state (`groups`, `userData`,
`isGridLayout`, `isLoading`) and every mutator. There is no Redux/Zustand; screens read
context via `useContext(ProjectContext)`. The context value is memoized and all mutators
are `useCallback`-stabilized to protect `FlatList` render performance — preserve this when
adding state.

### Persistence — "Smart Save"
`src/services/storageService.js` is the only module that knows AsyncStorage keys
(`@counters_pro_*`). The context never calls AsyncStorage directly except through
`StorageService`. Saving is **debounced 500ms** and diffed against a `previousGroupsRef`
JSON snapshot, plus a flush on `AppState` → background/inactive. `previousGroupsRef` is
only updated **after** `StorageService.saveGroups()` resolves successfully (not eagerly
when the change is detected) — this keeps the ref an honest mirror of what's actually on
disk, so a failed write is naturally retried on the next `groups` change instead of being
silently marked as saved. `saveNow` also re-checks the ref before writing: the AppState
listener outlives a successful debounced save (nothing re-runs the effect), so without
that guard every backgrounding would re-save and re-sync identical data. When changing the data shape, update both the save path and
`loadAll`.

`StorageService` also persists completed sessions under a separate `SESSION_LOGS` key via
`appendSessionLog` / `loadSessionLogs` (see Sessions below). Each log carries a
`synced` boolean (`markSessionSynced` flips it once Supabase confirms the upload). These
intentionally **survive logout** — `clearAll` only removes `DATA`/`USER`/`LAYOUT` — so
unsynced records aren't lost; `SyncService.retryUnsyncedSessions` backfills them on next
launch. `getSyncDeviceId()` returns a stable per-install id under `SYNC_DEVICE_ID` (also
kept across logout): the Supabase device identity. **Don't** use `userData.deviceId` for
Supabase — that's only the device *model name* (for display) and collides across two
phones of the same model.

### Cloud sync (Supabase)
`src/services/supabaseClient.js` creates the client (no session persistence — the app has
no Supabase Auth). `src/services/syncService.js` is the **only** module that talks to
Supabase. The backend schema + write layer are documented in `supabase_schema.sql` and
`supabase_functions.sql` at the repo root (the SQL you run in the Supabase SQL Editor).

Four tables: `devices`, `groups`, `counters` (live mirror, composite PK `device_id,id`
because local `Date.now()` ids are only unique per-device), and `sessions` (uuid PK,
`active`→`completed` lifecycle — a device is "live" on the dashboard by having a session
row with `status='active'`, no separate presence table). Monthly summaries are plain
aggregate SQL over `sessions`; no rollup table.

**Security model — writes go through `SECURITY DEFINER` functions, never direct table
writes.** `syncService` calls `supabase.rpc('register_device' | 'sync_groups_and_counters'
| 'start_session' | 'complete_session' | 'upload_completed_session', ...)`. Those Postgres
functions run as the table owner (bypass RLS internally); the anon/publishable key has
only `EXECUTE` on them and **zero direct table access**. RLS keeps reads
`authenticated`-only (the dashboard), so the key embedded in the APK can write but can
never read production data.

**Why functions instead of `.from().upsert()` (do not "simplify" this back):** a direct
client `.upsert()` fails RLS with `42501 "new row violates row-level security policy"` even
when the anon INSERT policy is `with_check(true)`. Root cause (proven via curl): plain
INSERT and plain UPDATE both work for anon, but **any `ON CONFLICT` (upsert) requires a
SELECT policy** on the table, which anon deliberately lacks. `return=minimal` does not
help. Routing writes through `SECURITY DEFINER` functions is the fix that keeps the tables
unreadable by the public key while upsert-style syncing still works. If you add a new
synced entity, add a function + `rpc()` call — don't reach for `.from().upsert()`.

**Deletions propagate.** `sync_groups_and_counters` upserts the payload *and then deletes*
this device's `groups`/`counters` rows that are absent from it (null-safe `NOT EXISTS`,
counters first — group deletion also cascades via FK). An **empty array is a valid
payload** (it wipes the device's rows — the "last group deleted" / logout case), so
`syncGroupsAndCounters` only bails on a missing `groups`, never on `length === 0`. Don't
reintroduce that early return.

**Session upload is idempotent.** `sessions` has a `client_session_id` column with a
unique index on `(device_id, client_session_id)`; `upload_completed_session` inserts
`ON CONFLICT DO NOTHING` and `syncService` passes the local `record.sessionId`. So a
retry of an already-uploaded log is a no-op, never a duplicate row (rows created by
`start_session` keep a NULL `client_session_id`; NULLs never conflict). After editing
`supabase_functions.sql`, **re-run it in the Supabase SQL Editor** — the file is written
to be safe to re-run end-to-end.

Every `SyncService` call is **fire-and-forget**: wrapped in try/catch, errors logged not
thrown, never `await`-ed at the call site — a slow/failed network must never block the
offline-first UI. Note Supabase-js does **not** throw on DB/RLS errors; it returns
`{ error }`, so every call checks `if (error) throw error`. Triggers: device registration
+ `retryUnsyncedSessions` on launch (registration is `await`-ed first — sessions FK the
device row); `syncGroupsAndCounters` piggybacks the 500ms Smart Save (so ~2 writes/sec max
even under tap-spam, not one per tap); the session lifecycle from `useSessionManager`.
Timestamps are stored UTC (`timestamptz`); the dashboard localizes to Istanbul for display.

### Navigation flow
`src/navigation/AppNavigator.js` — native stack, headers hidden (each screen draws its
own). Flow: `WorkerIdentity` → `Home` → `Dashboard`. The dark look is enforced at several
layers to avoid a white flash on transitions: each screen's root background, the navigator
`contentStyle`, a `DarkTheme` on `NavigationContainer` (in `App.js`), and
`backgroundColor` in `app.json` (the last only takes effect in real builds, not Expo Go).
- **WorkerIdentity**: name entry + device-name detection (`expo-device`); auto-redirects
  to Home if a saved user exists.
- **Home**: group list, add/edit/delete groups, logout (clears all storage).
- **Dashboard**: the counter grid for one group. Receives `{ groupId, groupName }` via
  route params and finds its group inside context `groups`.

### Sessions — the core domain concept
Counting only happens inside a session. Two pieces cooperate:
- `src/components/SessionTimer.js` — a `forwardRef` component exposing an imperative
  handle (`isSessionActive()`, `requestStop()`). Elapsed time is computed from
  `Date.now()` deltas (with pause accounting), not from interval ticks, so it stays
  accurate across re-renders. It fires `onStart` / `onStop(durationSeconds)`.
- `src/hooks/useSessionManager.js` — snapshots item counts on `startSession`, and on
  `endSession` builds a `sessionRecord` via the pure `buildSessionRecord()` helper in
  `src/utils/sessionUtils.js` (diffs current vs. snapshot: added/active/deleted items,
  worker, group, duration, `status`). On a clean end the record is **persisted locally**
  through `StorageService.appendSessionLog` (the `SESSION_LOGS` store, tagged
  `synced:false`) and also returned (though `SessionTimer` currently ignores the return
  value). `useSessionManager` also drives the remote session lifecycle, with two
  invariants to preserve:
  - `startSession` calls `SyncService.startRemoteSession`, but the returned uuid is only
    kept if **the same session is still active when the RPC resolves** — a per-session
    generation counter guards the `.then`, and a stale response's row is completed
    immediately with empty production. Without this, a fast stop on a slow network leaves
    the remote row `status='active'` forever, and worse, the late uuid lands in the ref
    where the *next* session's `endSession` would complete the wrong row.
  - `endSession` chains `appendSessionLog` → `completeRemoteSession` →
    `markSessionSynced` **strictly in sequence** — the first and last both
    read-modify-write the same `SESSION_LOGS` key, so running them in parallel can drop
    or mis-flag the record. The remote id is captured into a local before the refs reset.
    A failed `markSessionSynced` only warns: the launch-time re-upload is idempotent (see
    Cloud sync), so a duplicate row can't happen.

  Keep `buildSessionRecord` pure — it's reusable for crash recovery later.

Dashboard enforces the session gate: `handleIncrement/Decrement/Reset/Delete` all check
`timerRef.current?.isSessionActive()` **first**, before any other logic, and alert if no
session is running. A `beforeRemove` navigation guard blocks leaving while a timer runs.
All per-item business logic — the goal-reached check/alert, the haptic feedback, and the
clamp at `item.target` (so a `step` that doesn't evenly divide into the distance to the
goal can't jump the count past it) — lives in `handleIncrement` in `DashboardScreen.js`,
*after* the session check. `CounterCard` itself is presentational only for these buttons
(`onPress={() => onIncrement(item.id)}` / `onDecrement(item.id)`); it does not run its own
pre-checks. Keep it this way — a goal/business-logic check placed in the child would run
before the parent's session gate ever executes, misfiring the wrong alert (e.g. "goal
reached" instead of "session inactive") when both conditions are true at once.

### Layout / responsiveness
Dashboard computes `numColumns` and card width dynamically from
`useWindowDimensions().width` against `MIN_CARD_WIDTH` (grid vs. list toggled by
`isGridLayout` in context). The `FlatList` `key` is recreated on column-count change to
work around Android column glitches — keep that pattern.

### Conventions
- IDs come from `generateId()` in `src/utils/generators.js`, which returns
  `Date.now().toString()`. This can collide for items created in the same millisecond — be
  aware when adding rapid-creation flows.
- Colors live in `src/constants/colors.js`: brand tokens (`primary/secondary/accent/error`)
  and dark-theme tokens (`background/surface/surfaceAlt/border/textPrimary/textSecondary`).
  `COLORS.palette` is a **vibrant** Material pool used by `getRandomColor` for groups and
  counter items. Counter cards don't hardcode text color — `CounterCard` resolves the card's
  background once (`item.color || fallback`) and calls `getContrastText()` on that *same*
  resolved value to pick black/white text, so the two can never disagree (including when
  `item.color` is missing and the fallback background is used).
- All user-facing strings go through `TEXTS` in `src/constants/translations.js` — add new
  copy there rather than hardcoding.
- Name validation / duplicate checks: `src/utils/validation.js`
  (`checkDuplicateName`, `validateStep`).

## Web dashboard (`/dashboard`)

A separate Vite + React 19 + TypeScript app, **not** part of the Expo project — its own
`package.json`, `node_modules`, and `npm install`/`npm run dev`/`npm run build` (run from
inside `/dashboard`, not the repo root). Stack: Tailwind v4 (`@tailwindcss/vite`) +
shadcn/ui (`components.json` has `"tsx": true` — always add new primitives via
`npx shadcn add <name>`, don't hand-write them, or they won't match the project's typed
component conventions). Dark-only, no toggle, same reasoning as the mobile app.

**Auth is a single Supabase Auth admin account** (email/password created directly in the
Supabase dashboard, Authentication → Users) — there is no self-serve signup and the app
assumes exactly one legitimate login. `src/context/AuthContext.tsx` wraps
`supabase.auth.signInWithPassword` / `onAuthStateChange`. No new backend writes were
needed for this: the existing `supabase_schema.sql` already grants `authenticated` SELECT
on all four tables (see Cloud sync above), so the dashboard reads
via plain `supabase.from(table).select()` once logged in — RLS gates it automatically.

**`src/lib/supabaseClient.ts` is typed** via `createClient<Database>(...)`, where
`Database` (`src/types/database.ts`) is **hand-written**, not CLI-generated — there's no
`supabase login` access token available in this environment. It mirrors the exact shape
`supabase gen types typescript --project-id hawqnpjwtpegahgehndo` would produce, so
running that command and overwriting the file is a safe drop-in upgrade whenever CLI
access exists. Columns were sourced from `supabase_functions.sql`'s INSERT/UPDATE
statements, **not** `supabase_schema.sql` — the schema file is not guaranteed to reflect
the live cloud database (it's a partial/patch file, not a from-scratch dump), while the
functions file's literal column references are what's actually running. If the two ever
disagree, trust the live database (verify via a real query), not either file blindly.

**Realtime** (`Dashboard.tsx`) subscribes to `postgres_changes` on `devices`, `sessions`,
and `counters` (deliberately not `groups` — it rarely changes and isn't displayed on its
own). This requires each table to have Realtime enabled in the Supabase dashboard
(Database → Replication / Table Editor toggle) — without that, the subscription connects
but silently never receives events. `postgres_changes` (not Broadcast) is the correct
choice here specifically because there's exactly one admin viewer; Broadcast only wins
past ~3,000 concurrent subscribers or high-frequency events (cursors, typing indicators),
neither of which applies. `src/lib/realtimeMerge.ts`'s `applyChange` keys DELETE events
off primary-key fields only (`device_id` / `id` / `device_id:id`) — this works with the
default `REPLICA IDENTITY`, no `ALTER TABLE ... REPLICA IDENTITY FULL` needed, because
RLS-gated tables only send PK columns on a deleted row's old-record payload anyway.

**React Compiler is enabled — but not the way you'd expect.** Plain
`babel({ plugins: ['babel-plugin-react-compiler'] })` in `vite.config.ts` **silently
no-ops** under this project's Vite 8 / Rolldown pipeline: the build succeeds and the
output is byte-identical to no-compiler, with no error. The working integration is
`@vitejs/plugin-react`'s exported `reactCompilerPreset()` passed into
`@rolldown/plugin-babel`'s `presets` option (see `vite.config.ts`). If you ever touch
this config, verify the compiler is actually running by grepping the **built** bundle for
`memo_cache_sentinel` (the compiler's cache-check marker) — a clean build alone proves
nothing. No manual `useMemo`/`useCallback`/`React.memo` is used in this app; let the
compiler handle it.
