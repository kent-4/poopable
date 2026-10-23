import * as Location from 'expo-location';
import { nativeLocation } from './adapters';

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

const unavailable = new Error(
  "Calling the 'getCurrentPositionAsync' function has failed → Caused by: Cannot obtain current location → Caused by: The operation couldn’t be completed. (kCLErrorDomain error 0.)",
);
const position = { coords: { latitude: 14.55, longitude: 121.02 } };

beforeEach(() => {
  jest.useFakeTimers();
  jest.resetAllMocks();
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
    granted: true,
  } as Location.LocationPermissionResponse);
  jest.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(true);
});

afterEach(() => jest.useRealTimers());

test('permission denial gives Settings guidance without requesting coordinates', async () => {
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
    granted: false,
    canAskAgain: false,
  } as Location.LocationPermissionResponse);
  await expect(nativeLocation.locate()).rejects.toThrow(
    'Enable it in Settings',
  );
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
});

test('disabled services leave manual area selection available', async () => {
  jest.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(false);
  await expect(nativeLocation.locate()).rejects.toThrow(
    'Location services are off',
  );
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
});

test('a request that never settles times out without starting another request later', async () => {
  let rejectRequest!: (error: Error) => void;
  jest.mocked(Location.getCurrentPositionAsync).mockImplementation(
    () =>
      new Promise((_, reject) => {
        rejectRequest = reject;
      }),
  );
  const check = expect(nativeLocation.locate()).rejects.toThrow(
    'Location timed out',
  );
  await jest.advanceTimersByTimeAsync(12000);
  await check;
  rejectRequest(unavailable);
  await jest.advanceTimersByTimeAsync(1000);
  expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
});

test('a temporary native location failure recovers on a bounded retry', async () => {
  jest
    .mocked(Location.getCurrentPositionAsync)
    .mockRejectedValueOnce(unavailable)
    .mockResolvedValueOnce(position as Location.LocationObject);
  const result = nativeLocation.locate();
  const check = expect(result).resolves.toEqual({
    latitude: 14.55,
    longitude: 121.02,
  });
  await jest.advanceTimersByTimeAsync(1000);
  await check;
});

test('persistent native failure returns recovery guidance without native internals', async () => {
  jest.mocked(Location.getCurrentPositionAsync).mockRejectedValue(unavailable);
  const check = expect(nativeLocation.locate()).rejects.toThrow(
    'Your device could not determine its location. Try again with a clearer sky view, or choose a search area manually.',
  );
  await jest.advanceTimersByTimeAsync(1000);
  await check;
});
