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
import { createDemoCatalog } from '../../src/features/restrooms/fixtures.ts';

const { projectId, host } = readEmulatorConfig();
const root = `projects/${projectId}/databases/(default)/documents`;
const url = `http://${host}/v1/${root}:commit`;
function fields(value) {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [
        key,
        item instanceof Date
          ? { timestampValue: item.toISOString() }
          : item === null
            ? { nullValue: null }
            : typeof item === 'string'
              ? { stringValue: item }
              : typeof item === 'boolean'
                ? { booleanValue: item }
                : typeof item === 'number'
                  ? Number.isInteger(item)
                    ? { integerValue: String(item) }
                    : { doubleValue: item }
                  : Array.isArray(item)
                    ? {
                        arrayValue: {
                          values: item.map((entry) => ({
                            mapValue: { fields: fields(entry) },
                          })),
                        },
                      }
                    : { mapValue: { fields: fields(item) } },
      ]),
  );
}
async function write(records) {
  for (let offset = 0; offset < records.length; offset += 500) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer owner',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        writes: records.slice(offset, offset + 500).map(([path, value]) => ({
          update: { name: `${root}/${path}`, fields: fields(value) },
        })),
      }),
      signal: AbortSignal.timeout(15000),
    });
    assert.equal(response.status, 200, await response.text());
  }
}

test(
  'service summaries cover more than 2000 contributions without returning their bodies',
  { timeout: 120000 },
  async () => {
    const now = Date.parse('2026-10-21T04:00:00Z');
    const restroomId = `fictional-summary-${Date.now()}`;
    const restroom = { ...createDemoCatalog(now).restrooms[0], id: restroomId };
    const review = (index) => ({
      restroomId,
      authorId: `fixture-${index}`,
      authorName: 'Fictional aggregate visitor',
      overall: index % 2 ? 5 : 4,
      suppressed: false,
      updatedAt: new Date(
        index === 3
          ? now - 30 * 86400000
          : index === 4
            ? now + 86400000
            : now - 3600000,
      ),
      ...(index < 2 ? { cleanliness: index ? 4 : 2 } : {}),
      ...(index === 0 ? { supplies: 5 } : {}),
      ...(index < 5 ? { desperateTimes: index !== 2 } : {}),
    });
    const records = [[`restrooms/${restroomId}`, restroom]];
    for (let index = 0; index < 2502; index++)
      records.push([`reviews/${restroomId}:fixture-${index}`, review(index)]);
    records.push([
      `reviews/${restroomId}:hidden`,
      { ...review(0), authorId: 'hidden', overall: 1, suppressed: true },
    ]);
    for (let index = 0; index < 2000; index++)
      records.push([
        `reports/${restroomId}-old-${index}`,
        {
          restroomId,
          authorId: 'fixture',
          authorName: 'Fictional report visitor',
          state: 'closed',
          observedAt: new Date(now - 3600000),
          suppressed: false,
        },
      ]);
    for (const [id, state] of [
      ['latest-a', 'closed'],
      ['latest-z', 'usable'],
    ])
      records.push([
        `reports/${restroomId}-${id}`,
        {
          restroomId,
          authorId: 'fixture',
          authorName: 'Fictional report visitor',
          state,
          observedAt: new Date(now - 1000),
          suppressed: false,
        },
      ]);
    await write(records);
    const app = initializeApp(
      { projectId, apiKey: 'fake-emulator-key' },
      `summary-${Date.now()}`,
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
      const snapshot = await repository.load(now);
      const summary = snapshot.reviewSummaries[restroomId];
      assert.deepEqual(summary.overall, { value: 4.5, count: 2502 });
      assert.deepEqual(summary.cleanliness, { value: 3, count: 2 });
      assert.deepEqual(summary.supplies, { value: 5, count: 1 });
      assert.deepEqual(summary.facilityCondition, { value: null, count: 0 });
      assert.equal(summary.desperate.flagged, 2);
      assert.equal(summary.desperate.total, 3);
      assert.equal(summary.desperate.expiresAt, now - 3600000 + 30 * 86400000);
      assert.deepEqual(snapshot.reviews, []);
      const latest = snapshot.reports.filter(
        (report) => report.restroomId === restroomId,
      );
      assert.equal(latest.length, 1);
      assert.equal(latest[0].id, `${restroomId}-latest-z`);
      assert.equal(latest[0].state, 'usable');
      await write([
        [
          `reviews/${restroomId}:fixture-0`,
          { ...review(0), desperateTimes: false },
        ],
      ]);
      const edited = await repository.load(now);
      assert.equal(edited.reviewSummaries[restroomId].desperate.flagged, 1);
      assert.equal(edited.reviewSummaries[restroomId].desperate.total, 3);
      assert.equal(edited.reviewSummaries[restroomId].overall.count, 2502);
      await write([
        [`reviews/${restroomId}:fixture-1`, { ...review(1), suppressed: true }],
      ]);
      const moderated = await repository.load(now);
      assert.equal(moderated.reviewSummaries[restroomId].overall.count, 2501);
      assert.deepEqual(moderated.reviewSummaries[restroomId].cleanliness, {
        value: 2,
        count: 1,
      });
    } finally {
      await terminate(db);
      await deleteApp(app);
    }
  },
);
