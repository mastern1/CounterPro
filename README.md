# 🏭 CounterPro | Production Tracking System

![Status](https://img.shields.io/badge/Status-Under_Development-orange) ![Platform](https://img.shields.io/badge/Platform-iOS_%7C_Android-blue) ![Expo](https://img.shields.io/badge/Built_with-Expo_SDK_54-black)

**CounterPro** is a specialized, high-performance mobile application designed for factories to track worker productivity in real-time. It replaces manual paper counting with a digital, error-free interface optimized for speed and factory environments.

> 🚧 **Project Status:** Active Development (MVP Phase).

---

## 🚀 Key Features

### ✅ Current Capabilities

- **🏭 Smart Group System:** Organize production lines into specific groups (e.g., "Sewing Line A", "Cutting Section").
- **⚡ Adaptive Counter UI:**
  - Designed for high-speed, repetitive tapping.
  - **Dynamic Sizing:** Buttons automatically resize to fit any screen size, minimizing accidental touches.
  - **Haptic Feedback:** Physical vibration feedback for every count to ensure accuracy without looking at the screen.
- **📂 Session Management:**
  - Tracks specific work sessions with timestamps (Start/End).
  - Maintains separate counts for different products/workers within the same device.
- **🔌 Offline-First Architecture:** Fully functional without an internet connection, ensuring zero downtime on the factory floor.

---

## 🗺️ Roadmap & Future Plans

We are building a complete ecosystem for factory management. Upcoming features include:

- [ ] **☁️ Cloud Sync (Supabase):** Real-time data synchronization to a central cloud database.
- [ ] **📊 Admin Dashboard:** A dedicated Web Dashboard (Next.js) for managers to monitor production live from the office.
- [ ] **🔐 Worker Authentication:** Secure login using worker IDs or QR codes.
- [ ] **📈 Analytics:** Charts and reports for daily/weekly productivity trends.

---

## 🛠 Technical Stack

This project follows a clean, scalable architecture to ensure performance and maintainability.

| Category             | Technology                                      |
| -------------------- | ----------------------------------------------- |
| **Framework**        | React Native (Expo SDK 54)                      |
| **Architecture**     | Component-Based with Context API                |
| **Navigation**       | React Navigation (Native Stack)                 |
| **State Management** | React Context & Hooks                           |
| **Storage**          | AsyncStorage (Local) → SQLite/Supabase (Future) |
| **Language**         | JavaScript (ES6+)                               |
| **Styling**          | StyleSheet API (Responsive Design)              |

---

## 🏃‍♂️ Getting Started

To run this project locally:

1. **Clone the repository:**

   ```bash
   git clone [https://github.com/masternur22/CounterPro.git](https://github.com/mastern1/CounterPro.git)
   ```

   2. **nstall dependencies:**

   ```bash
   npm install
   ```

   3.**Start the app (Clean Cache):**

   ```bash
   npx expo start -c
   ```

   ***

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

Copyright © 2026 **Nour Eddin Sweid**.

---

## 📞 Contact & Contribution

Created by **Nour Eddin Sweid**. For inquiries or collaboration, please contact the developer directly.
