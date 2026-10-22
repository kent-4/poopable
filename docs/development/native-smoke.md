# Native map, location, and directions smoke check

The native adapter uses installed `react-native-maps`: Apple Maps on iOS, Google Maps on Android. It shows only the experience's bounded result set; the accessible list uses the same results. Numbered markers identify list order; selection adds a checkmark and changes shape. Marker descriptions accept the experience's observed condition text. Provider attribution remains inside the unobscured map surface.

Location is requested only by the explicit current-location action, with foreground permission. No background permission or watcher is configured. A one-shot fix times out after 12 seconds; an eventual late result cannot change the search. Denial, disabled services, and timeouts leave named catalog area selection and map panning available. Latitude/longitude search inputs have been removed. The operating system permission prompt itself waits for the user's choice.

## Try maps in Expo Go

With an Expo Go installation supporting SDK 58, run:

```sh
EXPO_PUBLIC_DATA_MODE=demo npm start -- --go
```

Open the app in Expo Go on iOS or Android. No project-owned Maps API key is needed for Expo Go. Use **Use my location**, **Choose search area** to select a catalog location by name, or pan the map and tap **Search this area**. Without a search center the map starts with a world overview; that viewport is not treated as your location or applied to discovery until you choose an area. Text search matches the loaded restroom catalog's names/buildings/addresses, not arbitrary Google Places.

## Configuration

No project-owned Google Maps credentials were found or provisioned. Android development/standalone builds retain list discovery without mounting a Google Map that could crash for a missing API key; Expo Go uses its bundled maps configuration. In Google Cloud, enable **Maps SDK for Android**, create an API key, and restrict it to package `com.anonymous.poopableapp`, the installed build's SHA-1 signing certificate, and that API. Set `MAPS_ANDROID_API_KEY` in `.env.local` for local builds or in the EAS build environment, then rebuild the native app. `app.config.ts` already supplies the map config plugin and exposes only an availability boolean to the app. A Metro reload alone cannot install native map configuration. This public client key is not an authorization mechanism. No billing or cloud resources are created here.

Keep iOS's existing bundle identifier `com.anonymous.poopable-app` for development. Confirm owner-selected identifiers before release. iOS uses Apple Maps and needs no Google key. App config includes a foreground-only explanation; regenerate native projects through Expo after configuration changes.

## Reproduce on installed builds

```sh
npm ci
npm run ios
# Android SDK, running emulator, and approved restricted key required for native map:
npm run android
npm start -- --dev-client
```

Use the explicitly fictional demo catalog; fixtures are not launch listings. On both platforms:

1. Launch without accepting location. Use **Choose search area** and select a catalog location by name, or pan the world overview and apply **Search this area**. Switch Map/List and verify matching result identities/order. No coordinate-entry form appears.
2. On iOS (or configured Android), confirm map tiles, attribution, marker labels and selected shape; select a marker and open its summary/detail.
3. Pan: results stay unchanged until **Search this area**. Apply it and confirm shared list/map center. Change radius and verify bounded results.
4. Choose current location; deny permission and confirm named area selection still works. Retry only through an explicit action. With location services off or no simulator fix, confirm clear recovery after timeout.
5. Disable networking. Use **Map not loading? Use list** if tiles fail; confirm listing data and manual controls remain usable. A map that never initializes offers the list after 18 seconds.
6. From a selected detail, choose Directions. Confirm the external app receives that restroom's entrance coordinates. If no handler exists, confirm the experience offers **Copy destination**, then paste and check name, floor, address, and entrance coordinates.
7. Check large text, VoiceOver/TalkBack list discovery, keyboard/sheet behavior, safe-area actions, and one successful review/report save in the emulator service environment.
8. Background and resume across a two-hour usability/30-day assessment boundary; confirm time-derived information refreshes. Native clock signals foreground resume and every 30 seconds while active; provider scheduling handles exact expiry boundaries.

## Evidence

On 2026-10-22, the installed `com.anonymous.poopable-app` development build on the iPhone 16 simulator running iOS 18.6 reproduced a missing map area with the app in unconfigured-catalog mode. The map and Map/List controls were below the tall setup/search panels in the scroll header. Moving those controls and the map immediately below the compact brand header exposed a working Apple Maps view with tiles and attribution without changing provider configuration. A fresh launch confirmed the final layout, and the native visibility check passed. This verifies initial iOS map visibility and tile rendering only; the remaining device scenarios above still require their own evidence.

The native visibility regression check reads the actual initial simulator viewport, because rendered JavaScript tests do not perform native layout:

```sh
xcrun simctl io booted screenshot /tmp/poopable-map.png
swift -module-cache-path /tmp/poopable-swift-cache scripts/diagnostics/map-visible.swift /tmp/poopable-map.png
```

Open the discovery screen at its initial scroll position in Map mode first. The check fails if the map's visible footer control is outside the viewport or the live map has fallen back. It does not establish tile connectivity by itself. The original screenshot produced `FAIL: native map controls absent from viewport`; the corrected native screen must produce `PASS: native map controls visible in viewport`. This macOS/Vision diagnostic is separate from the Jest suite.

Automated lint/typecheck and platform exports validate code and assets, not native behavior. Apart from the initial iOS map visibility evidence above, the remaining installed-build smoke steps are pending until recorded with build identifier, device/OS, date, and result. Android native map verification additionally depends on an approved restricted key.

Sources: [SDK 58 maps](https://docs.expo.dev/versions/v58.0.0/sdk/map-view/), [location](https://docs.expo.dev/versions/v58.0.0/sdk/location/), [clipboard](https://docs.expo.dev/versions/v58.0.0/sdk/clipboard/), [React Native Linking](https://reactnative.dev/docs/linking), and [AppState](https://reactnative.dev/docs/appstate).
