import assert from 'node:assert/strict';
import test from 'node:test';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  terminate,
} from 'firebase/firestore';
import { readEmulatorConfig } from './config.mjs';
import { writeFixtures } from './fixtures.mjs';
import { createDemoCatalog } from '../../src/features/restrooms/fixtures.ts';

test(
  'radius queries isolate nearby results, circle corners, date-line crossings, poles and direct history',
  { timeout: 120000 },
  async () => {
    const { projectId, host } = readEmulatorConfig();
    const now = Date.parse('2026-10-22T04:00:00Z');
    const prefix = `fictional-scope-${Date.now()}`;
    const base = createDemoCatalog(now).restrooms[0];
    const facility = (
      id,
      latitude,
      longitude,
      state = 'published',
      name = id,
    ) => ({
      ...base,
      id: `${prefix}-${id}`,
      name,
      state,
      entrance: { latitude, longitude },
    });
    const listings = [
      facility('inside', 0.005, 0.005),
      facility('edge', 0.0089, 0),
      facility('corner', 0.0085, 0.0085),
      facility('far', 0.014, 0),
      facility('draft', 0, 0, 'pending'),
      facility('permanent', 0, 0, 'permanently-closed'),
      facility('date-east', 0, 179.999),
      facility('date-west', 0, -179.999),
      facility('date-far', 0, -179.98),
      facility('pole-zero', 89.999, 0),
      facility('pole-other', 89.999, 180),
      ...Array.from({ length: 320 }, (_, index) =>
        facility(
          `remote-${String(index).padStart(3, '0')}`,
          40,
          50 + index / 10000,
        ),
      ),
      facility('zz-needle', 40, 50, 'published', 'Remote needle location'),
    ];
    await writeFixtures(listings.map((item) => [`restrooms/${item.id}`, item]));
    const app = initializeApp(
      { projectId, apiKey: 'fake-emulator-key' },
      `discovery-${Date.now()}`,
    );
    const auth = getAuth(app);
    const authHost = readEmulatorConfig({
      FIRESTORE_EMULATOR_HOST:
        process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099',
    }).host;
    connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
    const db = getFirestore(app);
    const [hostname, port] = host.split(':');
    connectFirestoreEmulator(db, hostname, Number(port));
    try {
      const { createFirebaseServices } =
        await import('../../src/features/restrooms/firebase.ts');
      const { repository } = createFirebaseServices(auth, db);
      const ids = (snapshot) =>
        snapshot.restrooms
          .map((item) => item.id.replace(`${prefix}-`, ''))
          .sort();
      assert.deepEqual(ids(await repository.load(now)), []);
      assert.deepEqual(
        ids(
          await repository.load(now, {
            center: { latitude: 0, longitude: 0 },
            radiusKm: 1,
          }),
        ),
        ['edge', 'inside'],
      );
      assert.deepEqual(
        ids(
          await repository.load(now, {
            center: { latitude: 0, longitude: 0 },
            radiusKm: 2,
          }),
        ),
        ['corner', 'edge', 'far', 'inside'],
      );
      assert.deepEqual(
        ids(
          await repository.load(now, {
            center: { latitude: 0, longitude: 179.999 },
            radiusKm: 1,
          }),
        ),
        ['date-east', 'date-west'],
      );
      assert.deepEqual(
        ids(
          await repository.load(now, {
            center: { latitude: 90, longitude: 170 },
            radiusKm: 1,
          }),
        ),
        ['pole-other', 'pole-zero'],
      );
      assert.deepEqual(
        ids(
          await repository.load(now, {
            center: null,
            radiusKm: 1,
            detailId: `${prefix}-permanent`,
          }),
        ),
        ['permanent'],
      );
      assert.deepEqual(
        ids(
          await repository.load(now, {
            center: { latitude: 0, longitude: 0 },
            radiusKm: 2,
            detailId: `${prefix}-permanent`,
          }),
        ),
        ['permanent'],
      );
      assert.deepEqual(
        ids(
          await repository.load(now, {
            center: null,
            radiusKm: 1,
            detailId: `${prefix}-missing`,
          }),
        ),
        [],
      );
      await assert.rejects(
        repository.load(now, {
          center: { latitude: 40, longitude: 50 },
          radiusKm: 1,
        }),
        /too many listings/,
      );
      const first = await repository.findLocations('Remote needle');
      assert.equal(first.items.length, 0);
      assert.ok(first.next);
      const second = await repository.findLocations(
        'REMOTE NEEDLE',
        first.next,
      );
      assert.deepEqual(
        second.items.map((item) => item.id),
        [`${prefix}-zz-needle`],
      );
      assert.equal(second.next, null);
      await assert.rejects(
        repository.findLocations('another query', first.next),
        /Invalid location cursor/,
      );
      await assert.rejects(
        repository.load(now, {
          center: { latitude: 91, longitude: 0 },
          radiusKm: 1,
        }),
        /Invalid search area/,
      );
    } finally {
      await terminate(db);
      await deleteApp(app);
    }
  },
);
