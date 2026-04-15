# Minimal Template

This is a [React Native](https://reactnative.dev/) project built with [Expo](https://expo.dev/) and [React Native Reusables](https://reactnativereusables.com).

It was initialized using the following command:

```bash
npx @react-native-reusables/cli@latest init -t AURA
```

## Getting Started

To run the development server:

```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    # or
    bun dev
```

This will start the Expo Dev Server. Open the app in:

- **iOS**: press `i` to launch in the iOS simulator _(Mac only)_
- **Android**: press `a` to launch in the Android emulator
- **Web**: press `w` to run in a browser

You can scan the QR code in a custom development client built with EAS. Expo Go cannot load SQLCipher-enabled `expo-sqlite` builds.

To create a development client for encrypted local database support:

```bash
pnpm dlx eas build --profile development --platform ios
# or
pnpm dlx eas build --profile development --platform android
```

## Encrypted local database

- Database module: `src/db/`
- SQLCipher key storage: `src/utils/crypto.ts` using `expo-secure-store`
- Schema/migrations: `src/db/schema.sql` and `src/db/migrations/`
- Repository layer: `src/db/repositories/`

### Dev-only unencrypted mode

Set `EXPO_PUBLIC_DB_UNENCRYPTED=true` only in development builds to disable SQLCipher for debugging.

### Security verification checklist

1. Build and install a dev client (`eas build --profile development`).
2. Start the app once to initialize `aura.db` and persist the key in SecureStore.
3. Pull the `.db` file from the app sandbox and try opening it with plain SQLite: reads should fail without key.
4. Relaunch the app and confirm previously written rows still decrypt (SecureStore persistence across restarts).
5. Clear SecureStore (or reinstall app), then relaunch: app should fail fast with a clear local DB/key initialization error.

## Adding components

You can add more reusable components using the CLI:

```bash
npx react-native-reusables/cli@latest add [...components]
```

> e.g. `npx react-native-reusables/cli@latest add input textarea`

If you don't specify any component names, you'll be prompted to select which components to add interactively. Use the `--all` flag to install all available components at once.

## Project Features

- ⚛️ Built with [Expo Router](https://expo.dev/router)
- 🎨 Styled with [Tailwind CSS](https://tailwindcss.com/) via [Nativewind](https://www.nativewind.dev/)
- 📦 UI powered by [React Native Reusables](https://github.com/founded-labs/react-native-reusables)
- 🚀 New Architecture enabled
- 🔥 Edge to Edge enabled
- 📱 Runs on iOS, Android, and Web

## Learn More

To dive deeper into the technologies used:

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [Nativewind Docs](https://www.nativewind.dev/)
- [React Native Reusables](https://reactnativereusables.com)

## Deploy with EAS

The easiest way to deploy your app is with [Expo Application Services (EAS)](https://expo.dev/eas).

- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Updates](https://docs.expo.dev/eas-update/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)

---

If you enjoy using React Native Reusables, please consider giving it a ⭐ on [GitHub](https://github.com/founded-labs/react-native-reusables). Your support means a lot!
