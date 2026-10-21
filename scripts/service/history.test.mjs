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

// These fixtures use the emulator's local owner-token bypass, never cloud credentials.
const { projectId, host } = readEmulatorConfig();
const base = `http://${host}/v1/projects/${projectId}/databases/(default)/documents`;
async function seed(kind, id, restroomId, index, suppressed = false) {
  const timeField = kind === 'reviews' ? 'updatedAt' : 'observedAt';
  const response = await fetch(`${base}/${kind}/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        restroomId: { stringValue: restroomId },
        authorId: { stringValue: id },
        authorName: { stringValue: 'Fictional history visitor' },
        suppressed: { booleanValue: suppressed },
        // Firestore stores microsecond precision; both groups are in the same millisecond.
        [timeField]: {
          timestampValue: `2026-10-20T00:00:00.${index >= 10 ? '000998000' : '000999000'}Z`,
        },
        ...(kind === 'reviews'
          ? { overall: { integerValue: '4' }, notes: { stringValue: id } }
          : { state: { stringValue: 'usable' } }),
      },
    }),
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(response.status, 200, await response.text());
}

test(
  'facility history pages preserve nanosecond cursors, tie order, suppression, and retry identity',
  { timeout: 30000 },
  async () => {
    const app = initializeApp(
      { projectId, apiKey: 'fake-emulator-key' },
      `history-${Date.now()}`,
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
      const restroomId = `fictional-history-${Date.now()}`;
      for (const kind of ['reviews', 'reports']) {
        const prefix = `${restroomId}-${kind}`;
        for (let index = 0; index < 12; index++)
          await seed(
            kind,
            `${prefix}-${String(index).padStart(2, '0')}`,
            restroomId,
            index,
          );
        await seed(kind, `${prefix}-suppressed`, restroomId, 20, true);
        await seed(kind, `${prefix}-unrelated`, `${restroomId}-other`, 20);
        const load =
          kind === 'reviews' ? repository.loadReviews : repository.loadReports;
        const first = await load(restroomId);
        assert.equal(first.items.length, 10);
        assert.equal(first.items[0].id, `${prefix}-09`);
        assert.equal(first.items[9].id, `${prefix}-00`);
        assert.equal(first.next.nanoseconds, 999000);
        const second = await load(restroomId, first.next);
        assert.deepEqual(
          second.items.map((item) => item.id),
          [`${prefix}-11`, `${prefix}-10`],
        );
        assert.equal(second.next, null);
        assert.deepEqual(await load(restroomId, first.next), second);
        await assert.rejects(
          load(`${restroomId}-other`, first.next),
          /Invalid history cursor/,
        );
        await assert.rejects(
          load(restroomId, {
            ...first.next,
            kind: kind === 'reviews' ? 'reports' : 'reviews',
          }),
          /Invalid history cursor/,
        );
      }
    } finally {
      await terminate(db);
      await deleteApp(app);
    }
  },
);
