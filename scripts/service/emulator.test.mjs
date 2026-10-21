import assert from 'node:assert/strict';
import test from 'node:test';
import { readEmulatorConfig } from './config.mjs';

const { projectId, host } = readEmulatorConfig();
const base = `http://${host}/v1/projects/${projectId}/databases/(default)/documents`;
const publishedId = 'fictional-emulator-restroom';
const draftId = 'fictional-emulator-draft';
const fields = {
  name: { stringValue: 'Fictional Emulator Restroom — NOT A REAL FACILITY' },
  state: { stringValue: 'published' },
  fictional: { booleanValue: true },
  id: { stringValue: publishedId },
  building: { stringValue: 'Fictional test building' },
  floor: { stringValue: 'Ground' },
  address: { stringValue: 'Emulator only — no real address' },
  entrance: {
    mapValue: {
      fields: { latitude: { doubleValue: 0 }, longitude: { doubleValue: 0 } },
    },
  },
  timezone: { stringValue: 'Asia/Manila' },
  attributes: {
    mapValue: {
      fields: {
        bidet: { stringValue: 'unknown' },
        wheelchair: { stringValue: 'unknown' },
        babyChanging: { stringValue: 'unknown' },
        gender: { stringValue: 'unknown' },
      },
    },
  },
  access: {
    mapValue: {
      fields: {
        fee: { stringValue: 'unknown' },
        customerOnly: { nullValue: null },
      },
    },
  },
};

async function request(path, { owner = false, token, ...options } = {}) {
  return fetch(`${base}/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(owner
        ? { Authorization: 'Bearer owner' }
        : token
          ? { Authorization: `Bearer ${token}` }
          : {}),
    },
    signal: AbortSignal.timeout(10000),
  });
}

// Emulator's owner token is a local rules bypass, never a cloud credential.
async function seed(id, documentFields) {
  const response = await request(`restrooms/${id}`, {
    owner: true,
    method: 'PATCH',
    body: JSON.stringify({ fields: documentFields }),
  });
  assert.equal(response.status, 200, await response.text());
}

test('guest reads a fictional published restroom while drafts and catalog writes stay protected', async () => {
  await seed(publishedId, fields);
  await seed(draftId, {
    ...fields,
    id: { stringValue: draftId },
    state: { stringValue: 'pending' },
  });
  const published = await request(`restrooms/${publishedId}`);
  assert.equal(published.status, 200);
  const document = await published.json();
  assert.equal(
    document.fields.name.stringValue,
    'Fictional Emulator Restroom — NOT A REAL FACILITY',
  );
  assert.equal(
    document.fields.attributes.mapValue.fields.wheelchair.stringValue,
    'unknown',
  );

  assert.equal((await request(`restrooms/${draftId}`)).status, 403);
  assert.equal(
    (
      await request(`restrooms/${publishedId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fields: { ...fields, name: { stringValue: 'Tampered' } },
        }),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(`restrooms/unauthorized-new`, {
        method: 'PATCH',
        body: JSON.stringify({ fields }),
      })
    ).status,
    403,
  );
  assert.equal(
    (await request(`restrooms/${publishedId}`, { method: 'DELETE' })).status,
    403,
  );
  assert.equal((await request('moderationFlags/private')).status, 403);

  const authHost = readEmulatorConfig({
    FIRESTORE_EMULATOR_HOST:
      process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099',
  }).host;
  const account = await fetch(
    `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-emulator-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `catalog-check-${Date.now()}@example.invalid`,
        password: 'local-test-password',
        returnSecureToken: true,
      }),
      signal: AbortSignal.timeout(10000),
    },
  );
  assert.equal(account.status, 200, await account.clone().text());
  const { idToken } = await account.json();
  assert.equal(typeof idToken, 'string');
  assert.equal(
    (
      await request(`restrooms/${publishedId}`, {
        token: idToken,
        method: 'PATCH',
        body: JSON.stringify({ fields }),
      })
    ).status,
    403,
  );
  assert.equal(
    (await request('moderationFlags/private', { token: idToken })).status,
    403,
  );
});
