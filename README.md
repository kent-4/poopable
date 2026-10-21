# Poopable

Expo SDK 58 / React Native application. The initial Expo Router route opens discovery. The design preview remains at `/preview` in development. Shared controls and screens live outside `src/app`; the root layout loads the bundled Quicksand and Nunito fonts before showing the route.

## Install and run

Use Node.js LTS and npm with the committed `package-lock.json`:

```sh
npm ci
EXPO_PUBLIC_DATA_MODE=demo npm start -- --clear
```

Demo mode contains only clearly fictional facilities and session-only accounts/contributions; it does not load launch data. Without an explicit data mode, the app shows catalog setup instructions.

Expo Go must support SDK 58. If the store version does not, use a development build. Local iOS builds require macOS, Xcode, and an installed simulator runtime; local Android builds require the Android SDK and a running emulator:

```sh
npm run ios
# or
npm run android
```

These commands generate native projects through Expo; do not edit generated `ios/` or `android/` files. After installing a development build, start Metro for subsequent JavaScript changes:

```sh
npm start -- --dev-client
```

Press `i` for the iOS simulator or `a` for the Android emulator. Rebuild the development app after changing native dependencies or native configuration.

## Validate

```sh
npm run lint
npm run typecheck
npx expo-doctor
npx expo export --platform ios --output-dir dist/ios
npx expo export --platform android --output-dir dist/android
```

Exports verify that both platform bundles and bundled assets resolve. They do not verify simulator/device startup, font appearance, native permissions, maps, or external directions. On each installed build, verify discovery, manual search after location denial, detail, and external directions. The `/preview` reference still supports its save/reset interaction. See [native smoke checks](docs/development/native-smoke.md).

Missing icon and favicon references have been removed. Expo currently supplies default app icons; approved native branding remains a separate prerequisite.

Router setup follows [Expo's manual installation guide](https://docs.expo.dev/router/installation/) and the [SDK 58 reference](https://docs.expo.dev/versions/v58.0.0/).
