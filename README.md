# 🏭 CounterPro | Production Tracking System

![Status](https://img.shields.io/badge/Status-Active_Development-orange) ![Platform](https://img.shields.io/badge/Platform-iOS_%7C_Android-blue) ![Expo](https://img.shields.io/badge/Built_with-Expo_SDK_57-black) ![React](https://img.shields.io/badge/React-19-61DAFB) ![License](https://img.shields.io/badge/License-MIT-green)

**CounterPro** is a specialized, high-performance mobile app built for factories to track worker productivity in real time. It replaces manual paper counting with a fast, error-resistant, dark-themed interface designed for the factory floor.

> 🚧 **Project Status:** Active Development. Offline-first with **Supabase cloud sync built in**; the web admin dashboard is next.

---

## 🚀 Key Features

- **👷 Worker Identity** — Each worker signs in by name; the device is auto-identified (brand + model) so production can be attributed per device.
- **🏭 Work Groups** — Organize production lines into color-coded groups (e.g. "Sewing Line A", "Cutting Section"). Create, rename, and delete groups.
- **🔢 Smart Counter Items** — Per group, add counters with:
  - **Step** — increment by 1, 5, 10… per tap.
  - **Target** — optional goal with progress feedback and a haptic cue on completion.
  - **Custom color** — pick from a calm pastel palette.
- **⏱️ Session Management** — A built-in session timer (start / pause / resume / stop) with high-accuracy, drift-free timing. Counting is **gated behind an active session**, and the screen is kept awake while a session runs.
- **🛡️ Exit Guard** — Leaving a screen mid-session prompts to stop & save first, so no session ends silently.
- **📊 Production Diff** — On session end, the app computes exactly what was produced (added, brand-new, and deleted items) into a structured session record, persisted locally and uploaded to the cloud.
- **☁️ Cloud Sync (Supabase)** — Devices, groups, counters, and sessions are mirrored to Supabase in the background: live counter updates piggyback the smart save, deletions propagate, and sessions run an active → completed lifecycle. Writes go through `SECURITY DEFINER` RPC functions only — the key embedded in the app can never *read* production data. Sessions that run fully offline are backfilled on the next launch (idempotently — retries can't create duplicates).
- **⚡ Adaptive UI** — Responsive grid/list layouts with dynamic column sizing (tablet-optimized), large hit targets for fast repetitive tapping, and haptic feedback on every action.
- **🌙 Dark Theme** — A single, eye-friendly dark interface throughout.
- **🔌 Offline-First** — Fully functional with no connection. Data is persisted locally with a debounced "smart save" plus a flush when the app goes to the background.

---

## 🗺️ Roadmap

- [x] **🗃️ Local session logs** — Completed sessions persist on device (and survive logout) until confirmed synced.
- [x] **☁️ Cloud Sync (Supabase)** — Groups, counters, and session records sync to a central database, with offline backfill.
- [ ] **📊 Admin Dashboard** — A web dashboard for managers to monitor production live (next up).
- [ ] **💥 Crash Recovery** — Persist the in-flight session snapshot so an OS kill mid-session can be recovered as an "interrupted" session.
- [ ] **🔐 Worker Authentication** — Secure sign-in via worker IDs or QR codes.
- [ ] **📈 Analytics** — Daily/weekly productivity trends and reports.

---

## 🛠 Tech Stack

| Category             | Technology                                              |
| -------------------- | ------------------------------------------------------- |
| **Framework**        | React Native 0.86 · Expo SDK 57 (New Architecture)      |
| **Runtime**          | React 19 · React Compiler enabled                       |
| **Navigation**       | React Navigation 7 (Native Stack)                       |
| **State Management** | React Context API & Hooks                               |
| **Storage**          | AsyncStorage (local source of truth) + Supabase (cloud) |
| **Device & UX**      | expo-haptics · expo-device · expo-keep-awake            |
| **Language**         | JavaScript (ES6+)                                       |
| **Styling**          | StyleSheet API with a centralized dark theme            |

---

## 📂 Project Structure

```
src/
├── components/      # Reusable UI (CounterCard, GroupCard, SessionTimer, InputModal)
├── constants/       # colors (dark theme tokens) and translations
├── context/         # ProjectContext — single source of truth + smart-save
├── hooks/           # useSessionManager — session snapshot & production diff
├── navigation/      # AppNavigator (native stack)
├── screens/         # WorkerIdentity → Home → Dashboard
├── services/        # storageService (only AsyncStorage gateway) · syncService + supabaseClient (only Supabase gateway)
└── utils/           # generators, validation & session-record helpers
```

Backend SQL lives at the repo root: `supabase_schema.sql` (tables + RLS) and
`supabase_functions.sql` (the `SECURITY DEFINER` write layer — re-run it in the Supabase
SQL Editor whenever it changes).

---

## 🏃‍♂️ Getting Started

**Prerequisites:** Node.js LTS and the Expo tooling. Use a development build or Expo Go on your device.

1. **Clone the repository**

   ```bash
   git clone https://github.com/mastern1/CounterPro.git
   cd CounterPro
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the app (clear cache)**

   ```bash
   npx expo start -c
   ```

   Then run on a device/emulator:

   ```bash
   npm run android   # Android
   npm run ios       # iOS
   ```

4. **Lint**

   ```bash
   npm run lint
   ```

---

## 📄 License

Licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright © 2026 **Nour Eddin Sweid**.

---

## 📞 Contact & Contribution

Created by **Nour Eddin Sweid**. For inquiries or collaboration, please contact the developer directly.
