import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import { AppState, Linking, Platform } from 'react-native';
import type { ExperienceDependencies, Coordinates, Restroom } from '../types';

/** Called only by the experience's explicit current-location action. Never watches location. */
export const nativeLocation: ExperienceDependencies['location'] = {
  async locate() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      throw new Error(
        'Location permission is unavailable. Choose a search area manually.',
      );
    }
    if (!(await Location.hasServicesEnabledAsync())) {
      throw new Error(
        'Location services are off. Choose a search area manually or enable them in Settings.',
      );
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const position = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: false,
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(
                  'Location timed out. Choose a search area manually or try again.',
                ),
              ),
            12000,
          );
        }),
      ]);
      const coordinates: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      if (
        !Number.isFinite(coordinates.latitude) ||
        !Number.isFinite(coordinates.longitude) ||
        Math.abs(coordinates.latitude) > 90 ||
        Math.abs(coordinates.longitude) > 180
      ) {
        throw new Error(
          'Location is unavailable. Choose a search area manually.',
        );
      }
      return coordinates;
    } finally {
      if (timer) clearTimeout(timer);
    }
  },
};

function destination(restroom: Restroom) {
  const { latitude, longitude } = restroom.entrance;
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    throw new Error('This restroom has no valid entrance coordinates.');
  }
  return `${latitude},${longitude}`;
}

export const nativeDirections: ExperienceDependencies['directions'] = {
  async open(restroom) {
    const coordinates = destination(restroom);
    const url =
      Platform.OS === 'ios'
        ? `maps://?daddr=${coordinates}&dirflg=w`
        : `geo:0,0?q=${coordinates}(${encodeURIComponent(restroom.name)})`;
    // openURL rejects if no installed handler exists; the experience then offers Copy destination.
    await Linking.openURL(url);
  },
  async copy(restroom) {
    const coordinates = destination(restroom);
    const copied = await Clipboard.setStringAsync(
      `${restroom.name}\n${restroom.floor}\n${restroom.address}\nEntrance: ${coordinates}`,
    );
    if (!copied) throw new Error('Unable to copy the destination.');
  },
};

/** Foreground refresh signal; the experience schedules exact domain expiry boundaries. */
export const nativeClock: ExperienceDependencies['clock'] = {
  now: () => Date.now(),
  subscribe(listener) {
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') listener();
    }, 30000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') listener();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  },
};
