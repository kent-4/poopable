# Native map, location, and directions smoke check

The native adapter uses installed `react-native-maps`: Apple Maps on iOS, Google Maps on Android. It shows only the experience's bounded result set; the accessible list uses the same results. Numbered markers identify list order; selection adds a checkmark and changes shape. Marker descriptions accept the experience's observed condition text. Provider attribution remains inside the unobscured map surface.

Location is requested only by the explicit current-location action, with foreground permission. No background permission or watcher is configured. A one-shot fix times out after 12 seconds; an eventual late result cannot change the search. Denial, disabled services, and timeouts leave manual search available. The operating system permission prompt itself waits for the user's choice.

## Configuration

No Google Maps credentials were found or provisioned. Android therefore retains list discovery without mounting a Google Map that could crash for a missing API key. Once an authorized Maps SDK for Android key exists, restrict it to package `com.anonymous.poopableapp`, the installed build's SHA-1 signing certificate, and the Maps SDK for Android API. Set `MAPS_ANDROID_API_KEY` in the build environment and rebuild. `app.config.ts` supplies the native map config plugin and exposes only an availability boolean to the app. This public client key is not an authorization mechanism. No billing or cloud resources are created here.

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

1. Launch without accepting location. Select a manual search area, switch Map/List, and verify matching result identities/order.
2. On iOS (or configured Android), confirm map tiles, attribution, marker labels and selected shape; select a marker and open its summary/detail.
3. Pan: results stay unchanged until **Search this area**. Apply it and confirm shared list/map center. Change radius and verify bounded results.
4. Choose current location; deny permission and confirm manual search still works. Retry only through an explicit action. With location services off or no simulator fix, confirm clear recovery after timeout.
5. Disable networking. Use **Map not loading? Use list** if tiles fail; confirm listing data and manual controls remain usable. A map that never initializes offers the list after 18 seconds.
6. From a selected detail, choose Directions. Confirm the external app receives that restroom's entrance coordinates. If no handler exists, confirm the experience offers **Copy destination**, then paste and check name, floor, address, and entrance coordinates.
7. Check large text, VoiceOver/TalkBack list discovery, keyboard/sheet behavior, safe-area actions, and one successful review/report save in the emulator service environment.
8. Background and resume across a two-hour usability/30-day assessment boundary; confirm time-derived information refreshes. Native clock signals foreground resume and every 30 seconds while active; provider scheduling handles exact expiry boundaries.

## Evidence

Automated lint/typecheck and platform exports validate code and assets, not native behavior. Installed-build iOS and Android steps above remain pending until explicitly recorded with build identifier, device/OS, date, and result. Android native map verification additionally depends on an approved restricted key. No installed-build success is claimed by this document.

Sources: [SDK 58 maps](https://docs.expo.dev/versions/v58.0.0/sdk/map-view/), [location](https://docs.expo.dev/versions/v58.0.0/sdk/location/), [clipboard](https://docs.expo.dev/versions/v58.0.0/sdk/clipboard/), [React Native Linking](https://reactnative.dev/docs/linking), and [AppState](https://reactnative.dev/docs/appstate).
