import assert from 'node:assert/strict';
import test from 'node:test';
import { readEmulatorConfig } from './config.mjs';

test('development service cannot target a production project or remote host', () => {
  assert.throws(
    () => readEmulatorConfig({ POOPABLE_FIREBASE_PROJECT_ID: 'production' }),
    /demo-/,
  );
  assert.throws(
    () => readEmulatorConfig({ FIRESTORE_EMULATOR_HOST: 'example.com:8080' }),
    /loopback/,
  );
  assert.throws(
    () => readEmulatorConfig({ FIRESTORE_EMULATOR_HOST: '127.0.0.1:0' }),
    /port/,
  );
  assert.deepEqual(readEmulatorConfig({}), {
    projectId: 'demo-poopable',
    host: '127.0.0.1:8080',
  });
});
