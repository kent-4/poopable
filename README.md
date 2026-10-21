# Poopable

Expo SDK 58 / React Native application. The initial Expo Router route currently opens the design preview. Shared controls and screens live outside `src/app`; the root layout loads the bundled Quicksand and Nunito fonts before showing the route.

## Install and run

Use Node.js LTS and npm with the committed `package-lock.json`:

```sh
npm ci
npm start -- --clear
```

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

Exports verify that both platform bundles and bundled assets resolve. They do not verify simulator/device startup, font appearance, native permissions, maps, or external directions. On each installed build, confirm that the preview loads in its bundled fonts, saving changes the visible saved state, and Reset restores it.

Missing icon and favicon references have been removed. Expo currently supplies default app icons; approved native branding remains a separate prerequisite.

Router setup follows [Expo's manual installation guide](https://docs.expo.dev/router/installation/) and the [SDK 58 reference](https://docs.expo.dev/versions/v58.0.0/).
