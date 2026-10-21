import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { createFirebaseServices } from './firebase';

/** Explicit opt-in only. Public configuration grants no database permissions. */
export function createConfiguredServices() {
  const mode = process.env.EXPO_PUBLIC_DATA_MODE;
  if (mode !== 'firebase' && mode !== 'emulator') return undefined;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
  if (!projectId || !apiKey)
    throw new Error('Configure a Firebase project ID and public API key.');
  if (
    mode === 'emulator' &&
    (!projectId.startsWith('demo-') ||
      !emulatorHost ||
      !/^[a-zA-Z0-9.-]+$/.test(emulatorHost))
  )
    throw new Error(
      'Emulator mode requires a demo project and explicit emulator hostname or IP.',
    );
  if (
    mode === 'firebase' &&
    (projectId.startsWith('demo-') || emulatorHost || !authDomain)
  )
    throw new Error(
      'Live Firebase requires an auth domain and cannot use emulator configuration.',
    );
  const name = `poopable-${mode}`;
  const existing = getApps().some((app) => app.name === name);
  const app = existing
    ? getApp(name)
    : initializeApp({ projectId, apiKey, authDomain }, name);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (mode === 'emulator' && !existing) {
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, emulatorHost!, 8080);
  }
  return createFirebaseServices(auth, db);
}
