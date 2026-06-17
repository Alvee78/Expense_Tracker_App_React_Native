<div align="center">

# 📒 Expense & Budget Tracker (testlog)

Smart personal finance tracking app built with Expo (SDK 53), React Native & TypeScript.

![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS%20%7C%20Web-informational) ![Expo](https://img.shields.io/badge/Expo-53.0.0-000020?logo=expo) ![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript) ![License](https://img.shields.io/badge/license-MIT-green)

</div>

## ✨ Features

- 🔐 Authentication flow (sign in / sign up screens under `app/(auth)`)
- 🏠 Home dashboard with recent expenses & quick actions (`app/(tabs)/home.tsx`)
- ➕ Add / ✏️ Update transactions (create & edit forms)
- 💰 Budget view & tracking (`budget.tsx`)
- 📊 Charts (spending visualization) (`chart.tsx`)
- 🎛 Theming (light / dark via `ThemeContext` + custom colors in `constants/Colors.ts`)
- 🗂 File‑based routing with `expo-router`
- 💾 Local persistence (SQLite via `expo-sqlite` / service layer in `services/DatabaseService.ts`)
- 🔁 Planned sync layer (placeholder logic in log outputs)
- 🧭 Custom tab bar (`components/CustomTabBar.tsx`)
- 🧱 Reusable UI primitives (Typography, Buttons, Screen wrappers)
- 💤 Splash & loading screens
- ♿ Safe area & adaptive layout (`react-native-safe-area-context`)

## 🏗 Tech Stack

| Layer | Tools |
|-------|-------|
| Core Runtime | React Native, Expo SDK 53 |
| Language | TypeScript |
| Navigation | `expo-router` (file‑based) |
| UI / Animations | Reanimated, Gesture Handler, Safe Area Context |
| State / Context | React Context (Theme) |
| Data | SQLite (`expo-sqlite`) |
| Auth (basic) | Local (placeholder – extendable) |
| Charts | (Pluggable – current screen stub) |
| Build | Metro + Gradle (Android) |
| Distribution | Debug / Release APK (manual) or EAS |

## 📂 Project Structure (trimmed)

```
app/
   _layout.tsx               # Root layout for expo-router
   (auth)/                   # Auth stack
   (home)/                   # Pre-auth welcome / getting started
   (tabs)/                   # Main tabbed application
components/                 # Reusable UI components
constants/Colors.ts         # Theme color definitions
context/ThemeContext.tsx    # Theme state provider
services/DatabaseService.ts # SQLite helper & schema logic
services/MagicWord.ts       # Example utility / placeholder
services/server.ts          # (Future) sync / backend placeholder
scripts/reset-project.js    # Reset helper
android/                    # Generated native project (after prebuild)
```

## 🚀 Getting Started

### 1. Prerequisites

- Node.js LTS (>= 18)
- npm (bundled) or yarn / pnpm
- Java 17 (for Gradle / native build)
- Android SDK + at least one emulator (if building locally)
- Git

### 2. Install Dependencies

```bash
npm install
```

### 3. Run (Metro + Expo)

```bash
npx expo start
```

Press `a` for Android emulator, `w` for web, or scan the QR code with Expo Go (limitations apply vs dev build).

### 4. Create / Refresh Native Android Project (if changed native mods)

```bash
npx expo prebuild
# or fully clean & regenerate
npx expo prebuild --clean
```

### 5. Debug APK (Manual Gradle)

```bash
cd android
./gradlew assembleDebug
```
APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

## 🔐 Release (Signed) Build

1. Generate keystore (run inside project root):
    ```bash
    keytool -genkeypair -v -storetype PKCS12 -keystore app-upload-keystore.p12 -alias upload -keyalg RSA -keysize 2048 -validity 3650
    ```
2. Move keystore to `android/app/` (DO NOT COMMIT).
3. Add to `android/gradle.properties` (create secrets outside VCS if possible):
    ```properties
    MYAPP_UPLOAD_STORE_FILE=app-upload-keystore.p12
    MYAPP_UPLOAD_STORE_PASSWORD=********
    MYAPP_UPLOAD_KEY_ALIAS=upload
    MYAPP_UPLOAD_KEY_PASSWORD=********
    ```
4. In `android/app/build.gradle` add signing config (if not present):
    ```gradle
    android {
       signingConfigs {
          release {
             storeFile file(System.getenv("MYAPP_UPLOAD_STORE_FILE") ?: project.properties["MYAPP_UPLOAD_STORE_FILE"])
             storePassword System.getenv("MYAPP_UPLOAD_STORE_PASSWORD") ?: project.properties["MYAPP_UPLOAD_STORE_PASSWORD"]
             keyAlias System.getenv("MYAPP_UPLOAD_KEY_ALIAS") ?: project.properties["MYAPP_UPLOAD_KEY_ALIAS"]
             keyPassword System.getenv("MYAPP_UPLOAD_KEY_PASSWORD") ?: project.properties["MYAPP_UPLOAD_KEY_PASSWORD"]
          }
       }
       buildTypes {
          release {
             signingConfig signingConfigs.release
             minifyEnabled true
             shrinkResources true
             proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
          }
       }
    }
    ```
5. Build:
    ```bash
    cd android
    ./gradlew clean assembleRelease
    ```
6. Find APK: `android/app/build/outputs/apk/release/app-release.apk`
7. Test on device (enable installs from unknown sources) before sharing.

### (Optional) EAS Build Cloud
```bash
npx expo install eas-cli
eas login
eas build -p android --profile production
```

## 🗄 Data Layer

`DatabaseService.ts` centralizes SQLite access. Extend it for migrations (e.g., version table) and add indexes for performance on large datasets.

## 🎨 Theming

Light/dark + custom palette. Use helper hooks in `hooks/` (`useThemeColor`) for consistent color usage.

## 🧪 Testing (Suggested Next Steps)

Add Jest + React Native Testing Library for component/unit tests:
```bash
npm install -D jest @testing-library/react-native @types/jest jest-expo
```
Configure in a future PR.

## 🛠 Useful Scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Launch Expo dev server |
| `npm run android` | Open on Android (Expo) |
| `npm run reset-project` | Reset starter scaffold |
| `expo prebuild --clean` | Regenerate native project |

## 🔍 Troubleshooting

| Problem | Fix |
|---------|-----|
| Long path / CMake failure on Windows | Move project to a short path (e.g. `C:\ExpenseApp`) & regenerate `android/` |
| Missing native view managers (e.g., RNSVG*) | `rm -rf node_modules && npm install && npx expo prebuild --clean` |
| Metro stuck / transform-worker missing | Full reinstall + clear caches (`npx expo start -c`) |
| Gradle out of memory | Increase heap: `ORG_GRADLE_JAVAOPTS=-Xmx4g` in `gradle.properties` |

## 📦 Release Distribution (GitHub)

1. Build signed release APK
2. Create a GitHub Release (tag `vX.Y.Z`)
3. Attach APK & write changelog
4. Add download badge to this README (example below once asset exists):
    ```markdown
    [![Download APK](https://img.shields.io/github/v/release/Alvee78/testlog?label=Download%20APK)](https://github.com/Alvee78/testlog/releases)
    ```

## 🗺 Roadmap

- [ ] Category management & icons
- [ ] Advanced charts (weekly / category breakdown)
- [ ] Recurring transactions
- [ ] Export (CSV / PDF)
- [ ] Push notifications (budget thresholds)

## 🤝 Contributing

PRs welcome. Please open an issue first for significant changes.

## 📜 License

MIT. See `LICENSE` (add one if not present).

## 🙌 Acknowledgements

Built with the Expo & React Native ecosystem. Fonts and images are local assets under `./assets`.

---

Happy budgeting! 💸

