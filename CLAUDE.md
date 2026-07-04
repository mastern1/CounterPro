# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**CounterPro** is an offline-first Expo / React Native app for tracking factory worker
productivity. Workers organize production lines into *groups*, each containing *counter
items* they tap to increment during timed work *sessions*. All data is local-only
(AsyncStorage); cloud sync (Supabase) and a web admin dashboard are on the roadmap but
not yet implemented.

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

## Architecture

Entry: `index.js` → `App.js` wraps the tree in `GestureHandlerRootView` →
`SafeAreaProvider` → `ProjectProvider` → `NavigationContainer` → `AppNavigator`.

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
silently marked as saved. When changing the data shape, update both the save path and
`loadAll`.

`StorageService` also persists completed sessions under a separate `SESSION_LOGS` key via
`appendSessionLog` / `loadSessionLogs` (see Sessions below). These intentionally **survive
logout** — `clearAll` only removes `DATA`/`USER`/`LAYOUT` — so unsynced records aren't lost
before the planned Supabase upload.

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
  through `StorageService.appendSessionLog` (the `SESSION_LOGS` store) and also returned
  (though `SessionTimer` currently ignores the return value). This record is the payload
  shape intended for future Supabase upload; `loadSessionLogs()` is the read side for that
  sync. Keep `buildSessionRecord` pure — it's reusable for crash recovery later.

Dashboard enforces the session gate: `handleIncrement/Decrement/Reset/Delete` all check
`timerRef.current?.isSessionActive()` and alert if no session is running. A `beforeRemove`
navigation guard blocks leaving while a timer runs. `handleIncrement` clamps the new count
at `item.target` (when a target is set) so a `step` that doesn't evenly divide into the
distance to the goal can't jump the count past it — the "goal reached" alert in
`CounterCard` depends on the count never exceeding `target`.

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
