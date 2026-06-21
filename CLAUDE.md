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

- Expo SDK 56, React 19, React Native 0.85, new architecture with `reactCompiler: true`
  (see `app.json`). The README badge saying "SDK 54" is stale — trust `package.json`.
- Plain JavaScript (`.js`), not TypeScript, despite `typescript` being a dev dependency.
- Code comments throughout the `src/` tree are in **Arabic**. Match the surrounding style;
  English is fine for new comments.

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
JSON snapshot, plus a flush on `AppState` → background/inactive. When changing the data
shape, update both the save path and `loadAll`.

### Navigation flow
`src/navigation/AppNavigator.js` — native stack, headers hidden (each screen draws its
own). Flow: `WorkerIdentity` → `Home` → `Dashboard`.
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
  `endSession` diffs current vs. snapshot to build a `sessionRecord` (added/active/deleted
  items, worker, group, duration). This record is the **payload shape intended for future
  Supabase upload**; today it is only `console.log`ged. Don't delete it.

Dashboard enforces the session gate: `handleIncrement/Decrement/Reset/Delete` all check
`timerRef.current?.isSessionActive()` and alert if no session is running. A `beforeRemove`
navigation guard blocks leaving while a timer runs.

### Layout / responsiveness
Dashboard computes `numColumns` and card width dynamically from
`useWindowDimensions().width` against `MIN_CARD_WIDTH` (grid vs. list toggled by
`isGridLayout` in context). The `FlatList` `key` is recreated on column-count change to
work around Android column glitches — keep that pattern.

### Conventions
- IDs come from `generateId()` in `src/utils/generators.js`, which returns
  `Date.now().toString()`. This can collide for items created in the same millisecond — be
  aware when adding rapid-creation flows.
- Colors live in `src/constants/colors.js` (`COLORS.primary/secondary` are structural;
  `COLORS.palette` is the pastel pool used by `getRandomColor`).
- All user-facing strings go through `TEXTS` in `src/constants/translations.js` — add new
  copy there rather than hardcoding.
- Name validation / duplicate checks: `src/utils/validation.js`
  (`checkDuplicateName`, `validateStep`).
